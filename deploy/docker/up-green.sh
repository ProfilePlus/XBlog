#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/docker/lib.sh
source "$SCRIPT_DIR/lib.sh"

compose="$(compose_cmd)"
PROJECT_NAME="${XBLOG_PROJECT_GREEN:-xblog-green}"
COMPOSE_FILE="${XBLOG_COMPOSE_FILE:-$SCRIPT_DIR/compose.yml}"

require_file "$COMPOSE_FILE" "Missing compose file: $COMPOSE_FILE"

echo "Starting green stack with project name: $PROJECT_NAME"
echo "Compose file: $COMPOSE_FILE"
echo
echo "Planned command:"
echo "  $compose -p $PROJECT_NAME --env-file $SCRIPT_DIR/env.example -f $COMPOSE_FILE up -d"
