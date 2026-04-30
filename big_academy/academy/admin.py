from datetime import timedelta

from django.contrib import admin
from django.contrib import messages
from django.utils import timezone
from .models import (
    Locations, Users, Courses, CourseModules,
    Lessons, Assignments, Enrolments, LessonProgress,
    Quizzes, QuizQuestions, QuizOptions,
    QuizAttempts, QuizAnswers, Certificates,
    QuizUnlockRequests, Notifications
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
    list_display    = ['id', 'first_name', 'last_name', 'email', 'role', 'is_hr_executive', 'status', 'location']
    list_filter     = ['role', 'status', 'is_hr_executive']
    search_fields   = ['first_name', 'last_name', 'email']
    readonly_fields = ['created_at', 'updated_at', 'last_login_at']

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['password_hash'].widget = admin.widgets.AdminTextInputWidget()
        form.base_fields['password_hash'].label = 'Password'
        form.base_fields['password_hash'].help_text = 'Enter plain password — it will be hashed automatically.'
        return form

    def save_model(self, request, obj, form, change):
        raw = form.cleaned_data.get('password_hash', '')
        # Hash if the value isn't already a bcrypt hash
        if raw and not raw.startswith(('$2b$', '$2a$', '$2y$')):
            obj.password_hash = bcrypt.hashpw(
                raw.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            obj.must_change_password     = True
            obj.temp_password_expires_at = timezone.now() + timedelta(hours=24)
        if not change:
            obj.created_at = timezone.now()
        obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# COURSES
# ============================================================
@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    list_display    = ['id', 'title', 'version', 'status', 'estimated_minutes', 'created_by']
    list_filter     = ['status']
    search_fields   = ['title']
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
    list_display    = ['id', 'title', 'course', 'sort_order']
    search_fields   = ['title']
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
    list_display    = ['id', 'title', 'course', 'module', 'content_type', 'sort_order']
    list_filter     = ['content_type']
    search_fields   = ['title']
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
    list_display    = ['id', 'course', 'assignment_type', 'target_value', 'mandatory', 'due_at']
    list_filter     = ['mandatory', 'assignment_type']
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
def reset_enrolment_to_not_started(modeladmin, request, queryset):
    for enrolment in queryset:
        enrolment.status       = 'not_started'
        enrolment.started_at   = None
        enrolment.completed_at = None
        enrolment.updated_at   = timezone.now()
        enrolment.save()
    messages.success(request, f'{queryset.count()} enrolment(s) reset to Not Started.')
reset_enrolment_to_not_started.short_description = 'Reset selected enrolments to Not Started'

def reset_enrolment_to_in_progress(modeladmin, request, queryset):
    for enrolment in queryset:
        enrolment.status       = 'in_progress'
        enrolment.completed_at = None
        enrolment.updated_at   = timezone.now()
        enrolment.save()
    messages.success(request, f'{queryset.count()} enrolment(s) reset to In Progress.')
reset_enrolment_to_in_progress.short_description = 'Reset selected enrolments to In Progress'

@admin.register(Enrolments)
class EnrolmentsAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'course', 'status', 'source', 'started_at', 'completed_at']
    list_filter     = ['status', 'source']
    search_fields   = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    actions         = [reset_enrolment_to_not_started, reset_enrolment_to_in_progress]

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
    list_display    = ['id', 'user', 'lesson', 'status', 'progress_percent']
    list_filter     = ['status']
    search_fields   = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    actions         = ['delete_selected']

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
    list_display    = ['id', 'title', 'course', 'pass_mark_percent', 'attempt_limit']
    search_fields   = ['title']
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
    list_display    = ['id', 'quiz', 'question_type', 'sort_order']
    list_filter     = ['question_type']
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
    list_display = ['id', 'question', 'option_text', 'is_correct', 'sort_order']
    list_filter  = ['is_correct']


# ============================================================
# QUIZ ATTEMPTS
# ============================================================
def delete_quiz_attempts_and_answers(modeladmin, request, queryset):
    count = 0
    for attempt in queryset:
        QuizAnswers.objects.filter(attempt=attempt).delete()
        attempt.delete()
        count += 1
    messages.success(request, f'{count} attempt(s) and their answers deleted.')
delete_quiz_attempts_and_answers.short_description = 'Delete selected attempts and all answers'

@admin.register(QuizAttempts)
class QuizAttemptsAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'quiz', 'score_percent', 'passed', 'grading_status', 'submitted_at']
    list_filter     = ['passed', 'grading_status']
    search_fields   = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at']
    actions         = [delete_quiz_attempts_and_answers]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ ANSWERS
# ============================================================
@admin.register(QuizAnswers)
class QuizAnswersAdmin(admin.ModelAdmin):
    list_display = ['id', 'attempt', 'question', 'is_correct']
    list_filter  = ['is_correct']
    actions      = ['delete_selected']


# ============================================================
# CERTIFICATES
# ============================================================
@admin.register(Certificates)
class CertificatesAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'course', 'course_version', 'issued_at', 'expires_at']
    search_fields   = ['user__first_name', 'user__last_name']
    readonly_fields = ['created_at']
    actions         = ['delete_selected']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_at = timezone.now()
        super().save_model(request, obj, form, change)


# ============================================================
# QUIZ UNLOCK REQUESTS
# ============================================================
@admin.register(QuizUnlockRequests)
class QuizUnlockRequestsAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'quiz', 'status', 'requested_at', 'reviewed_by', 'reviewed_at']
    list_filter     = ['status']
    readonly_fields = ['requested_at']
    actions         = ['delete_selected']


# ============================================================
# NOTIFICATIONS
# ============================================================
@admin.register(Notifications)
class NotificationsAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notif_type', 'title', 'is_read', 'created_at']
    list_filter  = ['notif_type', 'is_read']
    search_fields = ['recipient__first_name', 'recipient__last_name']
    actions      = ['delete_selected']