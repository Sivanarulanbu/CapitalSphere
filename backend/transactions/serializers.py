from rest_framework import serializers
from .models import Transaction, Ledger
from accounts.models import Account


class TransactionSerializer(serializers.ModelSerializer):
    sender_account_number = serializers.CharField(source='sender_account.account_number', read_only=True)
    receiver_account_number = serializers.CharField(source='receiver_account.account_number', read_only=True)
    sender_name = serializers.CharField(source='sender_account.user.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver_account.user.full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference_number', 'transaction_type', 'status',
            'amount', 'description',
            'sender_account_number', 'sender_name', 'sender_balance_after',
            'receiver_account_number', 'receiver_name', 'receiver_balance_after',
            'created_at'
        ]
        read_only_fields = fields


class TransferInitiateSerializer(serializers.Serializer):
    sender_account_id = serializers.UUIDField()
    receiver_account_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    pin = serializers.CharField(max_length=6, write_only=True)
    description = serializers.CharField(max_length=255, required=False, default='')

    def validate_amount(self, value):
        from decimal import Decimal
        if value <= Decimal('0'):
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class TransactionFilterSerializer(serializers.Serializer):
    account_id = serializers.UUIDField(required=False)
    transaction_type = serializers.ChoiceField(
        choices=['credit', 'debit', 'transfer', 'all'],
        required=False,
        default='all'
    )
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)


class DepositInitiateSerializer(serializers.Serializer):
    account_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False, default='Deposit')

    def validate_amount(self, value):
        from decimal import Decimal
        if value <= Decimal('0'):
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value


class LedgerSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    user_name = serializers.CharField(source='account.user.full_name', read_only=True)
    reference = serializers.CharField(source='transaction.reference_number', read_only=True)

    class Meta:
        model = Ledger
        fields = [
            'id', 'reference', 'account_number', 'user_name',
            'entry_type', 'amount', 'balance_after', 'description', 'created_at'
        ]
