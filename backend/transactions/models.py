import uuid
import random
import string
from django.db import models
from django.conf import settings
from decimal import Decimal


def generate_reference():
    prefix = 'TXN'
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
    return f"{prefix}{suffix}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
        ('transfer', 'Transfer'),
        ('loan_disbursement', 'Loan Disbursement'),
        ('loan_repayment', 'Loan Repayment'),
        ('fee', 'Fee'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]
    CATEGORY_CHOICES = [
        ('shopping', 'Shopping'),
        ('food', 'Food & Dining'),
        ('entertainment', 'Entertainment'),
        ('bills', 'Bills & Utilities'),
        ('travel', 'Travel'),
        ('education', 'Education'),
        ('health', 'Health & Fitness'),
        ('investment', 'Investment'),
        ('loan', 'Loan'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sent_transactions'
    )
    receiver_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='received_transactions'
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_number = models.CharField(max_length=20, unique=True, default=generate_reference)
    description = models.TextField(blank=True)
    sender_balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    receiver_balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    risk_score = models.IntegerField(default=0)  # 0-100 scale
    is_flagged = models.BooleanField(default=False)
    failure_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender_account', '-created_at']),
            models.Index(fields=['receiver_account', '-created_at']),
            models.Index(fields=['reference_number']),
        ]

    def __str__(self):
        return f"{self.reference_number} - {self.amount} ({self.status})"


class Ledger(models.Model):
    ENTRY_TYPES = [
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ]

    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='ledger_entries')
    account = models.ForeignKey('accounts.Account', on_delete=models.CASCADE, related_name='ledger_entries')
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ledger'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_type} | {self.account.account_number} | {self.amount}"
