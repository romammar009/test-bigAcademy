from django.urls import path
from . import views

urlpatterns = [

    # AUTH
    path('auth/login/',           views.login,           name='login'),
    path('auth/logout/',          views.logout,          name='logout'),
    path('auth/me/',              views.my_profile,      name='my-profile'),
    path('auth/change-password/', views.change_password, name='change-password'),

    # LOCATIONS
    path('locations/', views.list_locations, name='list-locations'),

    # USER MANAGEMENT
    path('users/register/',                    views.register_user,  name='register-user'),
    path('users/<int:user_id>/update/',        views.update_user,    name='update-user'),
    path('users/<int:user_id>/offboard/',      views.offboard_user,  name='offboard-user'),
    path('users/', views.list_users, name='list-users'),

    # COURSES
    path('courses/',                           views.course_list_create, name='course-list-create'),
    path('courses/<int:course_id>/',           views.course_detail,      name='course-detail'),
    path('courses/<int:course_id>/publish/', views.publish_course, name='publish-course'),
    path('courses/<int:course_id>/certificate/generate/', views.generate_certificate, name='generate-certificate'),

    # MODULES
    path('courses/<int:course_id>/modules/',   views.module_create,  name='module-create'),

    # LESSONS
    path('modules/<int:module_id>/lessons/',   views.lesson_create,  name='lesson-create'),
    path('lessons/upload/', views.lesson_file_upload, name='lesson-upload'),

    # QUIZZES
    path('courses/<int:course_id>/quizzes/',   views.quiz_create,    name='quiz-create'),
    path('quizzes/<int:quiz_id>/last-attempt/', views.quiz_last_attempt_answers, name='quiz-last-attempt'),

    # QUESTIONS
    path('quizzes/<int:quiz_id>/questions/',   views.question_create, name='question-create'),

    # OPTIONS
    path('questions/<int:question_id>/options/', views.option_create, name='option-create'),

    # LEARNING EXPERIENCE
    path('courses/<int:course_id>/progress/', views.course_progress, name='course-progress'),
    path('courses/browse/',                    views.browse_courses,  name='browse-courses'),
    path('courses/<int:course_id>/enrol/',     views.enrol_course,    name='enrol-course'),
    path('my-learning/',                       views.my_learning,     name='my-learning'),
    path('lessons/<int:lesson_id>/complete/',  views.complete_lesson, name='complete-lesson'),
    path('certificates/',                      views.my_certificates, name='my-certificates'),

    # QUIZ ATTEMPTS
    path('quizzes/<int:quiz_id>/status/', views.quiz_attempt_status, name='quiz-status'),
    path('quizzes/<int:quiz_id>/attempt/',      views.start_quiz_attempt,   name='start-quiz-attempt'),
    path('attempts/<int:attempt_id>/submit/',   views.submit_quiz_attempt,  name='submit-quiz-attempt'),
    path('quizzes/<int:quiz_id>/unlock-request/', views.request_quiz_unlock, name='quiz-unlock-request'),
    path('unlock-requests/<int:request_id>/',   views.review_unlock_request, name='review-unlock-request'),
    path('unlock-requests/', views.list_unlock_requests, name='list-unlock-requests'),
    path('attempts/pending-grading/', views.pending_short_answer_attempts, name='pending-grading'),
    path('attempts/<int:attempt_id>/grade/', views.grade_short_answer_attempt, name='grade-attempt'),
    
    # DELETE ENDPOINTS
    path('modules/<int:module_id>/delete/',     views.delete_module,   name='delete-module'),
    path('lessons/<int:lesson_id>/delete/',     views.delete_lesson,   name='delete-lesson'),
    path('quizzes/<int:quiz_id>/delete/',       views.delete_quiz,     name='delete-quiz'),
    path('questions/<int:question_id>/delete/', views.delete_question, name='delete-question'),
    path('options/<int:option_id>/delete/',     views.delete_option,   name='delete-option'),
    
    # EDIT ENDPOINTS
    path('modules/<int:module_id>/edit/',     views.edit_module,   name='edit-module'),
    path('lessons/<int:lesson_id>/edit/',     views.edit_lesson,   name='edit-lesson'),
    path('quizzes/<int:quiz_id>/edit/',       views.edit_quiz,     name='edit-quiz'),
    path('questions/<int:question_id>/edit/', views.edit_question, name='edit-question'),
    path('options/<int:option_id>/edit/',     views.edit_option,   name='edit-option'),

    # NOTIFICATIONS
    path('notifications/',            views.my_notifications,        name='get-notifications'),
    path('notifications/mark-read/',  views.mark_notifications_read, name='mark-notifications-read'),
    
    # ASSIGNMENTS
    path('assignments/',                        views.list_assignments,   name='list-assignments'),
    path('assignments/create/',                 views.create_assignment,  name='create-assignment'),
    path('assignments/<int:assignment_id>/delete/', views.delete_assignment, name='delete-assignment'),
    path('assignments/preview/', views.preview_assignment_users, name='assignment-preview'),
    # REPORTS
    path('reports/completion/', views.report_completion, name='report-completion'),
    path('reports/staff/',      views.report_staff,      name='report-staff'),

    # TOGGLE ENDPOINT
    path('assignments/<int:assignment_id>/toggle/', views.toggle_assignment, name='toggle-assignment'),
    path('assignments/<int:assignment_id>/edit/', views.edit_assignment, name='edit-assignment'),
]