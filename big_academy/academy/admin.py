# from django.contrib import admin
# from .models import (
#     Locations, Users, Courses, CourseModules,
#     Lessons, Assignments, Enrolments, LessonProgress,
#     Quizzes, QuizQuestions, QuizOptions,
#     QuizAttempts, QuizAnswers, Certificates
# )

# # @admin.register(Users)
# # class UsersAdmin(admin.ModelAdmin):
# #     list_display  = ['first_name', 'last_name', 'role', 'status', 'location']
# #     list_filter   = ['role', 'status']
# #     search_fields = ['first_name', 'last_name', 'email']

# admin.site.register(Locations)
# admin.site.register(Users)
# admin.site.register(Courses)
# admin.site.register(CourseModules)
# admin.site.register(Lessons)
# admin.site.register(Assignments)
# admin.site.register(Enrolments)
# admin.site.register(LessonProgress)
# admin.site.register(Quizzes)
# admin.site.register(QuizQuestions)
# admin.site.register(QuizOptions)
# admin.site.register(QuizAttempts)
# admin.site.register(QuizAnswers)
# admin.site.register(Certificates)


from django.contrib import admin
from django.utils import timezone
from .models import (
    Locations, Users, Courses, CourseModules,
    Lessons, Assignments, Enrolments, LessonProgress,
    Quizzes, QuizQuestions, QuizOptions,
    QuizAttempts, QuizAnswers, Certificates,
    QuizUnlockRequests
)
import bcrypt


# ============================================================
# LOCATIONS
# ============================================================
@admin.register(Locations)
class LocationsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'name', 'state', 'region']
    search_fields = ['name', 'state']

    def save_model(self, request, obj, form, change):
        if not obj.created_at:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# USERS
# ============================================================
@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display    = ['id', 'first_name', 'last_name', 'email', 'role', 'status', 'location']
    list_filter     = ['role', 'status']
    search_fields   = ['first_name', 'last_name', 'email']
    readonly_fields = ['created_at', 'updated_at', 'last_login_at']

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['password_hash'].widget = admin.widgets.AdminTextInputWidget()
        form.base_fields['password_hash'].label = 'Password'
        form.base_fields['password_hash'].help_text = 'Enter plain password — it will be hashed automatically.'
        return form

    def save_model(self, request, obj, form, change):
        if not change:
            raw_password = form.cleaned_data.get('password_hash')
            if raw_password:
                obj.password_hash = bcrypt.hashpw(
                    raw_password.encode('utf-8'),
                    bcrypt.gensalt()
                ).decode('utf-8')
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# COURSES
# ============================================================
@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'version', 'status', 'estimated_minutes', 'created_by']
    list_filter   = ['status']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# COURSE MODULES
# ============================================================
@admin.register(CourseModules)
class CourseModulesAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'course', 'sort_order']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# LESSONS
# ============================================================
@admin.register(Lessons)
class LessonsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'course', 'module', 'content_type', 'sort_order']
    list_filter   = ['content_type']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# ASSIGNMENTS
# ============================================================
@admin.register(Assignments)
class AssignmentsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'course', 'assignment_type', 'target_value', 'mandatory', 'due_at']
    list_filter   = ['mandatory', 'assignment_type']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
            obj.created_by = Users.objects.get(email=request.user.username)
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# ENROLMENTS
# ============================================================
@admin.register(Enrolments)
class EnrolmentsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'course', 'status', 'source', 'started_at', 'completed_at']
    list_filter   = ['status', 'source']
    search_fields = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# LESSON PROGRESS
# ============================================================
@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'lesson', 'status', 'progress_percent', 'time_spent_seconds']
    list_filter   = ['status']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZZES
# ============================================================
@admin.register(Quizzes)
class QuizzesAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'course', 'pass_mark_percent', 'attempt_limit']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ QUESTIONS
# ============================================================
@admin.register(QuizQuestions)
class QuizQuestionsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'quiz', 'question_type', 'sort_order']
    list_filter   = ['question_type']
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ OPTIONS
# ============================================================
@admin.register(QuizOptions)
class QuizOptionsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'question', 'option_text', 'is_correct', 'sort_order']
    list_filter   = ['is_correct']


# ============================================================
# QUIZ ATTEMPTS
# ============================================================
@admin.register(QuizAttempts)
class QuizAttemptsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'quiz', 'score_percent', 'passed', 'submitted_at']
    list_filter   = ['passed']
    readonly_fields = ['created_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ ANSWERS
# ============================================================
@admin.register(QuizAnswers)
class QuizAnswersAdmin(admin.ModelAdmin):
    list_display  = ['id', 'attempt', 'question', 'selected_option', 'is_correct']
    list_filter   = ['is_correct']


# ============================================================
# CERTIFICATES
# ============================================================
@admin.register(Certificates)
class CertificatesAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'course', 'issued_at', 'expires_at']
    search_fields = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ UNLOCK REQUESTS
# ============================================================
@admin.register(QuizUnlockRequests)
class QuizUnlockRequestsAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'quiz', 'status', 'requested_at', 'reviewed_by', 'reviewed_at']
    list_filter   = ['status']
    readonly_fields = ['requested_at']