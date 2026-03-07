from django.contrib import admin
from .models import Account, Beneficiary


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'user', 'account_type', 'balance', 'status', 'created_at']
    list_filter = ['account_type', 'status']
    search_fields = ['account_number', 'user__email', 'user__full_name']
    readonly_fields = ['id', 'account_number', 'created_at', 'updated_at']
    ordering = ['-created_at']

    actions = ['freeze_accounts', 'activate_accounts']

    def freeze_accounts(self, request, queryset):
        queryset.update(status='frozen')
        self.message_user(request, f"{queryset.count()} accounts frozen.")
    freeze_accounts.short_description = "Freeze selected accounts"

    def activate_accounts(self, request, queryset):
        queryset.update(status='active')
        self.message_user(request, f"{queryset.count()} accounts activated.")
    activate_accounts.short_description = "Activate selected accounts"


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = ['user', 'beneficiary_name', 'account_number', 'bank_name', 'is_active']
    list_filter = ['is_active', 'bank_name']
    search_fields = ['user__email', 'beneficiary_name', 'account_number']
