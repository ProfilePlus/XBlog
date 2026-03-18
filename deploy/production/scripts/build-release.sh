#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/srv/xblog/current}"
CONFIG_DIR="${CONFIG_DIR:-/etc/xblog}"
PNPM_BIN="${PNPM_BIN:-pnpm}"

copy_env() {
	local source_file="$1"
	local target_file="$2"

	if [[ ! -f "$source_file" ]]; then
		echo "Missing env file: $source_file" >&2
		exit 1
	fi

	install -Dm600 "$source_file" "$target_file"
}

copy_env "$CONFIG_DIR/web.env" "$ROOT_DIR/apps/web/.env.production"
copy_env "$CONFIG_DIR/admin.env" "$ROOT_DIR/apps/admin/.env.production"

cd "$ROOT_DIR"
"$PNPM_BIN" install --frozen-lockfile
"$PNPM_BIN" build

echo "XBlog production build completed in $ROOT_DIR"
