import random
import uuid
from io import BytesIO

import bcrypt
from dateutil.relativedelta import relativedelta
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas as pdf_canvas
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User as DjangoUser
from django.db.models import Count, F
from .models import QuizAttempts, QuizAnswers, QuizUnlockRequests, Notifications, SuperAdminLocations
from .models import (
    Users, Enrolments, Courses, Assignments,
    CourseModules, Lessons, Quizzes,
    QuizQuestions, QuizOptions,
    LessonProgress, Certificates
)
from .emails import (
    send_welcome_email,
    send_certificate_email,
    send_unlock_approved_email,
    send_unlock_denied_email,
    send_assignment_reminder_email,
)
from .serializers import (
    UserSerializer, RegisterUserSerializer,
    CourseSerializer, CourseCreateSerializer,
    CourseModuleSerializer, ModuleCreateSerializer,
    LessonSerializer, LessonCreateSerializer,
    QuizSerializer, QuizCreateSerializer,
    QuizQuestionSerializer, QuizQuestionCreateSerializer,
    QuizOptionSerializer, QuizOptionCreateSerializer,
    EnrolmentDetailSerializer,
    CertificateSerializer,
)


# ============================================================
# ROLE CONSTANTS
# ============================================================
HR_ROLES         = ['hr']                                               # HR only
MANAGEMENT_ROLES = ['hr', 'area_manager', 'branch_manager']            # All management
CONTENT_ROLES    = ['hr', 'area_manager']                              # Can CRUD courses/modules
UNLOCK_ROLES     = ['hr', 'area_manager', 'branch_manager']            # Can review unlock requests
ONBOARD_ROLES    = ['hr']                                               # Can onboard/offboard users


# ============================================================
# HELPERS
# ============================================================
def get_academy_user(request):
    try:
        return Users.objects.get(email=request.user.username)
    except Users.DoesNotExist:
        return None


def is_hr(request):
    user = get_academy_user(request)
    return user and user.role in HR_ROLES


def is_management(request):
    user = get_academy_user(request)
    return user and user.role in MANAGEMENT_ROLES


def create_notification(recipient, notif_type, title, message):
    Notifications.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        message=message,
    )


# ============================================================
# LOGIN
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        academy_user = Users.objects.get(email=email, status='active')
    except Users.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    stored_hash = academy_user.password_hash
    if not stored_hash:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    password_correct = bcrypt.checkpw(
        password.encode('utf-8'),
        stored_hash.encode('utf-8')
    )

    if not password_correct:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    django_user, created = DjangoUser.objects.get_or_create(
        username=academy_user.email,
        defaults={'email': academy_user.email}
    )

    academy_user.last_login_at = timezone.now()
    academy_user.save()

    token, _ = Token.objects.get_or_create(user=django_user)

    return Response({
        'token': token.key,
        'user': {
            'id':               academy_user.id,
            'email':            academy_user.email,
            'first_name':       academy_user.first_name,
            'last_name':        academy_user.last_name,
            'role':             academy_user.role,
            'is_hr_executive':  academy_user.is_hr_executive,
            'location':         academy_user.location.name if academy_user.location else None,
        }
    }, status=status.HTTP_200_OK)


# ============================================================
# LOGOUT
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response(
            {'message': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Something went wrong.'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================
# GET CURRENT LOGGED IN USER PROFILE
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    try:
        academy_user = Users.objects.get(email=request.user.username)
        serializer   = UserSerializer(academy_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Users.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


# ============================================================
# REGISTER / ONBOARD A NEW USER — HR only
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_user(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'Requester not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in ONBOARD_ROLES:
        return Response(
            {'error': 'Only HR can register new users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = RegisterUserSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    raw_password = request.data.get('password')
    if not raw_password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

    hashed = bcrypt.hashpw(
        raw_password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    new_user = Users.objects.create(
        email         = serializer.validated_data['email'],
        first_name    = serializer.validated_data['first_name'],
        last_name     = serializer.validated_data['last_name'],
        role          = serializer.validated_data['role'],
        location      = serializer.validated_data.get('location'),
        phone_number  = serializer.validated_data.get('phone_number'),
        password_hash = hashed,
        status        = 'active',
        created_at    = timezone.now(),
        updated_at    = timezone.now(),
    )

    mandatory_assignments = Assignments.objects.filter(
        mandatory=True,
        assignment_type='role',
        target_value=new_user.role
    )

    enrolments_created = []
    for assignment in mandatory_assignments:
        Enrolments.objects.create(
            user       = new_user,
            course     = assignment.course,
            source     = 'assignment',
            status     = 'not_started',
            created_at = timezone.now(),
            updated_at = timezone.now(),
        )
        enrolments_created.append(assignment.course.title)

    send_welcome_email(new_user, raw_password, enrolments_created)

    return Response({
        'message':          f"{new_user.first_name} {new_user.last_name} successfully onboarded.",
        'user':             UserSerializer(new_user).data,
        'courses_assigned': enrolments_created,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# OFFBOARD A USER — HR only
# HR executives (is_hr_executive=True) can offboard other HR users
# Regular HR (Rob, Sean) cannot offboard other HR users
# ============================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def offboard_user(request, user_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'Requester not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in ONBOARD_ROLES:
        return Response(
            {'error': 'Only HR can offboard users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user_to_offboard = Users.objects.get(id=user_id)
    except Users.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user_to_offboard.email == request.user.username:
        return Response({'error': 'You cannot offboard yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    # Only HR executives can offboard other HR users
    if user_to_offboard.role == 'hr' and not academy_user.is_hr_executive:
        return Response(
            {'error': 'You do not have permission to offboard HR users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    offboard_type = request.data.get('offboard_type', 'disabled')
    if offboard_type not in ['disabled', 'terminated']:
        offboard_type = 'disabled'

    user_to_offboard.status     = offboard_type
    user_to_offboard.updated_at = timezone.now()
    user_to_offboard.save()

    try:
        django_user = DjangoUser.objects.get(username=user_to_offboard.email)
        Token.objects.filter(user=django_user).delete()
    except DjangoUser.DoesNotExist:
        pass

    return Response({
        'message': f"{user_to_offboard.first_name} {user_to_offboard.last_name} has been {offboard_type}.",
        'user_id': user_to_offboard.id,
        'status':  user_to_offboard.status,
    }, status=status.HTTP_200_OK)


# ============================================================
# LIST USERS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in MANAGEMENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    if academy_user.role == 'hr':
        # HR sees all active users
        users = Users.objects.filter(status='active')
    elif academy_user.role == 'area_manager':
        # Area Manager sees users from their assigned locations
        assigned_location_ids = SuperAdminLocations.objects.filter(
            user=academy_user
        ).values_list('location_id', flat=True)
        users = Users.objects.filter(
            location_id__in=assigned_location_ids,
            status='active'
        )
    else:
        # Branch Manager sees only their location
        users = Users.objects.filter(
            location=academy_user.location,
            status='active'
        )

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=200)


# ============================================================
# COURSES — List and Create
# ============================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list_create(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        courses = Courses.objects.exclude(status='archived')
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'POST':
        if academy_user.role not in CONTENT_ROLES:
            return Response(
                {'error': 'Only HR and Area Managers can create courses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CourseCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course = Courses.objects.create(
            title             = serializer.validated_data['title'],
            description       = serializer.validated_data.get('description'),
            version           = serializer.validated_data.get('version', '1.0'),
            status            = 'draft',
            estimated_minutes = serializer.validated_data.get('estimated_minutes'),
            expiry_months     = serializer.validated_data.get('expiry_months'),
            created_by        = academy_user,
            created_at        = timezone.now(),
            updated_at        = timezone.now(),
        )
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


# ============================================================
# COURSE — Get, Edit, Archive
# ============================================================
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def course_detail(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Courses.objects.get(id=course_id)
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CourseSerializer(course)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'PATCH':
        if academy_user.role not in CONTENT_ROLES:
            return Response({'error': 'Only HR and Area Managers can edit courses.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CourseCreateSerializer(course, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_at=timezone.now())
        return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        if academy_user.role not in CONTENT_ROLES:
            return Response({'error': 'Only HR and Area Managers can archive courses.'}, status=status.HTTP_403_FORBIDDEN)
        course.status     = 'archived'
        course.updated_at = timezone.now()
        course.save()
        return Response({'message': f'{course.title} has been archived.'}, status=status.HTTP_200_OK)


# ============================================================
# PUBLISH / UNPUBLISH COURSE
# ============================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def publish_course(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    course = get_object_or_404(Courses, id=course_id)
    action = request.data.get('action')  # 'publish' or 'unpublish'

    if action == 'publish':
        course.status       = 'published'
        course.published_at = timezone.now()
    elif action == 'unpublish':
        course.status = 'draft'
    else:
        return Response({'error': 'Action must be publish or unpublish.'}, status=400)

    course.updated_at = timezone.now()
    course.save()
    return Response(CourseSerializer(course).data, status=200)


# ============================================================
# MODULES — Add to a course
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def module_create(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Only HR and Area Managers can add modules.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Courses.objects.get(id=course_id)
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ModuleCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    module = CourseModules.objects.create(
        course     = course,
        title      = serializer.validated_data['title'],
        sort_order = serializer.validated_data.get('sort_order', 1),
        created_at = timezone.now(),
        updated_at = timezone.now(),
    )
    return Response(CourseModuleSerializer(module).data, status=status.HTTP_201_CREATED)


# ============================================================
# LESSONS — Add to a module
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lesson_create(request, module_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Only HR and Area Managers can add lessons.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        module = CourseModules.objects.get(id=module_id)
    except CourseModules.DoesNotExist:
        return Response({'error': 'Module not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = LessonCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    lesson = Lessons.objects.create(
        course           = module.course,
        module           = module,
        title            = serializer.validated_data['title'],
        content_type     = serializer.validated_data['content_type'],
        content_url      = serializer.validated_data.get('content_url'),
        duration_seconds = serializer.validated_data.get('duration_seconds'),
        sort_order       = serializer.validated_data.get('sort_order', 1),
        created_at       = timezone.now(),
        updated_at       = timezone.now(),
    )
    return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)


# ============================================================
# QUIZ — Add to a course
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quiz_create(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Only HR and Area Managers can add quizzes.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Courses.objects.get(id=course_id)
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    module_id = request.data.get('module_id')
    module = CourseModules.objects.filter(id=module_id).first() if module_id else None

    quiz = Quizzes.objects.create(
        course            = course,
        module            = module,
        title             = serializer.validated_data['title'],
        pass_mark_percent = serializer.validated_data['pass_mark_percent'],
        attempt_limit     = serializer.validated_data.get('attempt_limit', 3),
        created_at        = timezone.now(),
        updated_at        = timezone.now(),
    )
    return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)


# ============================================================
# QUIZ QUESTION — Add to a quiz
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def question_create(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Only HR and Area Managers can add questions.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        quiz = Quizzes.objects.get(id=quiz_id)
    except Quizzes.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizQuestionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question = QuizQuestions.objects.create(
        quiz          = quiz,
        question_text = serializer.validated_data['question_text'],
        question_type = serializer.validated_data['question_type'],
        sort_order    = serializer.validated_data.get('sort_order', 1),
        created_at    = timezone.now(),
        updated_at    = timezone.now(),
    )
    return Response(QuizQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


# ============================================================
# QUIZ OPTION — Add to a question
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def option_create(request, question_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Only HR and Area Managers can add options.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        question = QuizQuestions.objects.get(id=question_id)
    except QuizQuestions.DoesNotExist:
        return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizOptionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    option = QuizOptions.objects.create(
        question    = question,
        option_text = serializer.validated_data['option_text'],
        is_correct  = serializer.validated_data['is_correct'],
        sort_order  = serializer.validated_data.get('sort_order', 1),
    )
    return Response(QuizOptionSerializer(option).data, status=status.HTTP_201_CREATED)


# ============================================================
# BROWSE PUBLISHED COURSES
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def browse_courses(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    all_assigned = Assignments.objects.filter(
        assignment_type='all'
    ).values_list('course_id', flat=True)

    role_assigned = Assignments.objects.filter(
        assignment_type='role',
        target_value=academy_user.role
    ).values_list('course_id', flat=True)

    assigned_course_ids = set(list(all_assigned) + list(role_assigned))

    enrolled_course_ids = Enrolments.objects.filter(
        user=academy_user
    ).values_list('course_id', flat=True)

    courses = Courses.objects.filter(
        id__in=assigned_course_ids,
        status='published'
    ).exclude(id__in=enrolled_course_ids)

    data = []
    for course in courses:
        course_data = CourseSerializer(course).data
        course_data['assigned'] = True
        course_data['enrolled'] = False
        data.append(course_data)

    return Response(data, status=status.HTTP_200_OK)


# ============================================================
# SELF ENROL IN A COURSE
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enrol_course(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Courses.objects.get(id=course_id, status='published')
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found or not published.'}, status=status.HTTP_404_NOT_FOUND)

    already_enrolled = Enrolments.objects.filter(user=academy_user, course=course).exists()
    if already_enrolled:
        return Response({'error': 'You are already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

    enrolment = Enrolments.objects.create(
        user       = academy_user,
        course     = course,
        source     = 'self_enrol',
        status     = 'not_started',
        created_at = timezone.now(),
        updated_at = timezone.now(),
    )

    return Response({
        'message':      f'Successfully enrolled in {course.title}.',
        'enrolment_id': enrolment.id,
        'status':       enrolment.status,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# MY LEARNING
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_learning(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    enrolments = Enrolments.objects.filter(user=academy_user)
    serializer = EnrolmentDetailSerializer(enrolments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# COMPLETE A LESSON
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_lesson(request, lesson_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        lesson = Lessons.objects.get(id=lesson_id)
    except Lessons.DoesNotExist:
        return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

    enrolment = Enrolments.objects.filter(user=academy_user, course=lesson.course).first()
    if not enrolment:
        return Response({'error': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)

    progress, created = LessonProgress.objects.get_or_create(
        user   = academy_user,
        lesson = lesson,
        defaults={
            'status':           'completed',
            'progress_percent': 100,
            'completed_at':     timezone.now(),
            'created_at':       timezone.now(),
            'updated_at':       timezone.now(),
        }
    )

    if not created:
        progress.status           = 'completed'
        progress.progress_percent = 100
        progress.completed_at     = timezone.now()
        progress.updated_at       = timezone.now()
        progress.save()

    if enrolment.status == 'not_started':
        enrolment.status     = 'in_progress'
        enrolment.started_at = timezone.now()
        enrolment.updated_at = timezone.now()
        enrolment.save()

    module          = lesson.module
    module_complete = False

    if module:
        all_lessons       = Lessons.objects.filter(module=module)
        lesson_count      = all_lessons.count()
        completed_lessons = LessonProgress.objects.filter(
            user=academy_user, lesson__in=all_lessons, status='completed'
        ).count()
        if lesson_count > 0 and completed_lessons == lesson_count:
            module_complete = True

    course_complete   = False
    all_modules       = CourseModules.objects.filter(course=lesson.course)
    completed_modules = 0

    for mod in all_modules:
        mod_lessons   = Lessons.objects.filter(module=mod)
        mod_count     = mod_lessons.count()
        mod_completed = LessonProgress.objects.filter(
            user=academy_user, lesson__in=mod_lessons, status='completed'
        ).count()
        if mod_count > 0 and mod_completed == mod_count:
            completed_modules += 1

    if all_modules.count() > 0 and completed_modules == all_modules.count():
        course_complete = True

    return Response({
        'message':         f'Lesson "{lesson.title}" marked as complete.',
        'module_complete': module_complete,
        'course_complete': course_complete,
    }, status=status.HTTP_200_OK)


# ============================================================
# MY CERTIFICATES
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    certificates = Certificates.objects.filter(user=academy_user)
    serializer   = CertificateSerializer(certificates, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# QUIZ — Start Attempt (with shuffled MCQ options)
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_quiz_attempt(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    quiz = get_object_or_404(Quizzes, id=quiz_id)

    attempt_count = QuizAttempts.objects.filter(
        user=academy_user, quiz=quiz, submitted_at__isnull=False
    ).count()
    if quiz.attempt_limit and attempt_count >= quiz.attempt_limit and not QuizAttempts.objects.filter(user=academy_user, quiz=quiz, passed=True).exists():
        return Response({'error': 'Quiz is locked. Maximum attempts reached.'}, status=403)

    attempt = QuizAttempts.objects.create(
        user       = academy_user,
        quiz       = quiz,
        passed     = False,
        started_at = timezone.now(),
        created_at = timezone.now()
    )

    questions_data = []
    for q in quiz.quizquestions_set.all().order_by('sort_order'):
        q_data = {
            'id':            q.id,
            'question_text': q.question_text,
            'question_type': q.question_type,
            'sort_order':    q.sort_order,
        }
        if q.question_type in ['mcq', 'truefalse']:
            options = list(QuizOptions.objects.filter(question=q).values('id', 'option_text'))
            random.shuffle(options)
            q_data['options'] = options
        else:
            q_data['options'] = []
        questions_data.append(q_data)

    return Response({
        'attempt_id':     attempt.id,
        'quiz_id':        quiz.id,
        'quiz_title':     quiz.title,
        'attempt_number': attempt_count + 1,
        'attempt_limit':  quiz.attempt_limit,
        'questions':      questions_data,
    }, status=201)


# ============================================================
# QUIZ — Submit Attempt
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz_attempt(request, attempt_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    attempt = get_object_or_404(QuizAttempts, id=attempt_id, user=academy_user)

    if attempt.submitted_at:
        return Response({'error': 'This attempt has already been submitted.'}, status=400)

    quiz         = attempt.quiz
    questions    = quiz.quizquestions_set.all()
    answers_data = request.data.get('answers', [])

    declaration_signed = request.data.get('declaration_signed', False)
    declaration_name   = request.data.get('declaration_name', '').strip()

    mcq_correct   = 0
    mcq_total     = 0
    has_short_ans = False

    for q in questions:
        submitted = next((a for a in answers_data if a.get('question_id') == q.id), None)
        if not submitted:
            continue

        if q.question_type in ['mcq', 'truefalse']:
            mcq_total += 1
            option_id  = submitted.get('option_id')
            try:
                option     = QuizOptions.objects.get(id=option_id, question=q)
                is_correct = option.is_correct
            except QuizOptions.DoesNotExist:
                is_correct = False
                option     = None

            QuizAnswers.objects.create(
                attempt         = attempt,
                question        = q,
                selected_option = option,
                is_correct      = is_correct
            )
            if is_correct:
                mcq_correct += 1

        elif q.question_type == 'short_answer':
            has_short_ans = True
            answer_text   = submitted.get('answer_text', '').strip()
            QuizAnswers.objects.create(
                attempt           = attempt,
                question          = q,
                short_answer_text = answer_text,
                is_correct        = False
            )

    mcq_score      = round((mcq_correct / mcq_total) * 100) if mcq_total > 0 else 0
    grading_status = 'pending' if has_short_ans else 'graded'
    passed         = (mcq_score >= quiz.pass_mark_percent) if not has_short_ans else False

    attempt.score_percent      = mcq_score
    attempt.passed             = passed
    attempt.submitted_at       = timezone.now()
    attempt.grading_status     = grading_status
    attempt.declaration_signed = declaration_signed
    attempt.declaration_name   = declaration_name
    attempt.save()

    attempt_count = QuizAttempts.objects.filter(user=academy_user, quiz=quiz).count()
    locked = bool(quiz.attempt_limit and attempt_count >= quiz.attempt_limit and not passed)

    if passed and not has_short_ans:
        try:
            enrolment = Enrolments.objects.get(user=academy_user, course=quiz.course)
            enrolment.status       = 'completed'
            enrolment.completed_at = timezone.now()
            enrolment.updated_at   = timezone.now()
            enrolment.save()

            existing_cert = Certificates.objects.filter(
                user=academy_user,
                course=quiz.course,
                course_version=quiz.course.version
            ).first()
            if not existing_cert:
                cert_uuid  = uuid.uuid4()
                expires_at = None
                if quiz.course.expiry_months:
                    expires_at = timezone.now() + relativedelta(months=quiz.course.expiry_months)
                new_cert = Certificates.objects.create(
                    certificate_id = cert_uuid,
                    user           = academy_user,
                    course         = quiz.course,
                    course_version = quiz.course.version,
                    issued_at      = timezone.now(),
                    expires_at     = expires_at,
                    created_at     = timezone.now(),
                )
                create_notification(
                    recipient  = academy_user,
                    notif_type = 'certificate_issued',
                    title      = 'Certificate Issued 🎓',
                    message    = f'Congratulations! Your certificate for "{quiz.course.title}" is now available in your Certificates tab.'
                )
                send_certificate_email(academy_user, quiz.course, new_cert)
        except Enrolments.DoesNotExist:
            pass

    if locked:
        create_notification(
            recipient  = academy_user,
            notif_type = 'quiz_locked',
            title      = 'Quiz Locked',
            message    = f'Your quiz "{quiz.title}" has been locked after {quiz.attempt_limit} failed attempts. Please request an unlock.'
        )

    correct_answers = {}
    for q in questions:
        if q.question_type in ['mcq', 'truefalse']:
            correct_opt = QuizOptions.objects.filter(question=q, is_correct=True).first()
            if correct_opt:
                correct_answers[q.id] = {
                    'correct_option_id':   correct_opt.id,
                    'correct_option_text': correct_opt.option_text,
                }

    return Response({
        'mcq_score':       mcq_score,
        'passed':          passed,
        'mcq_correct':     mcq_correct,
        'mcq_total':       mcq_total,
        'pass_mark':       quiz.pass_mark_percent,
        'locked':          locked,
        'grading_status':  grading_status,
        'correct_answers': correct_answers,
        'message':         'Your short answers are pending admin review.' if has_short_ans else 'Quiz submitted.',
    }, status=200)


# ============================================================
# QUIZ — Grade short answers (HR and Area Manager)
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_short_answer_attempts(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in MANAGEMENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    attempts = QuizAttempts.objects.filter(
        grading_status='pending',
        submitted_at__isnull=False
    ).select_related('user', 'quiz')

    if academy_user.role == 'branch_manager':
        attempts = attempts.filter(user__location=academy_user.location)
    elif academy_user.role == 'area_manager':
        assigned_location_ids = SuperAdminLocations.objects.filter(
            user=academy_user
        ).values_list('location_id', flat=True)
        attempts = attempts.filter(user__location_id__in=assigned_location_ids)

    data = []
    for att in attempts:
        short_answers = QuizAnswers.objects.filter(
            attempt=att,
            question__question_type='short_answer'
        ).select_related('question')

        data.append({
            'attempt_id':    att.id,
            'user_name':     f"{att.user.first_name} {att.user.last_name}",
            'user_email':    att.user.email,
            'quiz_title':    att.quiz.title,
            'submitted_at':  att.submitted_at,
            'mcq_score':     att.score_percent,
            'short_answers': [
                {
                    'answer_id':     sa.id,
                    'question_text': sa.question.question_text,
                    'answer_text':   sa.short_answer_text,
                    'is_correct':    sa.is_correct,
                }
                for sa in short_answers
            ]
        })

    return Response(data, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def grade_short_answer_attempt(request, attempt_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in MANAGEMENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    attempt = get_object_or_404(QuizAttempts, id=attempt_id)
    grades  = request.data.get('grades', [])

    short_correct = 0
    short_total   = 0

    for grade in grades:
        try:
            answer            = QuizAnswers.objects.get(id=grade['answer_id'], attempt=attempt)
            answer.is_correct = grade['is_correct']
            answer.save()
            short_total += 1
            if grade['is_correct']:
                short_correct += 1
        except QuizAnswers.DoesNotExist:
            continue

    short_score  = round((short_correct / short_total) * 100) if short_total > 0 else 0
    mcq_score    = attempt.score_percent or 0
    final_score  = round((mcq_score * 0.65) + (short_score * 0.35))
    passed       = final_score >= attempt.quiz.pass_mark_percent

    attempt.short_answer_score = short_score
    attempt.score_percent      = final_score
    attempt.passed             = passed
    attempt.grading_status     = 'graded'
    attempt.graded_by          = academy_user
    attempt.graded_at          = timezone.now()
    attempt.save()

    if passed:
        try:
            enrolment = Enrolments.objects.get(user=attempt.user, course=attempt.quiz.course)
            enrolment.status       = 'completed'
            enrolment.completed_at = timezone.now()
            enrolment.updated_at   = timezone.now()
            enrolment.save()

            existing_cert = Certificates.objects.filter(
                user=attempt.user,
                course=attempt.quiz.course,
                course_version=attempt.quiz.course.version
            ).first()
            if not existing_cert:
                cert_uuid  = uuid.uuid4()
                expires_at = None
                if attempt.quiz.course.expiry_months:
                    expires_at = timezone.now() + relativedelta(months=attempt.quiz.course.expiry_months)
                graded_cert = Certificates.objects.create(
                    certificate_id = cert_uuid,
                    user           = attempt.user,
                    course         = attempt.quiz.course,
                    course_version = attempt.quiz.course.version,
                    issued_at      = timezone.now(),
                    expires_at     = expires_at,
                    created_at     = timezone.now(),
                )
                create_notification(
                    recipient  = attempt.user,
                    notif_type = 'certificate_issued',
                    title      = 'Certificate Issued 🎓',
                    message    = f'Congratulations! Your certificate for "{attempt.quiz.course.title}" is now available in your Certificates tab.'
                )
                send_certificate_email(attempt.user, attempt.quiz.course, graded_cert)
        except Enrolments.DoesNotExist:
            pass

    create_notification(
        recipient  = attempt.user,
        notif_type = 'short_answer_graded',
        title      = 'Quiz Graded',
        message    = f'Your short answer responses for "{attempt.quiz.title}" have been reviewed. Final score: {final_score}%. {"Passed!" if passed else "Unfortunately you did not pass."}'
    )

    return Response({
        'attempt_id':  attempt_id,
        'mcq_score':   mcq_score,
        'short_score': short_score,
        'final_score': final_score,
        'passed':      passed,
    }, status=200)


# ============================================================
# QUIZ UNLOCK REQUEST
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_quiz_unlock(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    quiz          = get_object_or_404(Quizzes, id=quiz_id)
    attempt_count = QuizAttempts.objects.filter(user=academy_user, quiz=quiz).count()

    if not quiz.attempt_limit or attempt_count < quiz.attempt_limit:
        return Response({'error': 'Quiz is not locked yet.'}, status=400)

    existing = QuizUnlockRequests.objects.filter(user=academy_user, quiz=quiz, status='pending').exists()
    if existing:
        return Response({'error': 'You already have a pending unlock request for this quiz.'}, status=400)

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'Please provide a reason for your unlock request.'}, status=400)

    
    unlock_request = QuizUnlockRequests.objects.create(
    user   = academy_user,
    quiz   = quiz,
    reason = reason,
    status = 'pending'
    )

    # Notify managers based on hierarchy and location
    requesting_role = academy_user.role
    if requesting_role in ['branch_manager', 'educator']:
       # Only notify area managers assigned to this user's location
        assigned_managers = SuperAdminLocations.objects.filter(
           location=academy_user.location
        ).values_list('user_id', flat=True)
        managers = Users.objects.filter(
            id__in=assigned_managers,
            role='area_manager',
            status='active'
        )
    elif requesting_role == 'area_manager':
        managers = Users.objects.filter(role='hr', status='active')
    else:
        managers = Users.objects.none()

    for manager in managers:
        create_notification(
           recipient  = manager,
           notif_type = 'general',
           title      = 'New Unlock Request',
           message    = f'{academy_user.first_name} {academy_user.last_name} has requested a quiz unlock for "{quiz.title}".'
        )

    return Response({
       'message':    'Unlock request submitted successfully.',
       'request_id': unlock_request.id,
       'status':     'pending'
    }, status=201)


# ============================================================
# REVIEW UNLOCK REQUEST
# ============================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def review_unlock_request(request, request_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in UNLOCK_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    unlock_request = get_object_or_404(QuizUnlockRequests, id=request_id)

    # Check hierarchy — who can unlock for whom
    target_user_role = unlock_request.user.role
    if academy_user.role == 'area_manager' and target_user_role not in ['branch_manager', 'educator']:
        return Response({'error': 'Area Managers can only unlock requests for Branch Managers and Educators.'}, status=403)
    if academy_user.role == 'hr' and target_user_role != 'area_manager':
        return Response({'error': 'HR can only unlock requests for Area Managers.'}, status=403)

    if unlock_request.status != 'pending':
        return Response({'error': 'This request has already been reviewed.'}, status=400)

    new_status = request.data.get('status')
    if new_status not in ['approved', 'denied']:
        return Response({'error': 'Status must be approved or denied.'}, status=400)

    review_note = request.data.get('review_note', '').strip()

    unlock_request.status      = new_status
    unlock_request.reviewed_by = academy_user
    unlock_request.reviewed_at = timezone.now()
    unlock_request.review_note = review_note
    unlock_request.save()

    if new_status == 'approved':
        QuizAttempts.objects.filter(user=unlock_request.user, quiz=unlock_request.quiz).delete()

    create_notification(
        recipient  = unlock_request.user,
        notif_type = 'unlock_approved' if new_status == 'approved' else 'unlock_denied',
        title      = f'Quiz Unlock {new_status.capitalize()}',
        message    = f'Your unlock request for "{unlock_request.quiz.title}" has been {new_status}.' +
                     (f' Note: {review_note}' if review_note else '')
    )

    if new_status == 'approved':
        send_unlock_approved_email(unlock_request.user, unlock_request.quiz, review_note)
    else:
        send_unlock_denied_email(unlock_request.user, unlock_request.quiz, review_note)

    return Response({
        'message':     f'Unlock request {new_status}.',
        'request_id':  unlock_request.id,
        'status':      new_status,
        'review_note': review_note
    }, status=200)


# ============================================================
# LIST UNLOCK REQUESTS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_unlock_requests(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in UNLOCK_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    requests = QuizUnlockRequests.objects.filter(status='pending').order_by('-requested_at')

    # Filter based on hierarchy and location
    if academy_user.role == 'area_manager':
        assigned_location_ids = SuperAdminLocations.objects.filter(
            user=academy_user
        ).values_list('location_id', flat=True)
        requests = requests.filter(
            user__role__in=['branch_manager', 'educator'],
            user__location_id__in=assigned_location_ids
        )
    elif academy_user.role == 'hr':
        requests = requests.filter(user__role='area_manager')

    data = []
    for req in requests:
        data.append({
            'id':           req.id,
            'user_name':    f"{req.user.first_name} {req.user.last_name}",
            'user_role':    req.user.role,
            'quiz_title':   req.quiz.title,
            'reason':       req.reason,
            'requested_at': req.requested_at,
            'status':       req.status,
        })

    return Response(data, status=200)


# ============================================================
# NOTIFICATIONS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    notifications = Notifications.objects.filter(recipient=academy_user).order_by('-created_at')[:50]

    data = [{
        'id':         n.id,
        'type':       n.notif_type,
        'title':      n.title,
        'message':    n.message,
        'is_read':    n.is_read,
        'created_at': n.created_at,
    } for n in notifications]

    unread_count = Notifications.objects.filter(recipient=academy_user, is_read=False).count()

    return Response({'notifications': data, 'unread_count': unread_count}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    notification_ids = request.data.get('ids', [])
    if notification_ids:
        Notifications.objects.filter(
            recipient=academy_user, id__in=notification_ids
        ).update(is_read=True)
    else:
        Notifications.objects.filter(recipient=academy_user).update(is_read=True)

    return Response({'message': 'Notifications marked as read.'}, status=200)


# ============================================================
# REPORTS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_completion(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in MANAGEMENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    courses = Courses.objects.filter(status='published')
    data    = []

    for course in courses:
        total       = Enrolments.objects.filter(course=course).count()
        completed   = Enrolments.objects.filter(course=course, status='completed').count()
        in_progress = Enrolments.objects.filter(course=course, status='in_progress').count()
        not_started = Enrolments.objects.filter(course=course, status='not_started').count()

        data.append({
            'course_id':       course.id,
            'course_title':    course.title,
            'total':           total,
            'completed':       completed,
            'in_progress':     in_progress,
            'not_started':     not_started,
            'completion_rate': round((completed / total * 100), 1) if total > 0 else 0,
        })

    return Response(data, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_staff(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in MANAGEMENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    if academy_user.role == 'hr':
        users = Users.objects.filter(role='educator', status='active')
    elif academy_user.role == 'area_manager':
        assigned_location_ids = SuperAdminLocations.objects.filter(
            user=academy_user
        ).values_list('location_id', flat=True)
        users = Users.objects.filter(
            role='educator', status='active',
            location_id__in=assigned_location_ids
        )
    else:
        users = Users.objects.filter(
            role='educator', status='active', location=academy_user.location
        )

    data = []
    for user in users:
        enrolments  = Enrolments.objects.filter(user=user)
        completed   = enrolments.filter(status='completed').count()
        in_progress = enrolments.filter(status='in_progress').count()
        not_started = enrolments.filter(status='not_started').count()

        passed_quiz_ids = QuizAttempts.objects.filter(
            user=user, passed=True
        ).values_list('quiz_id', flat=True)
        locked_quiz_count = (
            QuizAttempts.objects
            .filter(user=user, submitted_at__isnull=False, quiz__attempt_limit__isnull=False)
            .exclude(quiz_id__in=passed_quiz_ids)
            .values('quiz', 'quiz__attempt_limit')
            .annotate(attempt_count=Count('id'))
            .filter(attempt_count__gte=F('quiz__attempt_limit'))
            .count()
        )

        data.append({
            'user_id':         user.id,
            'name':            f"{user.first_name} {user.last_name}",
            'email':           user.email,
            'location':        user.location.name if user.location else '—',
            'completed':       completed,
            'in_progress':     in_progress,
            'not_started':     not_started,
            'total':           enrolments.count(),
            'has_locked_quiz': locked_quiz_count > 0,
        })

    return Response(data, status=200)


# ============================================================
# LESSON PROGRESS FOR A COURSE
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_progress(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    course  = get_object_or_404(Courses, id=course_id)
    modules = CourseModules.objects.filter(course=course)

    total_lessons        = 0
    completed_lessons    = 0
    completed_lesson_ids = []

    for module in modules:
        lessons = Lessons.objects.filter(module=module)
        for lesson in lessons:
            total_lessons += 1
            progress = LessonProgress.objects.filter(
                user=academy_user, lesson=lesson, status='completed'
            ).exists()
            if progress:
                completed_lessons += 1
                completed_lesson_ids.append(lesson.id)

    percent = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    return Response({
        'course_id':            course_id,
        'total_lessons':        total_lessons,
        'completed_lessons':    completed_lessons,
        'percent':              percent,
        'completed_lesson_ids': completed_lesson_ids,
    }, status=200)


# ============================================================
# QUIZ — Get last attempt answers
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_last_attempt_answers(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    quiz = get_object_or_404(Quizzes, id=quiz_id)

    last_attempt = QuizAttempts.objects.filter(
        user=academy_user, quiz=quiz, submitted_at__isnull=False
    ).order_by('-submitted_at').first()

    if not last_attempt:
        return Response({'error': 'No attempts found.'}, status=404)

    answers = QuizAnswers.objects.filter(
        attempt=last_attempt
    ).select_related('question', 'selected_option')

    correct_answers = {}
    answers_data    = []

    for ans in answers:
        if ans.question.question_type in ['mcq', 'truefalse']:
            correct_opt = QuizOptions.objects.filter(
                question=ans.question, is_correct=True
            ).first()
            if correct_opt:
                correct_answers[str(ans.question.id)] = {
                    'correct_option_id':   correct_opt.id,
                    'correct_option_text': correct_opt.option_text,
                }
            answers_data.append({
                'question_id':   ans.question.id,
                'question_text': ans.question.question_text,
                'question_type': ans.question.question_type,
                'selected_id':   ans.selected_option.id if ans.selected_option else None,
                'selected_text': ans.selected_option.option_text if ans.selected_option else None,
                'is_correct':    ans.is_correct,
            })
        elif ans.question.question_type == 'short_answer':
            answers_data.append({
                'question_id':   ans.question.id,
                'question_text': ans.question.question_text,
                'question_type': ans.question.question_type,
                'selected_id':   None,
                'selected_text': ans.short_answer_text,
                'is_correct':    ans.is_correct,
            })

    return Response({
        'score_percent':   last_attempt.score_percent,
        'passed':          last_attempt.passed,
        'answers':         answers_data,
        'correct_answers': correct_answers,
    }, status=200)


# ============================================================
# DELETE ENDPOINTS
# ============================================================
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_module(request, module_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    module = get_object_or_404(CourseModules, id=module_id)
    module.delete()
    return Response({'message': 'Module deleted.'}, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_lesson(request, lesson_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    lesson = get_object_or_404(Lessons, id=lesson_id)
    lesson.delete()
    return Response({'message': 'Lesson deleted.'}, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    quiz = get_object_or_404(Quizzes, id=quiz_id)
    quiz.delete()
    return Response({'message': 'Quiz deleted.'}, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    question = get_object_or_404(QuizQuestions, id=question_id)
    question.delete()
    return Response({'message': 'Question deleted.'}, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_option(request, option_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    option = get_object_or_404(QuizOptions, id=option_id)
    option.delete()
    return Response({'message': 'Option deleted.'}, status=200)


# ============================================================
# EDIT ENDPOINTS
# ============================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_module(request, module_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    module = get_object_or_404(CourseModules, id=module_id)
    module.title      = request.data.get('title', module.title)
    module.sort_order = request.data.get('sort_order', module.sort_order)
    module.updated_at = timezone.now()
    module.save()
    return Response({'message': 'Module updated.'}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_lesson(request, lesson_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    lesson = get_object_or_404(Lessons, id=lesson_id)
    lesson.title            = request.data.get('title', lesson.title)
    lesson.content_type     = request.data.get('content_type', lesson.content_type)
    lesson.content_url      = request.data.get('content_url', lesson.content_url)
    lesson.duration_seconds = request.data.get('duration_seconds', lesson.duration_seconds)
    lesson.sort_order       = request.data.get('sort_order', lesson.sort_order)
    lesson.updated_at       = timezone.now()
    lesson.save()
    return Response({'message': 'Lesson updated.'}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_quiz(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    quiz = get_object_or_404(Quizzes, id=quiz_id)
    quiz.title             = request.data.get('title', quiz.title)
    quiz.pass_mark_percent = request.data.get('pass_mark_percent', quiz.pass_mark_percent)
    quiz.attempt_limit     = request.data.get('attempt_limit', quiz.attempt_limit)
    quiz.updated_at        = timezone.now()
    quiz.save()
    return Response({'message': 'Quiz updated.'}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_question(request, question_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    question = get_object_or_404(QuizQuestions, id=question_id)
    question.question_text = request.data.get('question_text', question.question_text)
    question.question_type = request.data.get('question_type', question.question_type)
    question.updated_at    = timezone.now()
    question.save()
    return Response({'message': 'Question updated.'}, status=200)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_option(request, option_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)
    option = get_object_or_404(QuizOptions, id=option_id)
    option.option_text = request.data.get('option_text', option.option_text)
    option.is_correct  = request.data.get('is_correct', option.is_correct)
    option.save()
    return Response({'message': 'Option updated.'}, status=200)


# ============================================================
# ASSIGNMENTS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_assignments(request):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    assignments = Assignments.objects.all().select_related('course', 'created_by')
    data = [{
        'id':              a.id,
        'course_id':       a.course.id,
        'course_title':    a.course.title,
        'assignment_type': a.assignment_type,
        'target_value':    a.target_value,
        'mandatory':       a.mandatory,
        'due_at':          a.due_at,
        'created_at':      a.created_at,
    } for a in assignments]
    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_assignment(request):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    course_id       = request.data.get('course_id')
    assignment_type = request.data.get('assignment_type', 'all')
    target_value    = request.data.get('target_value', '')
    mandatory       = request.data.get('mandatory', True)
    due_at          = request.data.get('due_at')

    try:
        course = Courses.objects.get(id=course_id)
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=404)

    existing = Assignments.objects.filter(
        course=course,
        assignment_type=assignment_type,
        target_value=target_value
    ).exists()
    if existing:
        return Response({'error': 'This assignment already exists.'}, status=400)

    assignment = Assignments.objects.create(
        course          = course,
        assignment_type = assignment_type,
        target_value    = target_value,
        mandatory       = mandatory,
        due_at          = due_at,
        created_by      = academy_user,
        created_at      = timezone.now(),
        updated_at      = timezone.now(),
    )

    if assignment_type == 'all':
        users = Users.objects.filter(status='active', location=academy_user.location)
    elif assignment_type == 'user':
        try:
            specific_user = Users.objects.get(id=int(target_value), status='active')
            users = [specific_user]
        except Users.DoesNotExist:
            users = []
    else:
        users = Users.objects.filter(role=target_value, status='active', location=academy_user.location)

    for user in users:
        already_enrolled = Enrolments.objects.filter(user=user, course=course).exists()
        if not already_enrolled:
            Enrolments.objects.create(
                user       = user,
                course     = course,
                source     = 'assignment',
                status     = 'not_started',
                created_at = timezone.now(),
                updated_at = timezone.now(),
            )
            send_assignment_reminder_email(user, course, assignment)

    return Response({
        'message': 'Course assigned successfully.',
        'assignment': {
            'id':              assignment.id,
            'course_title':    course.title,
            'assignment_type': assignment_type,
            'target_value':    target_value,
            'mandatory':       mandatory,
        }
    }, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_assignment(request, assignment_id):
    academy_user = get_academy_user(request)
    if not academy_user or academy_user.role not in CONTENT_ROLES:
        return Response({'error': 'Access denied.'}, status=403)

    assignment = get_object_or_404(Assignments, id=assignment_id)

    if assignment.assignment_type == 'user':
        try:
            target_user = Users.objects.get(id=int(assignment.target_value))
            Enrolments.objects.filter(
                user=target_user,
                course=assignment.course,
                source='assignment'
            ).delete()
        except Users.DoesNotExist:
            pass
    elif assignment.assignment_type == 'all':
        Enrolments.objects.filter(
            course=assignment.course,
            source='assignment'
        ).delete()

    assignment.delete()
    return Response({'message': 'Assignment and related enrolments removed.'}, status=200)


# ============================================================
# CERTIFICATE GENERATION
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_certificate(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    try:
        enrolment = Enrolments.objects.get(
            user=academy_user,
            course__id=course_id,
            status='completed'
        )
    except Enrolments.DoesNotExist:
        return Response({'error': 'You have not completed this course.'}, status=400)

    course = enrolment.course

    existing = Certificates.objects.filter(
        user=academy_user,
        course=course,
        course_version=course.version
    ).first()

    now        = timezone.now()
    expires_at = None
    if course.expiry_months:
        expires_at = now + relativedelta(months=course.expiry_months)

    if existing:
        cert_uuid  = existing.certificate_id
        expires_at = existing.expires_at
    else:
        cert_uuid = uuid.uuid4()
        Certificates.objects.create(
            certificate_id = cert_uuid,
            user           = academy_user,
            course         = course,
            course_version = course.version,
            issued_at      = now,
            expires_at     = expires_at,
            created_at     = now,
        )
        create_notification(
            recipient  = academy_user,
            notif_type = 'certificate_issued',
            title      = 'Certificate Issued',
            message    = f'Congratulations! Your certificate for "{course.title}" has been issued.'
        )

    buffer = BytesIO()
    c      = pdf_canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    NAVY   = colors.HexColor('#1a237e')
    GOLD   = colors.HexColor('#ffd700')
    RED    = colors.HexColor('#cc2200')
    WHITE  = colors.white
    LIGHT  = colors.HexColor('#e8eaf6')

    # Navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Gold diagonal accent top-right
    from reportlab.lib.utils import simpleSplit
    p = c.beginPath()
    p.moveTo(width * 0.55, height)
    p.lineTo(width, height)
    p.lineTo(width, height * 0.35)
    p.close()
    c.setFillColor(colors.HexColor('#283593'))
    c.drawPath(p, fill=1, stroke=0)

    # Gold border lines
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.rect(1.2*cm, 1.2*cm, width - 2.4*cm, height - 2.4*cm, fill=0, stroke=1)
    c.setLineWidth(1)
    c.rect(1.6*cm, 1.6*cm, width - 3.2*cm, height - 3.2*cm, fill=0, stroke=1)

    # White content area (centre panel)
    c.setFillColor(colors.HexColor('#f0f2ff'))
    c.roundRect(3.5*cm, 2.5*cm, width - 7*cm, height - 5*cm, 8, fill=1, stroke=0)

    # "big" logo text — navy
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 36)
    c.drawCentredString(width / 2, height - 3.2*cm, 'big')

    # "CHILDCARE" in red
    c.setFillColor(RED)
    c.setFont('Helvetica-Bold', 16)
    c.drawCentredString(width / 2, height - 4.1*cm, 'C H I L D C A R E')

    # Gold divider
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(width/2 - 6*cm, height - 4.6*cm, width/2 + 6*cm, height - 4.6*cm)

    # "CERTIFICATE OF COMPLETION"
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 18)
    c.drawCentredString(width / 2, height - 5.5*cm, 'CERTIFICATE OF COMPLETION')

    # "THIS CERTIFICATE IS PROUDLY PRESENTED TO:"
    c.setFillColor(colors.HexColor('#555555'))
    c.setFont('Helvetica', 11)
    c.drawCentredString(width / 2, height - 6.5*cm, 'THIS CERTIFICATE IS PROUDLY PRESENTED TO:')

    # Recipient name in gold
    full_name = f"{academy_user.first_name} {academy_user.last_name}"
    c.setFillColor(GOLD)
    c.setFont('Helvetica-Bold', 30)
    c.drawCentredString(width / 2, height - 8*cm, full_name)

    # Gold name underline
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(width/2 - 7*cm, height - 8.5*cm, width/2 + 7*cm, height - 8.5*cm)

    # "has completed"
    c.setFillColor(colors.HexColor('#333333'))
    c.setFont('Helvetica', 12)
    c.drawCentredString(width / 2, height - 9.3*cm, 'has successfully completed the following course:')

    # Course title in navy bold
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 16)
    c.drawCentredString(width / 2, height - 10.4*cm, course.title)

    # Dates
    completion_date = enrolment.completed_at.strftime('%d %B %Y')
    c.setFillColor(colors.HexColor('#555555'))
    c.setFont('Helvetica', 11)
    c.drawCentredString(width / 2, height - 11.4*cm, f'Completed: {completion_date}')
    if expires_at:
        c.drawCentredString(width / 2, height - 12.1*cm, f'Valid until: {expires_at.strftime("%d %B %Y")}')

    # Gold divider before signatures
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(4.5*cm, 4.2*cm, width/2 - 1*cm, 4.2*cm)
    c.line(width/2 + 1*cm, 4.2*cm, width - 4.5*cm, 4.2*cm)

    # Signature labels
    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 10)
    c.drawCentredString(width * 0.28, 3.7*cm, 'Rob Miller')
    c.setFont('Helvetica', 9)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width * 0.28, 3.2*cm, 'TRAINING AND PARTNERSHIPS')

    c.setFillColor(NAVY)
    c.setFont('Helvetica-Bold', 10)
    c.drawCentredString(width * 0.72, 3.7*cm, 'Big Childcare Academy')
    c.setFont('Helvetica', 9)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width * 0.72, 3.2*cm, 'EDUCATIONAL INSTITUTION')

    # Certificate ID at bottom
    c.setFont('Helvetica', 8)
    c.setFillColor(colors.HexColor('#9fa8da'))
    c.drawCentredString(width / 2, 2.2*cm, f'Certificate ID: {cert_uuid}')

    c.setStrokeColor(colors.HexColor('#1a1a1a'))
    c.setLineWidth(1)
    c.line(width/2 - 4*cm, 3.5*cm, width/2 + 4*cm, 3.5*cm)
    c.setFont('Helvetica', 10)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width / 2, 3*cm, 'Authorised Signatory — Big Childcare')

    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="certificate_{cert_uuid}.pdf"'
    return response


# ============================================================
# QUIZ ATTEMPT STATUS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_attempt_status(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    quiz     = get_object_or_404(Quizzes, id=quiz_id)
    attempts = QuizAttempts.objects.filter(
        user=academy_user, quiz=quiz
    ).order_by('-created_at')

    submitted_attempts = attempts.filter(submitted_at__isnull=False)
    attempt_count      = submitted_attempts.count()
    locked             = bool(
        quiz.attempt_limit and
        attempt_count >= quiz.attempt_limit and
        not submitted_attempts.filter(passed=True).exists()
    )

    last_attempt = submitted_attempts.first()
    last_result  = None

    if last_attempt and last_attempt.submitted_at:
        last_result = {
            'score_percent':  last_attempt.score_percent,
            'passed':         last_attempt.passed,
            'grading_status': last_attempt.grading_status,
            'submitted_at':   last_attempt.submitted_at,
        }

    return Response({
        'attempt_count': attempt_count,
        'attempt_limit': quiz.attempt_limit,
        'locked':        locked,
        'last_result':   last_result,
        'attempts_left': max(0, (quiz.attempt_limit or 0) - attempt_count),
    }, status=200)