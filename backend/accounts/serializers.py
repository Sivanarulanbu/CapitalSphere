from rest_framework import serializers
from decimal import Decimal
from .models import Account, Beneficiary


class AccountSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    masked_number = serializers.CharField(source='masked_account_number', read_only=True)

    class Meta:
        model = Account
        fields = [
            'id', 'account_number', 'masked_number', 'account_type', 'balance',
            'status', 'interest_rate', 'daily_transfer_limit',
            'description', 'user_name', 'created_at'
        ]
        read_only_fields = ['id', 'account_number', 'balance', 'status', 'created_at']


class AccountCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['account_type', 'description']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class AccountSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard cards."""
    class Meta:
        model = Account
        fields = ['id', 'account_number', 'account_type', 'balance', 'status']


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        fields = ['id', 'beneficiary_name', 'account_number', 'bank_name', 'nickname', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
