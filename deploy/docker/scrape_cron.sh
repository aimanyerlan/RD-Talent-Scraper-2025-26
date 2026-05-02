#!/bin/sh
set -e
cd /app
PAGES="${SCRAPE_HH_PAGES:-5}"
exec python backend/manage.py scrape_all --source hh --pages "$PAGES"
