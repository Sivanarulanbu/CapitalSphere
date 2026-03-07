from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'transaction_type', 'amount',
        'status', 'sender_account', 'receiver_account', 'created_at'
    ]
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['reference_number', 'sender_account__account_number', 'receiver_account__account_number']
    readonly_fields = ['id', 'reference_number', 'created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing
            return self.readonly_fields + ['amount', 'sender_account', 'receiver_account']
        return self.readonly_fields
