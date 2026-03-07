from rest_framework.routers import DefaultRouter

from .views import SkillViewSet, VacancyViewSet, WatchlistViewSet

router = DefaultRouter()
router.register(r"vacancies", VacancyViewSet, basename="vacancy")
router.register(r"skills", SkillViewSet, basename="skill")
router.register(r"watchlist", WatchlistViewSet, basename="watchlist")

urlpatterns = router.urls