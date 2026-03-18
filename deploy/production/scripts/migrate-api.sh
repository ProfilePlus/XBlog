#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/srv/xblog/current}"
CONFIG_DIR="${CONFIG_DIR:-/etc/xblog}"
API_ENV_FILE="${API_ENV_FILE:-$CONFIG_DIR/api.env}"
PNPM_BIN="${PNPM_BIN:-pnpm}"

if [[ ! -f "$API_ENV_FILE" ]]; then
	echo "Missing API env file: $API_ENV_FILE" >&2
	exit 1
fi

set -a
source "$API_ENV_FILE"
set +a

cd "$ROOT_DIR"
"$PNPM_BIN" --filter @xblog/api exec prisma migrate deploy

echo "XBlog API migrations applied with $API_ENV_FILE"
