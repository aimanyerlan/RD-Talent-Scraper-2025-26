from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        raw_token = None
        from_cookie = False

        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "auth-cookie")
            cookie_token = request.COOKIES.get(cookie_name)
            if cookie_token:
                raw_token = cookie_token
                from_cookie = True

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        if from_cookie:
            self._enforce_csrf(request)

        return (user, validated_token)

    def _enforce_csrf(self, request):
        check = CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")
