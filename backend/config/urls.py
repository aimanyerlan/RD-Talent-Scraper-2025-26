"""
URL configuration for config project.
"""

from django.contrib import admin
from django.urls import include, path

from config.health import liveness, readiness

urlpatterns = [
    path("health/", liveness, name="health-liveness"),
    path("health/ready/", readiness, name="health-readiness"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.jobs.urls")),
    path("", include("django_prometheus.urls")),
]
