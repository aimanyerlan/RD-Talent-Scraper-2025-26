from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from rest_framework.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["full_name", "email", "password", "password_confirm"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        user = User(
            email=validated_data["email"].lower(),
            full_name=validated_data["full_name"],
            username=validated_data["email"].lower(),
            is_active=False,
        )

        user.set_password(password)
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "avatar_url", "role"]
        read_only_fields = ["role"]


class EmailTokenSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

    def get_user(self):
        uid = self.validated_data["uid"]
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            return User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
            raise ValidationError({"uid": "Invalid user identifier"}) from exc


class PasswordResetConfirmSerializer(EmailTokenSerializer):
    new_password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        validate_password(attrs["new_password"])
        return attrs


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        return token