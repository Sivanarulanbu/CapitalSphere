from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Account, Beneficiary
from .serializers import (
    AccountSerializer, AccountCreateSerializer,
    AccountSummarySerializer, BeneficiarySerializer
)


class AccountListCreateView(generics.ListCreateAPIView):
    """GET /api/accounts/ — list user's accounts
       POST /api/accounts/ — create new account"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return AccountCreateSerializer if self.request.method == 'POST' else AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
        accounts = Account.objects.filter(user=request.user, status='active')
        total_balance = sum(a.balance for a in accounts)
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
        return Response({'message': 'Beneficiary removed.'}, status=status.HTTP_200_OK)
