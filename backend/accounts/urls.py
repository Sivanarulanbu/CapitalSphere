from django.urls import path
from . import views

urlpatterns = [
    path('', views.AccountListCreateView.as_view(), name='account-list'),
    path('dashboard/', views.AccountDashboardView.as_view(), name='account-dashboard'),
    path('<uuid:pk>/', views.AccountDetailView.as_view(), name='account-detail'),
    path('beneficiaries/', views.BeneficiaryListCreateView.as_view(), name='beneficiary-list'),
    path('beneficiaries/<int:pk>/', views.BeneficiaryDetailView.as_view(), name='beneficiary-detail'),
]
