from rest_framework import serializers

from .facet_normalize import experience_ui_label
from .models import Skill, Vacancy, Watchlist

class BaseVacancySerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        salary_from = attrs.get("salary_from")
        salary_to = attrs.get("salary_to")

        if salary_from is not None and salary_to is not None:
            if salary_from > salary_to:
                raise serializers.ValidationError(
                    {"salary_to": "salary_to must be greater than salary_from"}
                )
        return attrs

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = "__all__"

class VacancyListSerializer(BaseVacancySerializer):
    skills = SkillSerializer(many=True, read_only=True)
    experience_label = serializers.SerializerMethodField()

    def get_experience_label(self, obj):
        return experience_ui_label(obj.experience)

    class Meta:
        model = Vacancy
        fields = [
            "id",
            "title",
            "company",
            "location",
            "description",
            "url",
            "salary_from",
            "salary_to",
            "currency",
            "published_at",
            "source",
            "experience",
            "experience_label",
            "work_type",
            "job_type",
            "skills",
        ]

class VacancyDetailSerializer(BaseVacancySerializer):
    skills = SkillSerializer(many=True, read_only=True)
    experience_label = serializers.SerializerMethodField()

    def get_experience_label(self, obj):
        return experience_ui_label(obj.experience)

    class Meta:
        model = Vacancy
        fields = [
            "id",
            "title",
            "company",
            "location",
            "description",
            "url",
            "salary_from",
            "salary_to",
            "currency",
            "published_at",
            "created_at",
            "source",
            "external_id",
            "experience",
            "experience_label",
            "work_type",
            "job_type",
            "skills",
        ]

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