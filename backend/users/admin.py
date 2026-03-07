from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPVerification, LoginSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'phone', 'role', 'is_verified', 'kyc_status', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'kyc_status']
    search_fields = ['email', 'full_name', 'phone']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login_ip']

    fieldsets = (
        ('Account Info', {'fields': ('id', 'email', 'password', 'full_name', 'phone')}),
        ('Personal Info', {'fields': ('date_of_birth', 'address', 'profile_picture')}),
        ('Status', {'fields': ('role', 'is_verified', 'is_active', 'kyc_status', 'is_staff', 'is_superuser')}),
        ('Security', {'fields': ('transaction_pin', 'failed_login_attempts', 'last_login_ip')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone', 'password1', 'password2', 'role'),
        }),
    )

    actions = ['verify_users', 'deactivate_users', 'activate_users']

    def verify_users(self, request, queryset):
        queryset.update(is_verified=True, kyc_status='verified')
        self.message_user(request, f"{queryset.count()} users verified.")
    verify_users.short_description = "Verify selected users"

    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} users deactivated.")
    deactivate_users.short_description = "Deactivate selected users"

    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} users activated.")
    activate_users.short_description = "Activate selected users"


@admin.register(OTPVerification)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['user', 'purpose', 'otp_code', 'is_used', 'created_at', 'expires_at']
    list_filter = ['purpose', 'is_used']
    search_fields = ['user__email']
    readonly_fields = ['created_at']


@admin.register(LoginSession)
class LoginSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'is_active', 'login_time', 'logout_time']
    list_filter = ['is_active']
    search_fields = ['user__email', 'ip_address']
    readonly_fields = ['login_time']
