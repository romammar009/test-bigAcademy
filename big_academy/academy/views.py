import datetime

import bcrypt
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User as DjangoUser
from .models import QuizAttempts, QuizAnswers, QuizUnlockRequests
from .models import (
    Users, Enrolments, Courses, Assignments,
    CourseModules, Lessons, Quizzes,
    QuizQuestions, QuizOptions,
    LessonProgress, Certificates
)
from .serializers import (
    UserSerializer, RegisterUserSerializer, EnrolmentSerializer,
    CourseSerializer, CourseCreateSerializer,
    CourseModuleSerializer, ModuleCreateSerializer,
    LessonSerializer, LessonCreateSerializer,
    QuizSerializer, QuizCreateSerializer,
    QuizQuestionSerializer, QuizQuestionCreateSerializer,
    QuizOptionSerializer, QuizOptionCreateSerializer,
    EnrolmentDetailSerializer, LessonProgressSerializer,
    CertificateSerializer,
)


# ============================================================
# HELPER — check if the logged in user is a super admin
# ============================================================
def is_super_admin(request):
    token_key = request.auth
    token     = Token.objects.get(key=token_key)
    django_user = token.user
    academy_user = Users.objects.get(email=django_user.username)
    return academy_user.role == 'super_admin'


# ============================================================
# LOGIN
# ============================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email')
    password = request.data.get('password')

    # validate both fields were sent
    if not email or not password:
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # check user exists and is active
    try:
        academy_user = Users.objects.get(email=email, status='active')
    except Users.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # check password
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

    # get or create Django auth user linked to this academy user
    django_user, created = DjangoUser.objects.get_or_create(
        username=academy_user.email,
        defaults={'email': academy_user.email}
    )

    # update last login
    academy_user.last_login_at = timezone.now()
    academy_user.save()

    # generate token
    token, _ = Token.objects.get_or_create(user=django_user)

    return Response({
        'token': token.key,
        'user': {
            'id':         academy_user.id,
            'email':      academy_user.email,
            'first_name': academy_user.first_name,
            'last_name':  academy_user.last_name,
            'role':       academy_user.role,
            'location':   academy_user.location.name if academy_user.location else None,
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
# REGISTER / ONBOARD A NEW USER — Super Admin only
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_user(request):

    # check the requester is a super admin
    try:
        academy_user = Users.objects.get(email=request.user.username)
        if academy_user.role != 'super_admin':
            return Response(
                {'error': 'Only Super Admins can register new users.'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Users.DoesNotExist:
        return Response(
            {'error': 'Requester not found.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # validate incoming data
    serializer = RegisterUserSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # hash the password
    raw_password = request.data.get('password')
    if not raw_password:
        return Response(
            {'error': 'Password is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    hashed = bcrypt.hashpw(
        raw_password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # create the user
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

    # onboarding — find all mandatory assignments for this role
    mandatory_assignments = Assignments.objects.filter(
        mandatory=True,
        assignment_type='role',
        target_value=new_user.role
    )

    enrolments_created = []
    for assignment in mandatory_assignments:
        enrolment = Enrolments.objects.create(
            user       = new_user,
            course     = assignment.course,
            source     = 'assignment',
            status     = 'not_started',
            created_at = timezone.now(),
            updated_at = timezone.now(),
        )
        enrolments_created.append(assignment.course.title)

    return Response({
        'message':            f"{new_user.first_name} {new_user.last_name} successfully onboarded.",
        'user':               UserSerializer(new_user).data,
        'courses_assigned':   enrolments_created,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# OFFBOARD A USER — Super Admin only
# ============================================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def offboard_user(request, user_id):

    # check the requester is a super admin
    try:
        academy_user = Users.objects.get(email=request.user.username)
        if academy_user.role != 'super_admin':
            return Response(
                {'error': 'Only Super Admins can offboard users.'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Users.DoesNotExist:
        return Response(
            {'error': 'Requester not found.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # find the user to offboard
    try:
        user_to_offboard = Users.objects.get(id=user_id)
    except Users.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # prevent offboarding yourself
    if user_to_offboard.email == request.user.username:
        return Response(
            {'error': 'You cannot offboard yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # disable the account
    offboard_type = request.data.get('offboard_type', 'disabled')
    if offboard_type not in ['disabled', 'terminated']:
        offboard_type = 'disabled'

    user_to_offboard.status     = offboard_type
    user_to_offboard.updated_at = timezone.now()
    user_to_offboard.save()

    # invalidate their Django auth token if they are logged in
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
# HELPER — check if logged in user is admin or super admin
# ============================================================
def is_admin_or_super(request):
    try:
        academy_user = Users.objects.get(email=request.user.username)
        return academy_user.role in ['admin', 'super_admin']
    except Users.DoesNotExist:
        return False


def get_academy_user(request):
    try:
        return Users.objects.get(email=request.user.username)
    except Users.DoesNotExist:
        return None


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
        # all roles can view courses
        courses = Courses.objects.exclude(status='archived')
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'POST':
        # only admin and super_admin can create
        if academy_user.role not in ['admin', 'super_admin']:
            return Response(
                {'error': 'Only Admins can create courses.'},
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
        if academy_user.role not in ['admin', 'super_admin']:
            return Response(
                {'error': 'Only Admins can edit courses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CourseCreateSerializer(course, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_at=timezone.now())
        return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        if academy_user.role not in ['admin', 'super_admin']:
            return Response(
                {'error': 'Only Admins can archive courses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        course.status     = 'archived'
        course.updated_at = timezone.now()
        course.save()
        return Response(
            {'message': f'{course.title} has been archived.'},
            status=status.HTTP_200_OK
        )


# ============================================================
# MODULES — Add to a course
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def module_create(request, course_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=status.HTTP_403_FORBIDDEN)

    if academy_user.role not in ['admin', 'super_admin']:
        return Response(
            {'error': 'Only Admins can add modules.'},
            status=status.HTTP_403_FORBIDDEN
        )

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

    if academy_user.role not in ['admin', 'super_admin']:
        return Response(
            {'error': 'Only Admins can add lessons.'},
            status=status.HTTP_403_FORBIDDEN
        )

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

    if academy_user.role not in ['admin', 'super_admin']:
        return Response(
            {'error': 'Only Admins can add quizzes.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        course = Courses.objects.get(id=course_id)
    except Courses.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    quiz = Quizzes.objects.create(
        course           = course,
        title            = serializer.validated_data['title'],
        pass_mark_percent = serializer.validated_data['pass_mark_percent'],
        attempt_limit    = serializer.validated_data.get('attempt_limit', 3),
        created_at       = timezone.now(),
        updated_at       = timezone.now(),
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

    if academy_user.role not in ['admin', 'super_admin']:
        return Response(
            {'error': 'Only Admins can add questions.'},
            status=status.HTTP_403_FORBIDDEN
        )

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

    if academy_user.role not in ['admin', 'super_admin']:
        return Response(
            {'error': 'Only Admins can add options.'},
            status=status.HTTP_403_FORBIDDEN
        )

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

    # Get courses assigned to everyone
    all_assigned = Assignments.objects.filter(
        assignment_type='all'
    ).values_list('course_id', flat=True)

    # Get courses assigned to this user's role
    role_assigned = Assignments.objects.filter(
        assignment_type='role',
        target_value=academy_user.role
    ).values_list('course_id', flat=True)

    # Combine both
    assigned_course_ids = set(list(all_assigned) + list(role_assigned))

    # Get courses user is already enrolled in
    enrolled_course_ids = Enrolments.objects.filter(
        user=academy_user
    ).values_list('course_id', flat=True)

    # Show only assigned but not yet enrolled, and published
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

    # check if already enrolled
    already_enrolled = Enrolments.objects.filter(
        user=academy_user,
        course=course
    ).exists()

    if already_enrolled:
        return Response(
            {'error': 'You are already enrolled in this course.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    enrolment = Enrolments.objects.create(
        user       = academy_user,
        course     = course,
        source     = 'self_enrol',
        status     = 'not_started',
        created_at = timezone.now(),
        updated_at = timezone.now(),
    )

    return Response({
        'message':  f'Successfully enrolled in {course.title}.',
        'enrolment_id': enrolment.id,
        'status':   enrolment.status,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# MY LEARNING — enrolled courses and progress
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

    # check user is enrolled in the course
    enrolled = Enrolments.objects.filter(
        user=academy_user,
        course=lesson.course
    ).exists()

    if not enrolled:
        return Response(
            {'error': 'You are not enrolled in this course.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # get or create lesson progress
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
        # already exists — update it
        progress.status           = 'completed'
        progress.progress_percent = 100
        progress.completed_at     = timezone.now()
        progress.updated_at       = timezone.now()
        progress.save()

    # check if all lessons in the module are completed
    module = lesson.module
    module_complete = False

    if module:
        all_lessons = Lessons.objects.filter(module=module)
        completed_lessons = LessonProgress.objects.filter(
            user=academy_user,
            lesson__in=all_lessons,
            status='completed'
        ).count()

        if completed_lessons == all_lessons.count():
            module_complete = True

    # check if all modules in the course are completed
    course_complete = False
    all_modules = CourseModules.objects.filter(course=lesson.course)
    completed_modules = 0

    for mod in all_modules:
        mod_lessons = Lessons.objects.filter(module=mod)
        mod_completed = LessonProgress.objects.filter(
            user=academy_user,
            lesson__in=mod_lessons,
            status='completed'
        ).count()
        if mod_completed == mod_lessons.count():
            completed_modules += 1

    if completed_modules == all_modules.count():
        course_complete = True

        # update enrolment status
        enrolment = Enrolments.objects.get(
            user=academy_user,
            course=lesson.course
        )
        enrolment.status       = 'completed'
        enrolment.completed_at = timezone.now()
        enrolment.updated_at   = timezone.now()
        enrolment.save()

    return Response({
        'message':       f'Lesson "{lesson.title}" marked as complete.',
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


# ── QUIZ ATTEMPT SYSTEM ──────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_quiz_attempt(request, quiz_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    quiz = get_object_or_404(Quizzes, id=quiz_id)

    attempt_count = QuizAttempts.objects.filter(user=academy_user, quiz=quiz).count()
    if quiz.attempt_limit and attempt_count >= quiz.attempt_limit:
        return Response({'error': 'Quiz is locked. Maximum attempts reached.'}, status=403)

    attempt = QuizAttempts.objects.create(
        user=academy_user,
        quiz=quiz,
        passed=False,
        started_at=timezone.now(),
        created_at=timezone.now()
    )

    return Response({
        'attempt_id':     attempt.id,
        'quiz_id':        quiz.id,
        'quiz_title':     quiz.title,
        'question_count': quiz.quizquestions_set.count(),
        'attempt_number': attempt_count + 1,
        'attempt_limit':  quiz.attempt_limit
    }, status=201)


# ── SUBMIT QUIZ ATTEMPT ──────────────────────────────────────────────

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
    correct_count = 0
    total         = questions.count()

    for q in questions:
        submitted = next((a for a in answers_data if a.get('question_id') == q.id), None)
        if not submitted:
            continue
        option_id = submitted.get('option_id')
        try:
            option     = QuizOptions.objects.get(id=option_id, question=q)
            is_correct = option.is_correct
        except QuizOptions.DoesNotExist:
            is_correct = False
            option     = None

        QuizAnswers.objects.create(
            attempt=attempt,
            question=q,
            selected_option=option,
            is_correct=is_correct
        )
        if is_correct:
            correct_count += 1

    score  = round((correct_count / total) * 100) if total > 0 else 0
    passed = score >= quiz.pass_mark_percent

    attempt.score_percent = score
    attempt.passed        = passed
    attempt.submitted_at  = timezone.now()
    attempt.save()

    attempt_count = QuizAttempts.objects.filter(user=academy_user, quiz=quiz).count()
    locked = bool(quiz.attempt_limit and attempt_count >= quiz.attempt_limit and not passed)

    return Response({
        'score_percent': score,
        'passed':        passed,
        'correct':       correct_count,
        'total':         total,
        'pass_mark':     quiz.pass_mark_percent,
        'locked':        locked
    }, status=200)


# ── QUIZ UNLOCK REQUEST ──────────────────────────────────────────────

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
        user=academy_user,
        quiz=quiz,
        reason=reason,
        status='pending'
    )

    return Response({
        'message':    'Unlock request submitted successfully.',
        'request_id': unlock_request.id,
        'status':     'pending'
    }, status=201)


# ── APPROVE / DENY UNLOCK REQUEST (Super Admin) ──────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def review_unlock_request(request, request_id):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role != 'super_admin':
        return Response({'error': 'Only Super Admins can review unlock requests.'}, status=403)

    unlock_request = get_object_or_404(QuizUnlockRequests, id=request_id)

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

    return Response({
        'message':     f'Unlock request {new_status}.',
        'request_id':  unlock_request.id,
        'status':      new_status,
        'review_note': review_note
    }, status=200)


# ============================================================
# CERTIFICATE GENERATION
# ============================================================
import uuid
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas as pdf_canvas
from dateutil.relativedelta import relativedelta

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

    if existing:
        cert_uuid  = existing.certificate_id
        expires_at = existing.expires_at
    else:
        cert_uuid  = uuid.uuid4()
        expires_at = None
        if course.expiry_months:
            expires_at = now + relativedelta(months=course.expiry_months)
        Certificates.objects.create(
            certificate_id = cert_uuid,
            user           = academy_user,
            course         = course,
            course_version = course.version,
            issued_at      = now,
            expires_at     = expires_at,
            created_at     = now,
        )

    now = timezone.now()
    expires_at = None
    if course.expiry_months:
        expires_at = now + relativedelta(months=course.expiry_months)

    cert_uuid = uuid.uuid4()

    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    # Background
    c.setFillColor(colors.HexColor('#f9f6f0'))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Border
    c.setStrokeColor(colors.HexColor('#2c5f2e'))
    c.setLineWidth(4)
    c.rect(1*cm, 1*cm, width - 2*cm, height - 2*cm, fill=0, stroke=1)

    # Inner border
    c.setLineWidth(1)
    c.rect(1.3*cm, 1.3*cm, width - 2.6*cm, height - 2.6*cm, fill=0, stroke=1)

    # Company name
    c.setFillColor(colors.HexColor('#2c5f2e'))
    c.setFont('Helvetica-Bold', 28)
    c.drawCentredString(width / 2, height - 3.5*cm, 'Big Childcare')

    # Certificate title
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(colors.HexColor('#1a1a1a'))
    c.drawCentredString(width / 2, height - 5*cm, 'Certificate of Completion')

    # Divider
    c.setStrokeColor(colors.HexColor('#2c5f2e'))
    c.setLineWidth(1.5)
    c.line(4*cm, height - 5.7*cm, width - 4*cm, height - 5.7*cm)

    # This certifies that
    c.setFont('Helvetica', 14)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width / 2, height - 7*cm, 'This certifies that')

    # Recipient name
    full_name = f"{academy_user.first_name} {academy_user.last_name}"
    c.setFont('Helvetica-Bold', 26)
    c.setFillColor(colors.HexColor('#2c5f2e'))
    c.drawCentredString(width / 2, height - 8.5*cm, full_name)

    # Has completed
    c.setFont('Helvetica', 14)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width / 2, height - 10*cm, 'has successfully completed')

    # Course name
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(colors.HexColor('#1a1a1a'))
    c.drawCentredString(width / 2, height - 11.5*cm, course.title)

    # Completion date
    c.setFont('Helvetica', 12)
    c.setFillColor(colors.HexColor('#555555'))
    completion_date = enrolment.completed_at.strftime('%d %B %Y')
    c.drawCentredString(width / 2, height - 13*cm, f'Completed: {completion_date}')

    # Expiry
    if expires_at:
        c.drawCentredString(width / 2, height - 13.8*cm, f'Valid until: {expires_at.strftime("%d %B %Y")}')

    # Certificate ID
    c.setFont('Helvetica', 9)
    c.setFillColor(colors.HexColor('#999999'))
    c.drawCentredString(width / 2, 2.2*cm, f'Certificate ID: {cert_uuid}')

    # Signature line
    c.setStrokeColor(colors.HexColor('#1a1a1a'))
    c.setLineWidth(1)
    c.line(width/2 - 4*cm, 3.5*cm, width/2 + 4*cm, 3.5*cm)
    c.setFont('Helvetica', 10)
    c.setFillColor(colors.HexColor('#555555'))
    c.drawCentredString(width / 2, 3*cm, 'Authorised Signatory — Big Childcare')

    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    Certificates.objects.create(
        certificate_id = cert_uuid,
        user           = academy_user,
        course         = course,
        course_version = course.version,
        issued_at      = now,
        expires_at     = expires_at,
        created_at     = now,
    )

    from django.http import HttpResponse
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="certificate_{cert_uuid}.pdf"'
    return response


# ============================================================
# LIST USERS — Admin/Super Admin only
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Access denied.'}, status=403)

    # Admin sees only their location, super admin sees all
    if academy_user.role == 'super_admin':
        users = Users.objects.filter(status='active')
    else:
        users = Users.objects.filter(
            location=academy_user.location,
            status='active'
        )

    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=200)


# ============================================================
# LIST UNLOCK REQUESTS — Super Admin only
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_unlock_requests(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role != 'super_admin':
        return Response({'error': 'Access denied.'}, status=403)

    requests = QuizUnlockRequests.objects.filter(status='pending').order_by('-requested_at')

    data = []
    for req in requests:
        data.append({
            'id':           req.id,
            'user_name':    f"{req.user.first_name} {req.user.last_name}",
            'quiz_title':   req.quiz.title,
            'reason':       req.reason,
            'requested_at': req.requested_at,
            'status':       req.status,
        })

    return Response(data, status=200)


# ============================================================
# REPORTS
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_completion(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Access denied.'}, status=403)

    courses = Courses.objects.filter(status='published')
    data = []

    for course in courses:
        total      = Enrolments.objects.filter(course=course).count()
        completed  = Enrolments.objects.filter(course=course, status='completed').count()
        in_progress = Enrolments.objects.filter(course=course, status='in_progress').count()
        not_started = Enrolments.objects.filter(course=course, status='not_started').count()

        data.append({
            'course_id':    course.id,
            'course_title': course.title,
            'total':        total,
            'completed':    completed,
            'in_progress':  in_progress,
            'not_started':  not_started,
            'completion_rate': round((completed / total * 100), 1) if total > 0 else 0,
        })

    return Response(data, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_staff(request):
    academy_user = get_academy_user(request)
    if not academy_user:
        return Response({'error': 'User not found.'}, status=403)

    if academy_user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Access denied.'}, status=403)

    if academy_user.role == 'super_admin':
        users = Users.objects.filter(role='educator', status='active')
    else:
        users = Users.objects.filter(
            role='educator',
            status='active',
            location=academy_user.location
        )

    data = []
    for user in users:
        enrolments  = Enrolments.objects.filter(user=user)
        completed   = enrolments.filter(status='completed').count()
        in_progress = enrolments.filter(status='in_progress').count()
        not_started = enrolments.filter(status='not_started').count()

        data.append({
            'user_id':      user.id,
            'name':         f"{user.first_name} {user.last_name}",
            'email':        user.email,
            'location':     user.location.name if user.location else '—',
            'completed':    completed,
            'in_progress':  in_progress,
            'not_started':  not_started,
            'total':        enrolments.count(),
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

    total_lessons     = 0
    completed_lessons = 0

    for module in modules:
        lessons = Lessons.objects.filter(module=module)
        for lesson in lessons:
            total_lessons += 1
            progress = LessonProgress.objects.filter(
                user=academy_user,
                lesson=lesson,
                status='completed'
            ).exists()
            if progress:
                completed_lessons += 1

    percent = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    return Response({
        'course_id':          course_id,
        'total_lessons':      total_lessons,
        'completed_lessons':  completed_lessons,
        'percent':            percent,
    }, status=200)