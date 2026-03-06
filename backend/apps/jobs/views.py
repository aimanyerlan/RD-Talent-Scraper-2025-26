from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from apps.users.permissions import IsAdminOrReadOnly
from .models import Skill, Vacancy, Watchlist
from .serializers import SkillSerializer, VacancySerializer, WatchlistSerializer
from .filters import VacancyFilter

class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.all().prefetch_related("skills")
    serializer_class = VacancySerializer
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VacancyFilter
    search_fields = ["title", "company", "description"]
    ordering_fields = ["published_at", "created_at"]
    ordering = ["-published_at"]

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAdminOrReadOnly]


class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

