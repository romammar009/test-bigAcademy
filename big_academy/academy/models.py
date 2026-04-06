from django.db import models


class Locations(models.Model):
    name           = models.CharField(max_length=150)
    state          = models.CharField(max_length=50)
    region         = models.CharField(max_length=100, blank=True, null=True)
    is_head_office = models.BooleanField(default=False)
    created_at     = models.DateTimeField()
    updated_at     = models.DateTimeField()

    def __str__(self):
        return f"{self.name} ({self.state})"

    class Meta:
        managed = False
        db_table = 'locations'
        verbose_name = 'Location'
        verbose_name_plural = 'Locations'


class Users(models.Model):

    ROLE_CHOICES = [
        ('hr_tier1',    'HR Team'),           # Was: super_admin — full HR access
        ('hr_tier2',    'HR Head / Owner'),    # New — senior HR, read-only + request updates
        ('super_admin', 'Super Admin'),        # New — Area Manager, multi-location access
        ('admin',       'Admin'),              # Branch Manager — single location
        ('educator',    'Educator'),           # Staff member
    ]

    STATUS_CHOICES = [
        ('active',      'Active'),
        ('disabled',    'Disabled'),
        ('terminated',  'Terminated'),
    ]

    email         = models.CharField(unique=True, max_length=255)
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default='educator')
    location      = models.ForeignKey(Locations, models.DO_NOTHING, blank=True, null=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    password_hash = models.TextField(blank=True, null=True)
    created_at    = models.DateTimeField(blank=True, null=True)
    updated_at    = models.DateTimeField(blank=True, null=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    phone_number  = models.CharField(max_length=20, blank=True, null=True)
    employee_id   = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    class Meta:
        managed = False
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'


# ── Location assignments for Super Admin (Area Manager) ──────────────
# Allows a super_admin to be assigned to multiple locations
class SuperAdminLocations(models.Model):
    user     = models.ForeignKey(
        Users, models.DO_NOTHING,
        related_name='assigned_locations',
        limit_choices_to={'role': 'super_admin'}
    )
    location = models.ForeignKey(Locations, models.DO_NOTHING)
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} → {self.location}"

    class Meta:
        managed = True   # Django will create this table
        db_table = 'super_admin_locations'
        unique_together = (('user', 'location'),)
        verbose_name = 'Super Admin Location'
        verbose_name_plural = 'Super Admin Locations'


class Courses(models.Model):
    title             = models.CharField(max_length=255)
    description       = models.TextField(blank=True, null=True)
    version           = models.CharField(max_length=20)
    status            = models.TextField()
    estimated_minutes = models.IntegerField(blank=True, null=True)
    expiry_months     = models.IntegerField(blank=True, null=True)
    created_by        = models.ForeignKey(Users, models.DO_NOTHING, db_column='created_by')
    published_at      = models.DateTimeField(blank=True, null=True)
    created_at        = models.DateTimeField()
    updated_at        = models.DateTimeField()

    def __str__(self):
        return f"{self.title} (v{self.version}) — {self.status}"

    class Meta:
        managed = False
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'


class CourseModules(models.Model):
    course     = models.ForeignKey(Courses, models.DO_NOTHING)
    title      = models.CharField(max_length=255)
    sort_order = models.IntegerField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    def __str__(self):
        return f"{self.title} (Course: {self.course})"

    class Meta:
        managed = False
        db_table = 'course_modules'
        verbose_name = 'Course Module'
        verbose_name_plural = 'Course Modules'


class Lessons(models.Model):
    course           = models.ForeignKey(Courses, models.DO_NOTHING)
    module           = models.ForeignKey(CourseModules, models.DO_NOTHING, blank=True, null=True)
    title            = models.CharField(max_length=255)
    content_type     = models.TextField()
    content_url      = models.TextField(blank=True, null=True)
    duration_seconds = models.IntegerField(blank=True, null=True)
    sort_order       = models.IntegerField()
    created_at       = models.DateTimeField()
    updated_at       = models.DateTimeField()

    def __str__(self):
        return f"{self.title} ({self.content_type})"

    class Meta:
        managed = False
        db_table = 'lessons'
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'


class Assignments(models.Model):
    course          = models.ForeignKey(Courses, models.DO_NOTHING)
    assignment_type = models.TextField()
    target_value    = models.TextField(blank=True, null=True)
    mandatory       = models.BooleanField()
    due_at          = models.DateTimeField(blank=True, null=True)
    created_by      = models.ForeignKey(Users, models.DO_NOTHING, db_column='created_by')
    created_at      = models.DateTimeField()
    updated_at      = models.DateTimeField()

    def __str__(self):
        return f"{self.course} — {self.assignment_type} (mandatory: {self.mandatory})"

    class Meta:
        managed = False
        db_table = 'assignments'
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'


class Enrolments(models.Model):
    user         = models.ForeignKey(Users, models.DO_NOTHING)
    course       = models.ForeignKey(Courses, models.DO_NOTHING)
    source       = models.TextField()
    status       = models.TextField()
    started_at   = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at   = models.DateTimeField()
    updated_at   = models.DateTimeField()

    def __str__(self):
        return f"{self.user} → {self.course} ({self.status})"

    class Meta:
        managed = False
        db_table = 'enrolments'
        verbose_name = 'Enrolment'
        verbose_name_plural = 'Enrolments'
        unique_together = (('user', 'course'),)


class LessonProgress(models.Model):
    user               = models.ForeignKey(Users, models.DO_NOTHING)
    lesson             = models.ForeignKey(Lessons, models.DO_NOTHING)
    status             = models.TextField()
    progress_percent   = models.SmallIntegerField(blank=True, null=True)
    time_spent_seconds = models.IntegerField(blank=True, null=True)
    completed_at       = models.DateTimeField(blank=True, null=True)
    created_at         = models.DateTimeField()
    updated_at         = models.DateTimeField()

    def __str__(self):
        return f"{self.user} — {self.lesson} ({self.progress_percent}%)"

    class Meta:
        managed = False
        db_table = 'lesson_progress'
        verbose_name = 'Lesson Progress'
        verbose_name_plural = 'Lesson Progress'
        unique_together = (('user', 'lesson'),)


class Quizzes(models.Model):
    course            = models.ForeignKey(Courses, models.DO_NOTHING, blank=True, null=True)
    lesson            = models.ForeignKey(Lessons, models.DO_NOTHING, blank=True, null=True)
    title             = models.CharField(max_length=255)
    pass_mark_percent = models.SmallIntegerField()
    attempt_limit     = models.IntegerField(blank=True, null=True)
    created_at        = models.DateTimeField()
    updated_at        = models.DateTimeField()

    def __str__(self):
        return f"{self.title} (pass mark: {self.pass_mark_percent}%)"

    class Meta:
        managed = False
        db_table = 'quizzes'
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'


class QuizQuestions(models.Model):
    quiz          = models.ForeignKey(Quizzes, models.DO_NOTHING)
    question_text = models.TextField()
    question_type = models.TextField()  # 'mcq' or 'short_answer'
    sort_order    = models.IntegerField()
    created_at    = models.DateTimeField()
    updated_at    = models.DateTimeField()

    def __str__(self):
        return f"Q{self.sort_order}: {self.question_text[:60]}"

    class Meta:
        managed = False
        db_table = 'quiz_questions'
        verbose_name = 'Quiz Question'
        verbose_name_plural = 'Quiz Questions'


class QuizOptions(models.Model):
    question   = models.ForeignKey(QuizQuestions, models.DO_NOTHING)
    option_text = models.TextField()
    is_correct  = models.BooleanField()
    sort_order  = models.IntegerField()

    def __str__(self):
        correct = '✓' if self.is_correct else '✗'
        return f"{correct} {self.option_text[:60]}"

    class Meta:
        managed = False
        db_table = 'quiz_options'
        verbose_name = 'Quiz Option'
        verbose_name_plural = 'Quiz Options'


class QuizAttempts(models.Model):
    user                = models.ForeignKey(Users, models.DO_NOTHING)
    quiz                = models.ForeignKey(Quizzes, models.DO_NOTHING)
    score_percent       = models.SmallIntegerField(blank=True, null=True)
    passed              = models.BooleanField()
    started_at          = models.DateTimeField(blank=True, null=True)
    submitted_at        = models.DateTimeField(blank=True, null=True)
    created_at          = models.DateTimeField()
    # Short answer grading fields
    short_answer_score  = models.SmallIntegerField(blank=True, null=True)  # set by admin
    graded_by           = models.ForeignKey(
        Users, models.DO_NOTHING,
        null=True, blank=True,
        related_name='graded_attempts',
        db_column='graded_by'
    )
    graded_at           = models.DateTimeField(null=True, blank=True)
    grading_status      = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('graded', 'Graded')],
        default='pending'
    )
    # Staff declaration
    declaration_signed  = models.BooleanField(default=False)
    declaration_name    = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        result = 'PASSED' if self.passed else 'FAILED'
        return f"{self.user} — {self.quiz} — {result} ({self.score_percent}%)"

    class Meta:
        managed = False
        db_table = 'quiz_attempts'
        verbose_name = 'Quiz Attempt'
        verbose_name_plural = 'Quiz Attempts'


class QuizAnswers(models.Model):
    attempt         = models.ForeignKey(QuizAttempts, models.DO_NOTHING)
    question        = models.ForeignKey(QuizQuestions, models.DO_NOTHING)
    selected_option = models.ForeignKey(QuizOptions, models.DO_NOTHING, blank=True, null=True)
    short_answer_text = models.TextField(blank=True, null=True)   # for short_answer questions
    is_correct      = models.BooleanField(default=False)

    def __str__(self):
        correct = 'Correct' if self.is_correct else 'Wrong'
        return f"Attempt {self.attempt_id} — Q{self.question_id} — {correct}"

    class Meta:
        managed = False
        db_table = 'quiz_answers'
        verbose_name = 'Quiz Answer'
        verbose_name_plural = 'Quiz Answers'


class Certificates(models.Model):
    certificate_id    = models.UUIDField(unique=True)
    user              = models.ForeignKey(Users, models.DO_NOTHING)
    course            = models.ForeignKey(Courses, models.DO_NOTHING)
    course_version    = models.CharField(max_length=20)
    issued_at         = models.DateTimeField()
    file_storage_key  = models.TextField(blank=True, null=True)
    created_at        = models.DateTimeField()
    expires_at        = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user} — {self.course} (issued: {self.issued_at.strftime('%d %b %Y')})"

    class Meta:
        managed = False
        db_table = 'certificates'
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'


class QuizUnlockRequests(models.Model):

    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('denied',   'Denied'),
    ]

    user         = models.ForeignKey(Users, models.DO_NOTHING, related_name='unlock_requests')
    quiz         = models.ForeignKey(Quizzes, models.DO_NOTHING)
    reason       = models.TextField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by  = models.ForeignKey(
        Users, models.DO_NOTHING, null=True, blank=True,
        related_name='reviewed_requests', db_column='reviewed_by'
    )
    reviewed_at  = models.DateTimeField(null=True, blank=True)
    review_note  = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} — {self.quiz} — {self.status}"

    class Meta:
        managed = False
        db_table = 'quiz_unlock_requests'
        verbose_name = 'Quiz Unlock Request'
        verbose_name_plural = 'Quiz Unlock Requests'


# ── Notifications ─────────────────────────────────────────────────────
class Notifications(models.Model):

    TYPE_CHOICES = [
        ('certificate_issued',   'Certificate Issued'),
        ('quiz_locked',          'Quiz Locked'),
        ('unlock_approved',      'Unlock Approved'),
        ('unlock_denied',        'Unlock Denied'),
        ('short_answer_graded',  'Short Answer Graded'),
        ('general',              'General'),
    ]

    recipient    = models.ForeignKey(Users, models.DO_NOTHING, related_name='notifications')
    notif_type   = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    title        = models.CharField(max_length=255)
    message      = models.TextField()
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient} — {self.notif_type} ({'read' if self.is_read else 'unread'})"

    class Meta:
        managed = True   # Django will create this table
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']