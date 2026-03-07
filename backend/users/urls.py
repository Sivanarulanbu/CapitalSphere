from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('login/verify/', views.LoginVerifyOTPView.as_view(), name='login-verify-otp'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/kyc/', views.KYCUploadView.as_view(), name='kyc-upload'),
    path('profile/logs/', views.UserAuditLogView.as_view(), name='user-audit-logs'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('set-pin/', views.SetTransactionPINView.as_view(), name='set-pin'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
]
