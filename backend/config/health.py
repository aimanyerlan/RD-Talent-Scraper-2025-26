"""Kubernetes-style liveness and readiness probes."""

import logging

from django.db import connection
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def liveness(request):
    """Process is up; does not check dependencies."""
    return JsonResponse({"status": "ok", "check": "liveness"})


def readiness(request):
    """Verifies PostgreSQL connectivity."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as exc:  # noqa: BLE001 — surface any DB error to orchestrator
        logger.exception("Readiness check failed")
        return JsonResponse(
            {"status": "unavailable", "check": "readiness", "database": str(exc)},
            status=503,
        )
    return JsonResponse({"status": "ok", "check": "readiness"})
