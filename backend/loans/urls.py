from django.urls import path
from . import views

urlpatterns = [
    path('', views.LoanListCreateView.as_view(), name='loan-list'),
    path('<uuid:pk>/', views.LoanDetailView.as_view(), name='loan-detail'),
    path('<uuid:loan_id>/schedule/', views.LoanEMIScheduleView.as_view(), name='loan-schedule'),
    path('<uuid:pk>/review/', views.LoanReviewView.as_view(), name='loan-review'),
]
