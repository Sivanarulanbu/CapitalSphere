from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import LoanApplication
import os
from email.mime.image import MIMEImage

@receiver(post_save, sender=LoanApplication)
def send_personal_loan_email(sender, instance, created, **kwargs):
    if instance.loan_type == 'personal':
        user = instance.user
        subject = f"CapitalSphere: Update on your Personal Loan Application"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user.email]
        
        if created:
            message = "We have successfully received your personal loan application and it is currently under review."
        else:
            if instance.status == 'approved':
                message = f"Congratulations! Your personal loan application for ₹{instance.approved_amount or instance.requested_amount} has been approved."
            elif instance.status == 'rejected':
                message = "Unfortunately, your personal loan application could not be approved at this time."
            elif instance.status == 'disbursed':
                message = f"Your personal loan of ₹{instance.approved_amount or instance.requested_amount} has been formally disbursed to your account."
            else:
                message = f"Your personal loan application status has been updated to: {instance.get_status_display()}."

        context = {
            'user': user,
            'loan_type': instance.get_loan_type_display(),
            'amount': instance.approved_amount or instance.requested_amount,
            'status': instance.get_status_display(),
            'message': message,
            'year': 2026,
        }
        
        html_content = render_to_string('emails/loan_email.html', context)
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'brand', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_image = MIMEImage(f.read())
                logo_image.add_header('Content-ID', '<logo.png>')
                msg.attach(logo_image)
                
        try:
            msg.send(fail_silently=True)
        except Exception as e:
            print(f"Failed to send email: {e}")
