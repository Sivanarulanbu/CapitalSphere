from rest_framework import serializers
from .models import LoanApplication, EMISchedule


class LoanApplicationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    emi_amount = serializers.ReadOnlyField()
    total_payable = serializers.ReadOnlyField()
    disbursement_account_number = serializers.CharField(
        source='disbursement_account.account_number', read_only=True
    )

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'user_name', 'loan_type', 'requested_amount', 'approved_amount',
            'purpose', 'status', 'interest_rate', 'tenure_months',
            'monthly_income', 'employment_type',
            'disbursement_account', 'disbursement_account_number',
            'emi_amount', 'total_payable',
            'rejection_reason', 'admin_notes',
            'created_at', 'reviewed_at', 'disbursed_at'
        ]
        read_only_fields = [
            'id', 'status', 'approved_amount', 'interest_rate',
            'admin_notes', 'rejection_reason', 'reviewed_at', 'disbursed_at'
        ]


class LoanApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = [
            'loan_type', 'requested_amount', 'purpose',
            'tenure_months', 'monthly_income', 'employment_type',
            'disbursement_account'
        ]

    def validate_requested_amount(self, value):
        from decimal import Decimal
        if value < Decimal('10000'):
            raise serializers.ValidationError('Minimum loan amount is ₹10,000.')
        if value > Decimal('5000000'):
            raise serializers.ValidationError('Maximum loan amount is ₹50,00,000.')
        return value


class LoanReviewSerializer(serializers.Serializer):
    """Admin: Approve or reject a loan."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    approved_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    admin_notes = serializers.CharField(required=False, default='')
    rejection_reason = serializers.CharField(required=False, default='')

    def validate(self, data):
        if data['action'] == 'approve':
            if not data.get('approved_amount'):
                raise serializers.ValidationError({'approved_amount': 'Required for approval.'})
            if not data.get('interest_rate'):
                raise serializers.ValidationError({'interest_rate': 'Required for approval.'})
        elif data['action'] == 'reject':
            if not data.get('rejection_reason'):
                raise serializers.ValidationError({'rejection_reason': 'Required for rejection.'})
        return data


class EMIScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EMISchedule
        fields = ['id', 'emi_number', 'due_date', 'amount', 'principal_component',
                  'interest_component', 'status', 'paid_at']
