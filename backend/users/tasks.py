from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import OTPVerification
import os
from email.mime.image import MIMEImage
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_otp_email_task(otp_id):
    try:
        instance = OTPVerification.objects.get(id=otp_id)
        user = instance.user
        subject = f"CapitalSphere: Your OTP for {instance.purpose.replace('_', ' ').capitalize()}"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user.email]
        
        context = {
            'user': user,
            'message': f"Your One-Time Password (OTP) for {instance.purpose.replace('_', ' ').capitalize()} is:<br><br><span style='font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #00d4aa;'>{instance.otp_code}</span><br><br><span style='font-size: 14px; color: #94a3b8;'>It will expire in 5 minutes.</span>",
            'year': 2026,
        }
        
        html_content = render_to_string('emails/auth_email.html', context)
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'brand', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_image = MIMEImage(f.read())
                logo_image.add_header('Content-ID', '<logo.png>')
                msg.attach(logo_image)
                
        msg.send(fail_silently=False)
        logger.info(f"OTP email sent for user {user.email}")
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
