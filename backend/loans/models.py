import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class LoanApplication(models.Model):
    LOAN_TYPES = [
        ('personal', 'Personal Loan'),
        ('home', 'Home Loan'),
        ('car', 'Car Loan'),
        ('education', 'Education Loan'),
        ('business', 'Business Loan'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='loan_applications'
    )
    disbursement_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='loan_disbursements'
    )
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    requested_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('10000'))]
    )
    approved_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    interest_rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True
    )
    tenure_months = models.IntegerField(
        validators=[MinValueValidator(6), MaxValueValidator(360)],
        help_text='Loan tenure in months'
    )
    monthly_income = models.DecimalField(max_digits=15, decimal_places=2)
    employment_type = models.CharField(max_length=50, blank=True)
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_loans'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.loan_type} - ₹{self.requested_amount} ({self.status})"

    @property
    def emi_amount(self):
        """Calculate EMI using standard formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)"""
        if not self.approved_amount or not self.interest_rate or not self.tenure_months:
            return None
        P = float(self.approved_amount)
        annual_rate = float(self.interest_rate)
        r = annual_rate / (12 * 100)
        n = self.tenure_months
        if r == 0:
            return round(P / n, 2)
        emi = P * r * (1 + r) ** n / ((1 + r) ** n - 1)
        return round(emi, 2)

    @property
    def total_payable(self):
        if self.emi_amount and self.tenure_months:
            return round(self.emi_amount * self.tenure_months, 2)
        return None


class EMISchedule(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='emi_schedule')
    emi_number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    principal_component = models.DecimalField(max_digits=15, decimal_places=2)
    interest_component = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'emi_schedule'
        ordering = ['emi_number']
        unique_together = ['loan', 'emi_number']

    def __str__(self):
        return f"EMI #{self.emi_number} - {self.loan} - {self.status}"
