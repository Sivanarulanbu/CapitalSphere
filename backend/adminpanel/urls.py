from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:pk>/toggle-status/', views.AdminToggleUserStatus.as_view(), name='admin-toggle-user'),
    path('users/<uuid:pk>/kyc/', views.AdminVerifyKYCView.as_view(), name='admin-kyc'),
    path('accounts/<uuid:pk>/freeze/', views.AdminFreezeAccountView.as_view(), name='admin-freeze'),
    path('transactions/', views.AdminAllTransactionsView.as_view(), name='admin-transactions'),
    path('loans/', views.AdminLoanListView.as_view(), name='admin-loans'),
    path('accounts/<uuid:pk>/deposit/', views.AdminDepositView.as_view(), name='admin-deposit'),
]
