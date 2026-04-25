# syntax=docker/dockerfile:1
# --- dependency wheels (needs git for VCS deps) --------------------------------
FROM python:3.12-slim AS wheels

WORKDIR /wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels/out -r requirements.txt \
    && DJANGO_PROM_WHL="$(basename "$(ls /wheels/out/django_prometheus-*.whl | head -n1)")" \
    && sed "s#django-prometheus @ git+.*#django-prometheus @ file:///wheels/out/${DJANGO_PROM_WHL}#" \
        requirements.txt > /wheels/out/requirements-install.txt

# --- runtime -----------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings \
    PYTHONPATH=/app/backend \
    DJANGO_LOG_DIR=/app/logs \
    PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus_multiproc

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 --shell /bin/bash appuser

COPY --from=wheels /wheels/out /wheels/out
RUN pip install --no-cache-dir --no-index --find-links=/wheels/out -r /wheels/out/requirements-install.txt \
    && rm -rf /wheels/out

COPY backend ./backend
COPY deploy ./deploy

RUN chmod +x /app/deploy/docker/entrypoint.sh \
    && mkdir -p /app/logs "${PROMETHEUS_MULTIPROC_DIR}" \
    && chown -R appuser:appuser /app /tmp/prometheus_multiproc

ARG BUILD_SECRET_KEY=build-only-collectstatic-not-for-production
ENV SECRET_KEY=${BUILD_SECRET_KEY} \
    DEBUG=False \
    DJANGO_ENV=production \
    ALLOWED_HOSTS=localhost,127.0.0.1 \
    POSTGRES_HOST=127.0.0.1 \
    POSTGRES_DB=build \
    POSTGRES_USER=build \
    POSTGRES_PASSWORD=build

USER appuser
RUN python backend/manage.py collectstatic --noinput --no-color

EXPOSE 8000

ENTRYPOINT ["/app/deploy/docker/entrypoint.sh"]
CMD [ \
    "gunicorn", \
    "config.wsgi:application", \
    "--chdir", "backend", \
    "--bind", "0.0.0.0:8000", \
    "--workers", "3", \
    "--threads", "2", \
    "--timeout", "120", \
    "--access-logfile", "-", \
    "--error-logfile", "-" \
]
