from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("user", "User"),
        ("admin", "Admin"),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    avatar_url = models.CharField(max_length=255, blank=True, default="")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self) -> str:
        return self.email