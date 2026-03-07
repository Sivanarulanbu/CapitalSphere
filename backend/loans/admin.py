from django.contrib import admin
from .models import LoanApplication, EMISchedule


@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'loan_type', 'requested_amount', 'approved_amount',
        'status', 'tenure_months', 'created_at'
    ]
    list_filter = ['status', 'loan_type']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'reviewed_at', 'disbursed_at']
    ordering = ['-created_at']


@admin.register(EMISchedule)
class EMIScheduleAdmin(admin.ModelAdmin):
    list_display = ['loan', 'emi_number', 'due_date', 'amount', 'status']
    list_filter = ['status']
    readonly_fields = ['loan', 'emi_number']
