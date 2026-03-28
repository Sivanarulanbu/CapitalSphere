from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Account, Beneficiary, VirtualCard
from .serializers import (
    AccountSerializer, AccountCreateSerializer,
    AccountSummarySerializer, BeneficiarySerializer,
    VirtualCardSerializer
)
from users.models import AuditLog
from users.services import get_client_ip


class AccountListCreateView(generics.ListCreateAPIView):
    """GET /api/accounts/ — list user's accounts
       POST /api/accounts/ — create new account"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return AccountCreateSerializer if self.request.method == 'POST' else AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user)
        # Audit Log
        AuditLog.objects.create(
            user=self.request.user,
            action='account_creation',
            ip_address=get_client_ip(self.request),
            description=f"Created new {account.get_account_type_display()} account: {account.account_number}",
            is_success=True
        )


class AccountDetailView(generics.RetrieveAPIView):
    """GET /api/accounts/<id>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


class AccountDashboardView(APIView):
    """GET /api/accounts/dashboard/ — summary for dashboard"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        accounts = Account.objects.filter(user=request.user, status='active')
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or 0
        return Response({
            'total_balance': str(total_balance),
            'account_count': accounts.count(),
            'accounts': AccountSummarySerializer(accounts, many=True).data,
        })


class BeneficiaryListCreateView(generics.ListCreateAPIView):
    """GET /api/accounts/beneficiaries/
       POST /api/accounts/beneficiaries/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BeneficiarySerializer

    def perform_create(self, serializer):
        beneficiary = serializer.save(user=self.request.user)
        # Audit Log
        AuditLog.objects.create(
            user=self.request.user,
            action='beneficiary_addition',
            ip_address=get_client_ip(self.request),
            description=f"Added beneficiary: {beneficiary.name} ({beneficiary.account_number})",
            is_success=True
        )

    def get_queryset(self):
        return Beneficiary.objects.filter(user=self.request.user, is_active=True)


class BeneficiaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/accounts/beneficiaries/<id>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BeneficiarySerializer

    def get_queryset(self):
        return Beneficiary.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        
        # Audit Log
        AuditLog.objects.create(
            user=request.user,
            action='beneficiary_removal',
            ip_address=get_client_ip(request),
            description=f"Removed beneficiary: {instance.name} ({instance.account_number})",
            is_success=True
        )
        
        return Response({'message': 'Beneficiary removed.'}, status=status.HTTP_200_OK)


class VirtualCardListCreateView(generics.ListCreateAPIView):
    """GET /api/accounts/cards/
       POST /api/accounts/cards/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VirtualCardSerializer

    def get_queryset(self):
        return VirtualCard.objects.filter(account__user=self.request.user)

    def perform_create(self, serializer):
        card = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='virtual_card_creation',
            ip_address=get_client_ip(self.request),
            description=f"Created virtual card for account: {card.account.account_number}",
            is_success=True
        )


class VirtualCardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/accounts/cards/<id>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VirtualCardSerializer

    def get_queryset(self):
        return VirtualCard.objects.filter(account__user=self.request.user)
