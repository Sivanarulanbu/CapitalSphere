from celery import shared_task
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from .models import ScheduledTransfer
from .services import TransferService
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_scheduled_transfers():
    logger.info("Starting processing of scheduled transfers...")
    today = timezone.now().date()
    transfers = ScheduledTransfer.objects.filter(is_active=True, next_run_date__lte=today)
    
    count = 0
    for transfer in transfers:
        # Generate an idempotency key specifically for this run to avoid duplicate executions
        idempotency_key = f"SCHED_{transfer.id}_{today.strftime('%Y%m%d')}"
        
        success, message, txn = TransferService.execute_transfer(
            sender_account_id=transfer.sender_account.id,
            receiver_account_number=transfer.receiver_account_number,
            amount=transfer.amount,
            pin=None,
            user=transfer.sender_account.user,
            description=transfer.description or "Automated Scheduled Transfer",
            bypass_pin=True,
            idempotency_key=idempotency_key
        )
        
        if success:
            logger.info(f"Processed scheduled transfer {transfer.id} successfully.")
        else:
            logger.error(f"Scheduled transfer {transfer.id} failed: {message}")
            
        # Update next run date regardless of success/failure (or could mark inactive on failure)
        # Assuming we want to retry or just skip to next if failed due to balance
        if transfer.frequency == 'daily':
            transfer.next_run_date = today + relativedelta(days=1)
        elif transfer.frequency == 'weekly':
            transfer.next_run_date = today + relativedelta(weeks=1)
        elif transfer.frequency == 'monthly':
            transfer.next_run_date = today + relativedelta(months=1)
            
        transfer.save(update_fields=['next_run_date', 'updated_at'])
        count += 1
        
    logger.info(f"Finished processing {count} scheduled transfers.")
