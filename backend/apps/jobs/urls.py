from rest_framework.routers import DefaultRouter

from .views import SkillViewSet, VacancyViewSet, WatchlistViewSet

router = DefaultRouter()
router.register("vacancies", VacancyViewSet)
router.register("skills", SkillViewSet)
router.register("watchlist", WatchlistViewSet, basename="watchlist")

urlpatterns = router.urls