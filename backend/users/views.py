from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from .models import User, LoginSession, AuditLog
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, OTPVerifySerializer,
    UserProfileSerializer, ChangePasswordSerializer, SetTransactionPINSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, KYCDocumentSerializer, AuditLogSerializer
)
from .services import send_otp_email, verify_otp, get_client_ip



class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register"""
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send registration OTP
        send_otp_email(user, 'registration')

        return Response({
            'message': 'Registration successful. Please verify your email with the OTP sent.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(generics.GenericAPIView):
    """POST /api/auth/verify-otp"""
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        success, message = verify_otp(
            user,
            serializer.validated_data['otp_code'],
            serializer.validated_data['purpose']
        )

        if not success:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        if serializer.validated_data['purpose'] == 'registration':
            user.is_verified = True
            user.save()

            # Issue tokens after email verification
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Email verified successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data
            })

        return Response({'message': message})


class LoginView(generics.GenericAPIView):
    """POST /api/auth/login"""
    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Reset failed attempts on successful auth
        user.failed_login_attempts = 0
        user.last_login_ip = get_client_ip(request)
        user.save()

        if not user.is_verified:
            send_otp_email(user, 'registration')
            return Response({
                'message': 'Account not verified. OTP resent to your email.',
                'requires_verification': True,
                'email': user.email
            }, status=status.HTTP_200_OK)

        # Send login OTP for 2FA
        send_otp_email(user, 'login')

        # Create Audit Log for initial login attempt
        AuditLog.objects.create(
            user=user,
            action='login',
            ip_address=user.last_login_ip,
            description="Initial login credentials verified. OTP sent for 2FA.",
            is_success=True
        )

        return Response({
            'message': 'OTP sent to your registered email. Please verify.',
            'requires_otp': True,
            'email': user.email
        })


class LoginVerifyOTPView(generics.GenericAPIView):
    """POST /api/auth/login/verify"""
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        success, message = verify_otp(user, serializer.validated_data['otp_code'], 'login')
        if not success:
            # Audit log for failed 2FA
            AuditLog.objects.create(
                user=user,
                action='login',
                ip_address=get_client_ip(request),
                description=f"Failed 2FA verification: {message}",
                is_success=False
            )
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        # Create session
        LoginSession.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            device_info=request.META.get('HTTP_USER_AGENT', '')[:255]
        )

        # Audit log for successful 2FA
        AuditLog.objects.create(
            user=user,
            action='login',
            ip_address=get_client_ip(request),
            description="Successful login with 2FA verification.",
            is_success=True
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data
        })


class LogoutView(generics.GenericAPIView):
    """POST /api/auth/logout"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Mark session inactive
            LoginSession.objects.filter(
                user=request.user, is_active=True
            ).update(is_active=False, logout_time=timezone.now())

            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


class SetTransactionPINView(generics.GenericAPIView):
    """POST /api/auth/set-pin/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SetTransactionPINSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.transaction_pin = make_password(serializer.validated_data['pin'])
        user.save()
        return Response({'message': 'Transaction PIN set successfully.'})


class ForgotPasswordView(generics.GenericAPIView):
    """POST /api/auth/forgot-password/"""
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            send_otp_email(user, 'password_reset')
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({'message': 'If this email is registered, an OTP has been sent.'})


class ResetPasswordView(generics.GenericAPIView):
    """POST /api/auth/reset-password/"""
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        success, message = verify_otp(user, serializer.validated_data['otp_code'], 'password_reset')
        if not success:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password reset successfully. Please login.'})


class ResendOTPView(generics.GenericAPIView):
    """POST /api/auth/resend-otp/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose', 'registration')

        try:
            user = User.objects.get(email=email)
            send_otp_email(user, purpose)
            return Response({'message': 'OTP resent successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class KYCUploadView(generics.CreateAPIView):
    """POST /api/auth/profile/kyc/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KYCDocumentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)
        
        # Update user status to submitted
        user.kyc_status = 'pending'
        user.save()

        # Audit Log
        AuditLog.objects.create(
            user=user,
            action='kyc_upload',
            ip_address=get_client_ip(self.request),
            description=f"Uploaded KYC Document: {serializer.validated_data['document_type']}",
            is_success=True
        )

class UserAuditLogView(generics.ListAPIView):
    """GET /api/auth/profile/logs/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user)
