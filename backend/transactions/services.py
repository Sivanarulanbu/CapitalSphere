from django.db import transaction as db_transaction
from django.contrib.auth.hashers import check_password
from decimal import Decimal
from django.utils import timezone
from .models import Transaction, Ledger
from accounts.models import Account
from users.models import AuditLog
import logging

logger = logging.getLogger(__name__)


class TransferService:
    """
    Handles atomic fund transfers between accounts.
    Uses Django's select_for_update() to prevent race conditions.
    """

    @staticmethod
    def execute_transfer(sender_account_id, receiver_account_number, amount, pin, user, description='', bypass_pin=False, idempotency_key=None, client_ip=None):
        """
        Perform an atomic fund transfer.
        Returns (success: bool, message: str, transaction: Transaction|None)
        """
        if idempotency_key:
            existing_txn = Transaction.objects.filter(idempotency_key=idempotency_key).first()
            if existing_txn:
                return True, 'Transfer already completed (Idempotent replay).', existing_txn

        amount = Decimal(str(amount))

        # Verify transaction PIN
        if not bypass_pin:
            if not user.transaction_pin:
                return False, 'Transaction PIN not set. Please set your PIN first.', None

            if not check_password(pin, user.transaction_pin):
                return False, 'Invalid transaction PIN.', None

        if amount <= Decimal('0'):
            return False, 'Transfer amount must be greater than zero.', None

        if amount > Decimal('100000'):
            return False, 'Transfer amount exceeds daily limit of ₹1,00,000.', None

        try:
            # First fetch receiver to identify ID without locking
            target = Account.objects.get(account_number=receiver_account_number)
        except Account.DoesNotExist:
            return False, 'Receiver account not found.', None

        if str(sender_account_id) == str(target.id):
            return False, 'Cannot transfer to the same account.', None

        # To prevent postgres deadlocks, we must sort the IDs and lock in consistent order
        acc_ids = sorted([str(sender_account_id), str(target.id)])

        try:
            with db_transaction.atomic():
                # Lock rows sequentially
                Account.objects.select_for_update().get(id=acc_ids[0])
                Account.objects.select_for_update().get(id=acc_ids[1])

                # Get the securely locked instances
                sender = Account.objects.get(id=sender_account_id, user=user)
                receiver = Account.objects.get(id=target.id)

                if sender.status != 'active':
                    return False, f'Your account is {sender.status}. Cannot transfer.', None

                if sender.balance < amount:
                    return False, f'Insufficient balance. Available: ₹{sender.balance}', None

                if receiver.status != 'active':
                    return False, 'Receiver account is not active.', None

                # Deduct from sender
                sender.balance -= amount
                sender.save(update_fields=['balance', 'updated_at'])

                # Credit receiver
                receiver.balance += amount
                receiver.save(update_fields=['balance', 'updated_at'])

                # Fraud Detection Logic
                risk_score = 0
                if amount > Decimal('50000'):
                    risk_score += 30  # High value
                
                # Check for recent transfers to same receiver (velocity check)
                ten_mins_ago = timezone.now() - timezone.timedelta(minutes=10)
                recent_count = Transaction.objects.filter(
                    sender_account=sender,
                    receiver_account=receiver,
                    created_at__gte=ten_mins_ago
                ).count()
                
                if recent_count > 2:
                    risk_score += 40  # Rapid transfers

                # IP / Geo-location anomaly checks
                if client_ip and client_ip != getattr(user, 'last_login_ip', None):
                    risk_score += 30  # Device/IP mismatch
                    logger.warning(f"IP mismatch detected for user {user.email}. Expected: {getattr(user, 'last_login_ip', 'unknown')}, Got: {client_ip}")

                is_flagged = risk_score >= 70
                # Block the transaction immediately if extremely high risk
                if risk_score >= 90:
                    raise Exception("Transaction blocked by Fraud Engine due to extreme Risk Score.")

                # Create transaction record
                txn = Transaction.objects.create(
                    sender_account=sender,
                    receiver_account=receiver,
                    amount=amount,
                    transaction_type='transfer',
                    status='completed',
                    idempotency_key=idempotency_key,
                    description=description or f'Transfer to {receiver.user.full_name}',
                    sender_balance_after=sender.balance,
                    receiver_balance_after=receiver.balance,
                    risk_score=risk_score,
                    is_flagged=is_flagged
                )

                # DOUBLE-ENTRY LEDGER: Entry 1 (Sender Debit)
                Ledger.objects.create(
                    transaction=txn,
                    account=sender,
                    entry_type='debit',
                    amount=amount,
                    balance_after=sender.balance,
                    description=f"Fund transfer (Outgoing) to {receiver.account_number}"
                )

                # DOUBLE-ENTRY LEDGER: Entry 2 (Receiver Credit)
                Ledger.objects.create(
                    transaction=txn,
                    account=receiver,
                    entry_type='credit',
                    amount=amount,
                    balance_after=receiver.balance,
                    description=f"Fund transfer (Incoming) from {sender.account_number}"
                )

                # Create Audit Log
                AuditLog.objects.create(
                    user=user,
                    action='transfer',
                    ip_address=client_ip,
                    description=f"Transferred ₹{amount} to {receiver.account_number}. Reference: {txn.reference_number}. Risk: {risk_score}",
                    is_success=True
                )

                if is_flagged:
                    logger.warning(f"SUSPICIOUS TRANSFER FLAGGED: {txn.reference_number} for user {user.email}")

                logger.info(f"Transfer {txn.reference_number}: ₹{amount} from {sender.account_number} to {receiver.account_number}")
                return True, 'Transfer successful.', txn

        except Account.DoesNotExist:
            return False, 'Sender account not found.', None
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return False, 'Transfer failed due to a server error.', None

class SelfDepositService:
    @staticmethod
    def execute_deposit(account_id, amount, user, description='Online Deposit'):
        amount = Decimal(str(amount))

        if amount <= Decimal('0'):
            return False, 'Deposit amount must be greater than zero.', None

        try:
            with db_transaction.atomic():
                account = Account.objects.select_for_update().get(id=account_id, user=user)

                if account.status != 'active':
                    return False, f'Your account is {account.status}. Cannot deposit.', None

                account.balance += amount
                account.save(update_fields=['balance', 'updated_at'])

                txn = Transaction.objects.create(
                    receiver_account=account,
                    amount=amount,
                    transaction_type='credit',
                    status='completed',
                    description=description,
                    receiver_balance_after=account.balance,
                )

                # DOUBLE-ENTRY LEDGER: Single Entry (External credit to system liability)
                Ledger.objects.create(
                    transaction=txn,
                    account=account,
                    entry_type='credit',
                    amount=amount,
                    balance_after=account.balance,
                    description=f"External credit/self-deposit"
                )
                
                # Audit Log
                AuditLog.objects.create(
                    user=user,
                    action='deposit',
                    description=f"Self-deposited ₹{amount} to {account.account_number}. Reference: {txn.reference_number}",
                    is_success=True
                )
                
                logger.info(f"Self Deposit {txn.reference_number}: ₹{amount} to {account.account_number}")
                return True, 'Deposit successful.', txn

        except Account.DoesNotExist:
            return False, 'Account not found or belongs to another user.', None
        except Exception as e:
            logger.error(f"Deposit failed: {e}")
            return False, 'Deposit failed due to a server error.', None
