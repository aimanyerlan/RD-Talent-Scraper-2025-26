#!/bin/sh
set -e

cd /app

if [ -n "${PROMETHEUS_MULTIPROC_DIR:-}" ]; then
  mkdir -p "${PROMETHEUS_MULTIPROC_DIR}"
  rm -rf "${PROMETHEUS_MULTIPROC_DIR:?}"/*
fi

if [ "${SKIP_DJANGO_MIGRATE:-0}" != "1" ]; then
  python backend/manage.py migrate --noinput
fi

exec "$@"
