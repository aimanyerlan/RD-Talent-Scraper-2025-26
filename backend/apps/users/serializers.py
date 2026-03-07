from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "password_confirm"]

    def create(self, validated_data):
        password_confirm = validated_data.pop("password_confirm")
        password = validated_data["password"]

        if password != password_confirm:
            raise serializers.ValidationError("Passwords do not match")

        user = User(
            email=validated_data["email"],
            username=validated_data["email"],  
        )

        user.set_password(password)
        user.save()

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "role"]