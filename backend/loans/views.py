from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction as db_transaction
from decimal import Decimal
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from .models import LoanApplication, EMISchedule
from .serializers import (
    LoanApplicationSerializer, LoanApplySerializer,
    LoanReviewSerializer, EMIScheduleSerializer
)
from transactions.models import Transaction, Ledger
from accounts.models import Account
from users.models import AuditLog
from users.services import get_client_ip
import logging

logger = logging.getLogger(__name__)


def generate_emi_schedule(loan):
    """Generate EMI schedule for an approved loan."""
    EMISchedule.objects.filter(loan=loan).delete()

    P = float(loan.approved_amount)
    annual_rate = float(loan.interest_rate)
    r = annual_rate / (12 * 100)
    n = loan.tenure_months

    if r == 0:
        emi = P / n
    else:
        emi = P * r * (1 + r) ** n / ((1 + r) ** n - 1)

    balance = P
    schedules = []
    start_date = date.today()

    for i in range(1, n + 1):
        interest_component = balance * r
        principal_component = emi - interest_component
        balance -= principal_component

        try:
            due_date = start_date + relativedelta(months=i)
        except Exception:
            due_date = start_date + timedelta(days=30 * i)

        schedules.append(EMISchedule(
            loan=loan,
            emi_number=i,
            due_date=due_date,
            amount=round(emi, 2),
            principal_component=round(principal_component, 2),
            interest_component=round(interest_component, 2),
        ))

    EMISchedule.objects.bulk_create(schedules)


class LoanListCreateView(generics.ListCreateAPIView):
    """GET /api/loans/ — user's loan applications
       POST /api/loans/apply/ — apply for a loan"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return LoanApplySerializer if self.request.method == 'POST' else LoanApplicationSerializer

    def get_queryset(self):
        return LoanApplication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate the disbursement account belongs to user
        account = serializer.validated_data.get('disbursement_account')
        if account and account.user != request.user:
            return Response({'error': 'Invalid disbursement account.'}, status=status.HTTP_400_BAD_REQUEST)

        loan = serializer.save(user=request.user)
        
        # Audit Log
        AuditLog.objects.create(
            user=request.user,
            action='loan_application',
            ip_address=get_client_ip(request),
            description=f"Applied for {loan.get_loan_type_display()} loan of ₹{loan.requested_amount}. Ref: {loan.id}",
            is_success=True
        )

        return Response(
            LoanApplicationSerializer(loan).data,
            status=status.HTTP_201_CREATED
        )


class LoanDetailView(generics.RetrieveAPIView):
    """GET /api/loans/<id>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LoanApplicationSerializer

    def get_queryset(self):
        return LoanApplication.objects.filter(user=self.request.user)


class LoanEMIScheduleView(generics.ListAPIView):
    """GET /api/loans/<loan_id>/schedule/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EMIScheduleSerializer

    def get_queryset(self):
        loan_id = self.kwargs['loan_id']
        return EMISchedule.objects.filter(
            loan__id=loan_id,
            loan__user=self.request.user
        )


class LoanReviewView(APIView):
    """PATCH /api/loans/<id>/review/ — Admin approve/reject"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not getattr(request.user, 'is_loan_officer', False):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        loan = get_object_or_404(LoanApplication, pk=pk)
        if loan.status not in ['pending', 'under_review']:
            return Response({'error': f'Cannot review a loan with status: {loan.status}'}, status=status.HTTP_400_BAD_REQUEST)

        print(f"DEBUG: Request Data for Review: {request.data}")
        serializer = LoanReviewSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"DEBUG: Serializer Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        print(f"DEBUG: Validated Data: {data}")
        print(f"DEBUG: Reviewing loan {pk}")
        print(f"DEBUG: Action: {data['action']}")
        if data['action'] == 'approve':
            print(f"DEBUG: Approved Amount: {data['approved_amount']}")
            print(f"DEBUG: Interest Rate: {data['interest_rate']}")

        with db_transaction.atomic():
            loan.reviewed_by = request.user
            loan.reviewed_at = timezone.now()

            status_msg = f'Loan {data["action"]}d successfully.'

            if data['action'] == 'approve':
                loan.status = 'approved'
                loan.approved_amount = data['approved_amount']
                loan.interest_rate = data['interest_rate']
                loan.admin_notes = data.get('admin_notes', '')

                # Auto-disburse if account is set
                if loan.disbursement_account and loan.disbursement_account.status == 'active':
                    account = Account.objects.select_for_update().get(id=loan.disbursement_account_id)
                    account.balance += loan.approved_amount
                    account.save(update_fields=['balance', 'updated_at'])

                    txn = Transaction.objects.create(
                        receiver_account=account,
                        amount=loan.approved_amount,
                        transaction_type='loan_disbursement',
                        category='loan',
                        status='completed',
                        description=f'{loan.get_loan_type_display()} disbursement',
                        receiver_balance_after=account.balance,
                    )

                    # DOUBLE-ENTRY LEDGER: Record the disbursement liability
                    Ledger.objects.create(
                        transaction=txn,
                        account=account,
                        entry_type='credit',
                        amount=loan.approved_amount,
                        balance_after=account.balance,
                        description=f"Loan disbursement successfully credited"
                    )

                    loan.status = 'disbursed'
                    loan.disbursed_at = timezone.now()
                    generate_emi_schedule(loan)
                    status_msg = 'Loan approved and funds DISBURSED successfully.'
                else:
                    status_msg = 'Loan approved, but NO valid disbursement account was found.'

            elif data['action'] == 'reject':
                loan.status = 'rejected'
                loan.rejection_reason = data.get('rejection_reason', '')
                loan.admin_notes = data.get('admin_notes', '')

            loan.save()

            # Create Audit Log
            AuditLog.objects.create(
                user=request.user,
                action='loan_review',
                description=f"{data['action'].capitalize()}ed loan for {loan.user.full_name}. Ref: {loan.id}. Amount: {loan.approved_amount or 0}",
                is_success=True
            )

        return Response({
            'message': status_msg,
            'loan': LoanApplicationSerializer(loan).data
        })
