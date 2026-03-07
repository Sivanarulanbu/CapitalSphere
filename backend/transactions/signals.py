from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Transaction
from decimal import Decimal
import os
from email.mime.image import MIMEImage

@receiver(post_save, sender=Transaction)
def send_high_value_credit_alert(sender, instance, created, **kwargs):
    if instance.status == 'completed' and instance.amount > Decimal('50000.00'):
        if instance.transaction_type in ['credit', 'transfer', 'loan_disbursement']:
            if instance.receiver_account and instance.receiver_account.user:
                # To prevent sending multiple times, checking 'created' is naive if it was updated to complete later.
                # However, usually a transaction is created as 'completed' immediately in this system or 'pending' then 'completed'.
                user = instance.receiver_account.user
                subject = f"CapitalSphere: High Value Deposit Alert - ₹{instance.amount}"
                from_email = settings.DEFAULT_FROM_EMAIL
                to_email = [user.email]
                
                context = {
                    'user': user,
                    'reference_number': instance.reference_number,
                    'amount': instance.amount,
                    'balance': instance.receiver_balance_after or instance.receiver_account.balance,
                    'year': 2026,
                }
                
                html_content = render_to_string('emails/high_value_credit.html', context)
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
