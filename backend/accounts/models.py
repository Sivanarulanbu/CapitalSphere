import uuid
import random
import string
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


def generate_account_number():
    """Generate a unique 10-digit account number."""
    return ''.join(random.choices(string.digits, k=10))


class Account(models.Model):
    ACCOUNT_TYPES = [
        ('savings', 'Savings Account'),
        ('current', 'Current Account'),
        ('fixed_deposit', 'Fixed Deposit'),
        ('salary', 'Salary Account'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('frozen', 'Frozen'),
        ('closed', 'Closed'),
        ('pending', 'Pending Activation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bank_accounts'
    )
    account_number = models.CharField(max_length=20, unique=True, default=generate_account_number)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='savings')
    balance = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('3.50'))
    daily_transfer_limit = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('100000.00'))
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account_number} ({self.account_type}) - {self.user.full_name}"

    @property
    def masked_account_number(self):
        return f"****{self.account_number[-4:]}"

    def can_debit(self, amount):
        return self.status == 'active' and self.balance >= Decimal(str(amount))


class Beneficiary(models.Model):
    """Saved beneficiaries for quick transfers."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='beneficiaries'
    )
    beneficiary_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=20)
    bank_name = models.CharField(max_length=100, default='CapitalSphere')
    nickname = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'beneficiaries'
        ordering = ['beneficiary_name']
        unique_together = ['user', 'account_number']

    def __str__(self):
        return f"{self.beneficiary_name} ({self.account_number})"


def generate_card_number():
    """Generate a 16-digit card number starting with 4 (Visa)."""
    return '4' + ''.join(random.choices(string.digits, k=15))

class VirtualCard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='virtual_cards'
    )
    card_number = models.CharField(max_length=16, unique=True, default=generate_card_number)
    cvv = models.CharField(max_length=3)
    expiry_date = models.CharField(max_length=5) # MM/YY
    is_active = models.BooleanField(default=True)
    daily_spend_limit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('50000.00'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'virtual_cards'
        ordering = ['-created_at']

    def __str__(self):
        return f"**** {self.card_number[-4:]} for {self.account.account_number}"

    def save(self, *args, **kwargs):
        if not self.cvv:
            self.cvv = ''.join(random.choices(string.digits, k=3))
        if not self.expiry_date:
            import datetime
            now = datetime.datetime.now()
            # 3 years validity
            expiry = now.replace(year=now.year + 3)
            self.expiry_date = expiry.strftime('%m/%y')
        super().save(*args, **kwargs)
