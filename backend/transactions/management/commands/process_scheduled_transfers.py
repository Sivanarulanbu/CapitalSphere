import logging
import calendar
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from transactions.models import ScheduledTransfer
from transactions.services import TransferService

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process all active scheduled transfers that are due for today'

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        transfers_due = ScheduledTransfer.objects.filter(is_active=True, next_run_date__lte=today)
        
        count = 0
        for scheduled in transfers_due:
            user = scheduled.sender_account.user
            success, message, txn = TransferService.execute_transfer(
                sender_account_id=scheduled.sender_account.id,
                receiver_account_number=scheduled.receiver_account_number,
                amount=scheduled.amount,
                pin=None,
                user=user,
                description=scheduled.description or f"Scheduled Transfer ({scheduled.frequency})",
                bypass_pin=True
            )
            
            if success:
                logger.info(f"Successfully processed Scheduled Transfer ID {scheduled.id}")
                count += 1
                
                # Update next run date
                if scheduled.frequency == 'daily':
                    scheduled.next_run_date = today + timedelta(days=1)
                elif scheduled.frequency == 'weekly':
                    scheduled.next_run_date = today + timedelta(days=7)
                elif scheduled.frequency == 'monthly':
                    next_month = today.month % 12 + 1
                    year = today.year + (1 if today.month == 12 else 0)
                    try:
                        scheduled.next_run_date = today.replace(year=year, month=next_month)
                    except ValueError:
                        # Handle end of month edge cases (e.g. Jan 31 -> Feb 28/29)
                        last_day = calendar.monthrange(year, next_month)[1]
                        scheduled.next_run_date = today.replace(year=year, month=next_month, day=last_day)
                
                scheduled.save()
            else:
                logger.error(f"Scheduled Transfer ID {scheduled.id} failed: {message}")
                
        self.stdout.write(self.style.SUCCESS(f'Successfully processed {count} scheduled transfers.'))
