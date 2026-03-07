from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from django.db.models import Sum, Count, Q
from django.db import transaction as db_transaction
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from users.models import User
from accounts.models import Account
from transactions.models import Transaction
from loans.models import LoanApplication
from users.serializers import AdminUserSerializer
from transactions.serializers import TransactionSerializer
from loans.serializers import LoanApplicationSerializer
from users.models import AuditLog
import logging


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsLoanOfficerView(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_loan_officer', False)


class AdminDashboardView(APIView):
    """GET /api/admin/dashboard/ — platform-wide statistics"""
    permission_classes = [IsLoanOfficerView]

    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # User stats
        total_users = User.objects.filter(role='user').count()
        new_users_week = User.objects.filter(role='user', created_at__date__gte=week_ago).count()

        # Account stats
        total_accounts = Account.objects.count()
        active_accounts = Account.objects.filter(status='active').count()
        frozen_accounts = Account.objects.filter(status='frozen').count()
        total_deposits = Account.objects.filter(status='active').aggregate(
            total=Sum('balance')
        )['total'] or 0

        # Transaction stats
        today_transactions = Transaction.objects.filter(
            created_at__date=today, status='completed'
        )
        today_volume = today_transactions.aggregate(total=Sum('amount'))['total'] or 0
        monthly_transactions = Transaction.objects.filter(
            created_at__date__gte=month_ago, status='completed'
        ).count()

        # Loan stats
        pending_loans = LoanApplication.objects.filter(status='pending').count()
        total_disbursed = LoanApplication.objects.filter(status='disbursed').aggregate(
            total=Sum('approved_amount')
        )['total'] or 0

        return Response({
            'users': {
                'total': total_users,
                'new_this_week': new_users_week,
            },
            'accounts': {
                'total': total_accounts,
                'active': active_accounts,
                'frozen': frozen_accounts,
                'total_deposits': str(total_deposits),
            },
            'transactions': {
                'today_count': today_transactions.count(),
                'today_volume': str(today_volume),
                'monthly_count': monthly_transactions,
            },
            'loans': {
                'pending_review': pending_loans,
                'total_disbursed': str(total_disbursed),
            }
        })


class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — all users"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.filter(role='user').prefetch_related('bank_accounts')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(full_name__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs


class AdminUserDetailView(generics.RetrieveAPIView):
    """GET /api/admin/users/<id>/"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()


class AdminFreezeAccountView(APIView):
    """POST /api/admin/accounts/<id>/freeze/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            account = Account.objects.get(id=pk)
            action = request.data.get('action', 'freeze')
            if action == 'freeze':
                account.status = 'frozen'
                msg = 'Account frozen.'
            elif action == 'unfreeze':
                account.status = 'active'
                msg = 'Account unfrozen.'
            else:
                return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
            account.save()
            return Response({'message': msg, 'account_number': account.account_number})
        except Account.DoesNotExist:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminToggleUserStatus(APIView):
    """POST /api/admin/users/<id>/toggle-status/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(id=pk, role='user')
            user.is_active = not user.is_active
            user.save()
            status_str = 'activated' if user.is_active else 'deactivated'
            return Response({'message': f'User {status_str}.', 'is_active': user.is_active})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminAllTransactionsView(generics.ListAPIView):
    """GET /api/admin/transactions/ — all platform transactions"""
    permission_classes = [IsAdminUser]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.select_related(
            'sender_account__user', 'receiver_account__user'
        ).order_by('-created_at')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs


class AdminLoanListView(generics.ListAPIView):
    """GET /api/admin/loans/ — all loan applications"""
    permission_classes = [IsLoanOfficerView]
    serializer_class = LoanApplicationSerializer

    def get_queryset(self):
        qs = LoanApplication.objects.select_related('user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminVerifyKYCView(APIView):
    """PATCH /api/admin/users/<id>/kyc/"""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk)
            kyc_status = request.data.get('kyc_status')
            if kyc_status not in ['verified', 'rejected', 'pending', 'submitted']:
                return Response({'error': 'Invalid KYC status.'}, status=status.HTTP_400_BAD_REQUEST)
            user.kyc_status = kyc_status
            if kyc_status == 'verified':
                user.is_verified = True
            user.save()

            # Audit Log
            AuditLog.objects.create(
                user=request.user,
                action='kyc_upload',
                description=f"Verified KYC for {user.full_name}. New status: {kyc_status}",
                is_success=True
            )
            return Response({'message': f'KYC status updated to {kyc_status}.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminDepositView(APIView):
    """POST /api/admin/accounts/<id>/deposit/ — manually credit an account"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            account = Account.objects.get(id=pk)
            amount = request.data.get('amount')
            description = request.data.get('description', 'Manual Deposit')

            if not amount or float(amount) <= 0:
                return Response({'error': 'Valid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

            amount = Decimal(str(amount))

            with db_transaction.atomic():
                # Lock row
                account = Account.objects.select_for_update().get(id=pk)
                account.balance += amount
                account.save()

                # Create transaction
                txn = Transaction.objects.create(
                    receiver_account=account,
                    amount=amount,
                    transaction_type='credit',
                    category='other',
                    status='completed',
                    description=description,
                    receiver_balance_after=account.balance
                )

                # Audit Log
                AuditLog.objects.create(
                    user=request.user,
                    action='admin_deposit',
                    description=f"Admin deposit of ₹{amount} to {account.account_number} ({account.user.full_name})",
                    is_success=True
                )

            return Response({
                'message': f'Successfully deposited ₹{amount} to {account.account_number}',
                'new_balance': str(account.balance)
            })
        except Account.DoesNotExist:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
