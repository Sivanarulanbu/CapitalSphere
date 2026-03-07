from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transaction, Ledger
from .serializers import TransactionSerializer, TransferInitiateSerializer, DepositInitiateSerializer, LedgerSerializer
from .services import TransferService, SelfDepositService
from accounts.models import Account
from django.db.models import Sum
from users.services import get_client_ip
from users.models import AuditLog


class TransactionListView(generics.ListAPIView):
    """GET /api/transactions/ — paginated transaction history for user"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'transaction_type']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        user_accounts = Account.objects.filter(user=user).values_list('id', flat=True)

        queryset = Transaction.objects.filter(
            Q(sender_account_id__in=user_accounts) |
            Q(receiver_account_id__in=user_accounts)
        ).select_related('sender_account', 'receiver_account',
                          'sender_account__user', 'receiver_account__user')

        # Optional filters
        account_id = self.request.query_params.get('account_id')
        if account_id:
            queryset = queryset.filter(
                Q(sender_account_id=account_id) | Q(receiver_account_id=account_id)
            )

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset


class TransactionDetailView(generics.RetrieveAPIView):
    """GET /api/transactions/<id>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        user_accounts = Account.objects.filter(user=user).values_list('id', flat=True)
        return Transaction.objects.filter(
            Q(sender_account_id__in=user_accounts) |
            Q(receiver_account_id__in=user_accounts)
        )


class RecentTransactionsView(generics.ListAPIView):
    """GET /api/transactions/recent/ — last 5 for dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        user_accounts = Account.objects.filter(user=user).values_list('id', flat=True)
        return Transaction.objects.filter(
            Q(sender_account_id__in=user_accounts) |
            Q(receiver_account_id__in=user_accounts),
            status='completed'
        ).select_related('sender_account', 'receiver_account',
                          'sender_account__user', 'receiver_account__user')[:5]


class TransferView(APIView):
    """POST /api/transactions/transfer/ — initiate a fund transfer"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TransferInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        success, message, txn = TransferService.execute_transfer(
            sender_account_id=data['sender_account_id'],
            receiver_account_number=data['receiver_account_number'],
            amount=data['amount'],
            pin=data['pin'],
            user=request.user,
            description=data.get('description', '')
        )

        if success:
            return Response({
                'message': message,
                'transaction': TransactionSerializer(txn).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class AccountStatementView(APIView):
    """GET /api/transactions/statement/<account_id>/ — account statement"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, account_id):
        try:
            account = Account.objects.get(id=account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        transactions = Transaction.objects.filter(
            Q(sender_account=account) | Q(receiver_account=account),
            status='completed'
        ).select_related('sender_account__user', 'receiver_account__user').order_by('-created_at')

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            transactions = transactions.filter(created_at__date__gte=date_from)
        if date_to:
            transactions = transactions.filter(created_at__date__lte=date_to)

        return Response({
            'account_number': account.account_number,
            'account_type': account.account_type,
            'current_balance': str(account.balance),
            'total_transactions': transactions.count(),
            'transactions': TransactionSerializer(transactions[:50], many=True).data
        })

class SelfDepositView(APIView):
    """POST /api/transactions/deposit/ — add money to own account"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        success, message, txn = SelfDepositService.execute_deposit(
            account_id=data['account_id'],
            amount=data['amount'],
            user=request.user,
            description=data.get('description', 'Online Deposit')
        )

        if success:
            return Response({
                'message': message,
                'transaction': TransactionSerializer(txn).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class TransactionAnalyticsView(APIView):
    """GET /api/transactions/analytics/ — Spending analysis by category"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_accounts = Account.objects.filter(user=request.user)
        
        # Debits grouped by category
        spending = Transaction.objects.filter(
            sender_account__in=user_accounts,
            status='completed'
        ).values('category').annotate(total=Sum('amount'))

        # Credits grouped by category
        income = Transaction.objects.filter(
            receiver_account__in=user_accounts,
            status='completed'
        ).values('category').annotate(total=Sum('amount'))

        return Response({
            'spending': spending,
            'income': income
        })

class FlaggedTransactionListView(generics.ListAPIView):
    """GET /api/transactions/flagged/ — Admin only: high risk transactions"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        if not self.request.user.is_admin:
            return Transaction.objects.none()
        return Transaction.objects.filter(is_flagged=True).order_by('-created_at')


class LedgerListView(generics.ListAPIView):
    """GET /api/transactions/ledger/ — Admin only: all ledger entries"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LedgerSerializer

    def get_queryset(self):
        if not self.request.user.is_admin:
            return Ledger.objects.none()
        return Ledger.objects.all().select_related('transaction', 'account', 'account__user').order_by('-created_at')
