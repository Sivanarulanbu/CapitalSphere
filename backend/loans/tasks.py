from celery import shared_task
from django.utils import timezone
from .models import EMISchedule
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_emi_reminders():
    logger.info("Evaluating EMI Schedules for payment reminders...")
    
    # 3 Days before due date
    target_date = timezone.now().date() + timedelta(days=3)
    
    due_emis = EMISchedule.objects.filter(due_date=target_date, status='pending').select_related('loan__user')
    count = 0
    
    from users.tasks import send_action_email_task
    
    for emi in due_emis:
        user = emi.loan.user
        count += 1
        send_action_email_task.delay(
            user.email, getattr(user, 'full_name', 'Customer'),
            title="Upcoming EMI Due Alert",
            subject=f"CapitalSphere: Loan EMI Due in 3 Days (₹{emi.amount})",
            message=f"This is a formal reminder that the upcoming EMI (#{emi.emi_number}) of ₹{emi.amount} relating to your {emi.loan.get_loan_type_display()} loan is due precisely on {emi.due_date.strftime('%d-%b-%Y')}."
        )
        
    logger.info(f"Dispatched {count} upcoming EMI alert emails safely.")
