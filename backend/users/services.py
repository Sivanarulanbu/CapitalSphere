from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import OTPVerification
import logging

logger = logging.getLogger(__name__)


def send_otp_email(user, purpose):
    """Generate OTP, save to DB, and send via email (or console in dev)."""
    # Expire old OTPs for this user + purpose
    OTPVerification.objects.filter(
        user=user, purpose=purpose, is_used=False
    ).update(is_used=True)

    otp_code = OTPVerification.generate_otp()
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    otp_obj = OTPVerification.objects.create(
        user=user,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at
    )

    # The email sending is now handled by the post_save signal on OTPVerification 
    # to maintain branding consistency and support HTML templates.
    return otp_code


def verify_otp(user, otp_code, purpose):
    """Verify the OTP for a given user and purpose."""
    try:
        otp = OTPVerification.objects.filter(
            user=user,
            otp_code=otp_code,
            purpose=purpose,
            is_used=False
        ).latest('created_at')

        if not otp.is_valid():
            return False, 'OTP has expired.'

        otp.is_used = True
        otp.save()
        return True, 'OTP verified successfully.'

    except OTPVerification.DoesNotExist:
        return False, 'Invalid OTP.'


def get_client_ip(request):
    """Extract real client IP from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
