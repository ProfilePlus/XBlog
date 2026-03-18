#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/docker/lib.sh
source "$SCRIPT_DIR/lib.sh"

ROOT_DIR="$(repo_root)"
need_cmd docker

VERSION="${XBLOG_VERSION:-$(date +%Y%m%d-%H%M%S)}"
WEB_IMAGE="${XBLOG_WEB_IMAGE:-xblog-web}"
ADMIN_IMAGE="${XBLOG_ADMIN_IMAGE:-xblog-admin}"
API_IMAGE="${XBLOG_API_IMAGE:-xblog-api}"
CADDY_IMAGE="${XBLOG_CADDY_IMAGE:-xblog-caddy}"

echo "This script documents the build step for offline deployment."
echo "Repository root: $ROOT_DIR"
echo "Version tag: $VERSION"
echo
echo "Expected behavior:"
echo "  - build web/admin/api/caddy images locally"
echo "  - tag them as ${WEB_IMAGE}:$VERSION and so on"
echo "  - keep the exact Dockerfiles and compose files in deploy/docker/"
echo
echo "Current repository state:"
echo "  - this implementation intentionally stops at explanation and validation"
echo "  - add Dockerfiles before turning this into a real build pipeline"

