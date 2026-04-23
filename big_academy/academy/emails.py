import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)

LOGIN_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')


def _send(subject, template_name, context, to_email):
    try:
        html_body = render_to_string(f'emails/{template_name}', context)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=subject,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send()
    except Exception:
        logger.exception('Failed to send email "%s" to %s', subject, to_email)


def send_welcome_email(user, raw_password, enrolled_courses=None):
    _send(
        subject='Welcome to Big Childcare Academy',
        template_name='welcome.html',
        context={
            'first_name':    user.first_name,
            'email':         user.email,
            'temp_password': raw_password,
            'role':          user.role.replace('_', ' ').title(),
            'courses':       enrolled_courses or [],
            'login_url':     LOGIN_URL,
        },
        to_email=user.email,
    )


def send_certificate_email(user, course, certificate):
    _send(
        subject=f'Your Certificate for "{course.title}" is Ready',
        template_name='certificate_issued.html',
        context={
            'first_name':     user.first_name,
            'course_title':   course.title,
            'issued_at':      certificate.issued_at.strftime('%d %B %Y'),
            'expires_at':     certificate.expires_at.strftime('%d %B %Y') if certificate.expires_at else None,
            'certificate_id': str(certificate.certificate_id),
            'login_url':      LOGIN_URL,
        },
        to_email=user.email,
    )


def send_unlock_approved_email(user, quiz, review_note=''):
    _send(
        subject=f'Quiz Unlock Approved — "{quiz.title}"',
        template_name='unlock_approved.html',
        context={
            'first_name':  user.first_name,
            'quiz_title':  quiz.title,
            'review_note': review_note,
            'login_url':   LOGIN_URL,
        },
        to_email=user.email,
    )


def send_unlock_denied_email(user, quiz, review_note=''):
    _send(
        subject=f'Quiz Unlock Request Update — "{quiz.title}"',
        template_name='unlock_denied.html',
        context={
            'first_name':  user.first_name,
            'quiz_title':  quiz.title,
            'review_note': review_note,
            'login_url':   LOGIN_URL,
        },
        to_email=user.email,
    )


def send_assignment_reminder_email(user, course, assignment):
    due_at = None
    if assignment.due_at:
        due_at = assignment.due_at.strftime('%d %B %Y')

    _send(
        subject=f'New Course Assigned: "{course.title}"',
        template_name='assignment_reminder.html',
        context={
            'first_name':          user.first_name,
            'course_title':        course.title,
            'course_description':  course.description or '',
            'estimated_minutes':   course.estimated_minutes,
            'due_at':              due_at,
            'mandatory':           assignment.mandatory,
            'login_url':           LOGIN_URL,
        },
        to_email=user.email,
    )


def send_password_reset_email(user, new_password):
    _send(
        subject='Your Big Academy Password Has Been Reset',
        template_name='password_reset.html',
        context={
            'first_name':    user.first_name,
            'temp_password': new_password,
            'login_url':     LOGIN_URL,
        },
        to_email=user.email,
    )
