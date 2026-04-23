from rest_framework import serializers
from .models import (
    Users, Locations, Enrolments, Courses,
    CourseModules, Lessons, Quizzes,
    QuizQuestions, QuizOptions,
    LessonProgress, Certificates
)


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locations
        fields = ['id', 'name', 'state', 'region']


class UserSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = Users
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'is_hr_executive', 'status', 'location',
            'phone_number', 'created_at', 'last_login_at'
        ]


class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            'email', 'first_name', 'last_name',
            'role', 'location', 'phone_number'
        ]

    def validate_email(self, value):
        if Users.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class EnrolmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrolments
        fields = ['id', 'course_id', 'course_title', 'status', 'started_at', 'completed_at']


class QuizOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOptions
        fields = ['id', 'option_text', 'is_correct', 'sort_order']


class QuizQuestionSerializer(serializers.ModelSerializer):
    options = QuizOptionSerializer(many=True, read_only=True, source='quizoptions_set')

    class Meta:
        model = QuizQuestions
        fields = ['id', 'question_text', 'question_type', 'sort_order', 'options']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True, source='quizquestions_set')

    class Meta:
        model = Quizzes
        fields = ['id', 'title', 'pass_mark_percent', 'attempt_limit', 'questions']


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lessons
        fields = ['id', 'title', 'content_type', 'content_url', 'duration_seconds', 'sort_order']


class CourseModuleSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()

    class Meta:
        model = CourseModules
        fields = ['id', 'title', 'sort_order', 'lessons', 'quizzes']

    def get_lessons(self, module):
        lessons = Lessons.objects.filter(
            module=module
        ).exclude(content_type='quiz').order_by('sort_order')
        return LessonSerializer(lessons, many=True).data

    def get_quizzes(self, module):
      quizzes = Quizzes.objects.filter(module=module)
      return QuizSerializer(quizzes, many=True).data


class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True, source='coursemodules_set')

    class Meta:
        model = Courses
        fields = [
            'id', 'title', 'description', 'version',
            'status', 'estimated_minutes', 'expiry_months',
            'published_at', 'modules',
        ]


class CourseCreateSerializer(serializers.ModelSerializer):
    status         = serializers.CharField(required=False)
    version        = serializers.CharField(required=False, default='1.0')
    estimated_minutes = serializers.IntegerField(required=False, allow_null=True)
    expiry_months     = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Courses
        fields = ['title', 'description', 'version', 'estimated_minutes', 'expiry_months']


class ModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModules
        fields = ['title', 'sort_order']


class LessonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lessons
        fields = ['title', 'content_type', 'content_url', 'duration_seconds', 'sort_order']


class QuizCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quizzes
        fields = ['title', 'pass_mark_percent', 'attempt_limit']


class QuizQuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestions
        fields = ['question_text', 'question_type', 'sort_order']


class QuizOptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizOptions
        fields = ['option_text', 'is_correct', 'sort_order']


class EnrolmentDetailSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrolments
        fields = [
            'id', 'course', 'status',
            'source', 'started_at', 'completed_at'
        ]


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'lesson', 'status',
            'progress_percent', 'time_spent_seconds', 'completed_at'
        ]


class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_name    = serializers.SerializerMethodField()
    course_id    = serializers.IntegerField(source='course.id', read_only=True)

    class Meta:
        model = Certificates
        fields = [
            'id', 'certificate_id', 'user_name', 'course_id', 'course_title',
            'course_version', 'issued_at', 'expires_at'
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"