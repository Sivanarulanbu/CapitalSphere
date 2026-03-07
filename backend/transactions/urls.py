from django.urls import path
from . import views

urlpatterns = [
    path('', views.TransactionListView.as_view(), name='transaction-list'),
    path('recent/', views.RecentTransactionsView.as_view(), name='recent-transactions'),
    path('transfer/', views.TransferView.as_view(), name='transfer'),
    path('deposit/', views.SelfDepositView.as_view(), name='deposit'),
    path('statement/<uuid:account_id>/', views.AccountStatementView.as_view(), name='account-statement'),
    path('analytics/', views.TransactionAnalyticsView.as_view(), name='analytics'),
    path('flagged/', views.FlaggedTransactionListView.as_view(), name='flagged-transactions'),
    path('ledger/', views.LedgerListView.as_view(), name='ledger-list'),
    path('<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
]
