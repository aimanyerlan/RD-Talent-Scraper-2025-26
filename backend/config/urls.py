"""
URL configuration for config project.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from config.health import liveness, readiness

urlpatterns = [
    path(
        "",
        RedirectView.as_view(url=settings.FRONTEND_URL, permanent=False),
        name="root-redirect",
    ),
    path("health/", liveness, name="health-liveness"),
    path("health/ready/", readiness, name="health-readiness"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/docs/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.jobs.urls")),
    path("", include("django_prometheus.urls")),
]
