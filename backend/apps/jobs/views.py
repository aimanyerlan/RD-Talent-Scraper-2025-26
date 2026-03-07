from django.db import IntegrityError
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsAdminOrReadOnly
from .filters import VacancyFilter
from .models import Skill, Vacancy, Watchlist
from .serializers import (
    SkillSerializer,
    VacancyDetailSerializer,
    VacancyListSerializer,
    WatchlistSerializer,
)


class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.all().prefetch_related("skills")
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VacancyFilter
    search_fields = ["title", "company", "description"]
    ordering_fields = ["published_at", "created_at", "company", "location"]
    ordering = ["-published_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return VacancyListSerializer
        return VacancyDetailSerializer

    def get_queryset(self):
        queryset = Vacancy.objects.all().prefetch_related("skills")

        # skills join кезінде duplicate шықпау үшін
        if self.request.query_params.get("skill"):
            queryset = queryset.distinct()

        return queryset

    @action(detail=False, methods=["get"], url_path="top-skills")
    def top_skills(self, request):
        limit = int(request.query_params.get("limit", 10))

        skills = (
            Skill.objects
            .filter(vacancies__source="hh")
            .annotate(vacancy_count=Count("vacancies", distinct=True))
            .order_by("-vacancy_count", "name")[:limit]
        )

        data = [
            {
                "skill": skill.name,
                "category": skill.category,
                "vacancy_count": skill.vacancy_count,
            }
            for skill in skills
        ]
        return Response(data)

    @action(detail=False, methods=["get"], url_path="top-companies")
    def top_companies(self, request):
        limit = int(request.query_params.get("limit", 10))

        companies = (
            Vacancy.objects
            .filter(source="hh")
            .values("company")
            .annotate(vacancy_count=Count("id"))
            .order_by("-vacancy_count", "company")[:limit]
        )

        data = [
            {
                "company": item["company"] or "Unknown",
                "vacancy_count": item["vacancy_count"],
            }
            for item in companies
        ]
        return Response(data)

    @action(detail=False, methods=["get"], url_path="top-locations")
    def top_locations(self, request):
        limit = int(request.query_params.get("limit", 10))

        locations = (
            Vacancy.objects
            .filter(source="hh")
            .values("location")
            .annotate(vacancy_count=Count("id"))
            .order_by("-vacancy_count", "location")[:limit]
        )

        data = [
            {
                "location": item["location"] or "Unknown",
                "vacancy_count": item["vacancy_count"],
            }
            for item in locations
        ]
        return Response(data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total_vacancies = Vacancy.objects.filter(source="hh").count()
        total_skills = Skill.objects.filter(vacancies__source="hh").distinct().count()
        total_companies = (
            Vacancy.objects
            .filter(source="hh")
            .exclude(company="")
            .values("company")
            .distinct()
            .count()
        )
        total_locations = (
            Vacancy.objects
            .filter(source="hh")
            .exclude(location="")
            .values("location")
            .distinct()
            .count()
        )

        data = {
            "total_vacancies": total_vacancies,
            "total_skills": total_skills,
            "total_companies": total_companies,
            "total_locations": total_locations,
        }
        return Response(data)


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all().order_by("name")
    serializer_class = SkillSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category"]


class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Watchlist.objects
            .filter(user=self.request.user)
            .select_related("vacancy")
            .prefetch_related("vacancy__skills")
        )

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise serializers.ValidationError(
                {"detail": "This vacancy is already in your watchlist."}
            )
        
    @action(detail=False, methods=["get"], url_path="check")
    def check(self, request):
        vacancy_id = request.query_params.get("vacancy_id")

        if not vacancy_id:
            return Response(
                {"detail": "vacancy_id query parameter is required."},
                status=400,
            )

        exists = Watchlist.objects.filter(
            user=request.user,
            vacancy_id=vacancy_id,
        ).exists()

        return Response({"is_in_watchlist": exists})