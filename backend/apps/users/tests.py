import uuid

from django.core import mail
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class RegisterAPIIntegrationTests(APITestCase):
    def test_register_returns_201_and_sends_email(self):
        email = f"ci_reg_{uuid.uuid4().hex[:12]}@example.test"
        response = self.client.post(
            "/api/auth/register/",
            {
                "full_name": "CI User",
                "email": email,
                "password": "VerySecurePass123!",
                "password_confirm": "VerySecurePass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        user = User.objects.get(email=email)
        self.assertFalse(user.is_active)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class LoginAPIIntegrationTests(APITestCase):
    def test_login_inactive_user_forbidden(self):
        user = User(
            email="inactive_ci@example.test",
            username="inactive_ci@example.test",
            full_name="Inactive",
            is_active=False,
        )
        user.set_password("VerySecurePass123!")
        user.save()
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "inactive_ci@example.test",
                "password": "VerySecurePass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_login_active_user_returns_tokens(self):
        user = User(
            email="active_ci@example.test",
            username="active_ci@example.test",
            full_name="Active",
            is_active=True,
        )
        user.set_password("VerySecurePass123!")
        user.save()
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "active_ci@example.test",
                "password": "VerySecurePass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("access", body)
        self.assertIn("refresh", body)
