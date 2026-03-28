from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import OTPVerification
import os
from email.mime.image import MIMEImage

@receiver(post_save, sender=OTPVerification)
def send_otp_email(sender, instance, created, **kwargs):
    if created:
        from .tasks import send_otp_email_task
        send_otp_email_task.delay(instance.id)
