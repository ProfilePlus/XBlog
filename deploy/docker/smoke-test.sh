#!/usr/bin/env bash
set -euo pipefail

TARGET_PUBLIC_URL="${PUBLIC_URL:-https://xblog.example.com}"
TARGET_ADMIN_URL="${ADMIN_URL:-https://admin.xblog.example.com}"
TARGET_INGEST_URL="${INGEST_URL:-https://ingest.xblog.example.com}"

cat <<EOF
This script should verify the new deployment before traffic switch.

Recommended checks:
  - GET $TARGET_PUBLIC_URL
  - open $TARGET_ADMIN_URL/login
  - GET $TARGET_INGEST_URL/api/health
  - upload a small asset if credentials are available
  - confirm object storage access still works

This file currently documents the smoke-test contract so the release flow stays explicit.
EOF

