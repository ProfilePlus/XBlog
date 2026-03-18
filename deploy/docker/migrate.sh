#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/docker/lib.sh
source "$SCRIPT_DIR/lib.sh"

compose="$(compose_cmd)"
PROJECT_NAME="${XBLOG_PROJECT_GREEN:-xblog-green}"
COMPOSE_FILE="${XBLOG_COMPOSE_FILE:-$SCRIPT_DIR/compose.yml}"

require_file "$COMPOSE_FILE" "Missing compose file: $COMPOSE_FILE"

cat <<EOF
This script should run Prisma migration against the target version.

Recommended behavior:
  - execute migration only after the target stack has started
  - fail the release if migration fails
  - keep the old stack untouched until the migration succeeds

Planned compose context:
  $compose -p $PROJECT_NAME --env-file $SCRIPT_DIR/env.example -f $COMPOSE_FILE run --rm api pnpm exec prisma migrate deploy
EOF
