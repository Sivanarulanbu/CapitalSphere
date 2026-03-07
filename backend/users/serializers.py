from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
from .models import User, OTPVerification, KYCDocument, AuditLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='user', required=False)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'password', 'confirm_password', 'date_of_birth', 'role']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    login_type = serializers.CharField(required=False)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated. Contact support.')
            
        login_type = data.get('login_type')
        if login_type == 'banker' and not (getattr(user, 'is_admin', False) or getattr(user, 'is_loan_officer', False)):
            raise serializers.ValidationError('This email is not registered as a Banker.')
        if login_type == 'customer' and (getattr(user, 'is_admin', False) or getattr(user, 'is_loan_officer', False)):
            raise serializers.ValidationError('This email is registered as a Banker. Please login from the Banker portal.')

        data['user'] = user
        return data


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'profile_picture',
            'date_of_birth', 'address', 'role', 'is_verified',
            'kyc_status', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'kyc_status', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class SetTransactionPINSerializer(serializers.Serializer):
    pin = serializers.CharField(max_length=6, min_length=4)
    confirm_pin = serializers.CharField(max_length=6, min_length=4)

    def validate(self, data):
        if data['pin'] != data['confirm_pin']:
            raise serializers.ValidationError({'confirm_pin': 'PINs do not match.'})
        if not data['pin'].isdigit():
            raise serializers.ValidationError({'pin': 'PIN must contain only digits.'})
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class AdminUserSerializer(serializers.ModelSerializer):
    account_count = serializers.SerializerMethodField()
    accounts = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'is_verified', 'is_active', 'kyc_status',
            'created_at', 'account_count', 'accounts'
        ]

    def get_accounts(self, obj):
        from accounts.serializers import AccountSummarySerializer
        return AccountSummarySerializer(obj.bank_accounts.all(), many=True).data

    def get_account_count(self, obj):
        return obj.bank_accounts.count()


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = ['id', 'document_type', 'document_number', 'front_image', 'back_image', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'action_display', 'description', 'ip_address', 'is_success', 'created_at']
