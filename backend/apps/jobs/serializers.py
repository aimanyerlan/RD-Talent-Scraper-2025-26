from rest_framework import serializers

from .models import Skill, Vacancy, Watchlist


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = "__all__"


class VacancyListSerializer(serializers.ModelSerializer):
    skills = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name",
    )

    class Meta:
        model = Vacancy
        fields = [
            "id",
            "title",
            "company",
            "location",
            "source",
            "salary_from",
            "salary_to",
            "currency",
            "published_at",
            "url",
            "skills",
        ]


class VacancyDetailSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = Vacancy
        fields = "__all__"


class WatchlistSerializer(serializers.ModelSerializer):
    vacancy = VacancyListSerializer(read_only=True)
    vacancy_id = serializers.PrimaryKeyRelatedField(
        queryset=Vacancy.objects.all(),
        source="vacancy",
        write_only=True,
    )

    class Meta:
        model = Watchlist
        fields = ["id", "user", "vacancy", "vacancy_id", "created_at"]
        read_only_fields = ["id", "user", "vacancy", "created_at"]