from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    EmailTokenObtainPairSerializer,
    EmailTokenSerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .security import sanitize_plain_text

User = get_user_model()


def _set_auth_cookies(response, access: str, refresh: str) -> None:
    response.set_cookie(
        settings.JWT_AUTH_COOKIE,
        access,
        httponly=settings.JWT_AUTH_HTTPONLY,
        secure=settings.JWT_AUTH_SECURE,
        samesite=settings.JWT_AUTH_SAMESITE,
    )
    response.set_cookie(
        settings.JWT_AUTH_REFRESH_COOKIE,
        refresh,
        httponly=settings.JWT_AUTH_HTTPONLY,
        secure=settings.JWT_AUTH_SECURE,
        samesite=settings.JWT_AUTH_SAMESITE,
    )


def _clear_auth_cookies(response) -> None:
    response.delete_cookie(settings.JWT_AUTH_COOKIE)
    response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
        send_mail(
            subject="Confirm your account",
            message=f"Please confirm your email by opening this link: {verify_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "").lower()
        user = User.objects.filter(email=email).first()
        if user and not user.is_active:
            return Response(
                {"detail": "Please confirm your email before signing in."},
                status=status.HTTP_403_FORBIDDEN,
            )
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access = response.data.get("access")
            refresh = response.data.get("refresh")
            if access and refresh:
                _set_auth_cookies(response, access=access, refresh=refresh)
                if not settings.JWT_RETURN_IN_BODY:
                    response.data = {"detail": "Login successful"}
        return response


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()
        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"detail": "Email confirmed successfully"})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject="Reset your password",
                message=f"Open this link to reset your password: {reset_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        return Response(
            {"detail": "If this email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()
        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password has been reset successfully"})


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")
        password_confirm = request.data.get("password_confirm", "")

        if not request.user.check_password(old_password):
            return Response({"detail": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != password_confirm:
            return Response({"detail": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, request.user)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated successfully"})


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "Missing Google credential"}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response({"detail": "Google OAuth is not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            payload = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError:
            return Response({"detail": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        email = (payload.get("email") or "").lower()
        if not email:
            return Response({"detail": "Google account has no email"}, status=status.HTTP_400_BAD_REQUEST)

        full_name = sanitize_plain_text(payload.get("name") or email.split("@")[0])
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "full_name": full_name,
                "is_active": True,
            },
        )
        if not created:
            update_fields = []
            if not user.full_name:
                user.full_name = full_name
                update_fields.append("full_name")
            if not user.is_active:
                user.is_active = True
                update_fields.append("is_active")
            if update_fields:
                user.save(update_fields=update_fields)

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)
        payload = {"email": user.email}
        if settings.JWT_RETURN_IN_BODY:
            payload.update({"access": access, "refresh": refresh_token})
        else:
            payload["detail"] = "Login successful"
        response = Response(payload)
        _set_auth_cookies(response, access=access, refresh=refresh_token)
        return response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CookieTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE) or request.data.get("refresh")
        if not refresh:
            raise ValidationError({"detail": "Refresh token is required"})

        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        access = serializer.validated_data["access"]
        response = Response({"detail": "Token refreshed"})
        refresh_out = serializer.validated_data.get("refresh", refresh)
        _set_auth_cookies(response, access=access, refresh=refresh_out)
        if settings.JWT_RETURN_IN_BODY:
            response.data["access"] = access
            response.data["refresh"] = refresh_out
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class CsrfTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})