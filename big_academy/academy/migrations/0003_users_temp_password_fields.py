from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academy', '0002_quizzes_module'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='users',
            name='temp_password_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
