#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/docker/lib.sh
source "$SCRIPT_DIR/lib.sh"

need_cmd docker

ARCHIVE_DIR="${XBLOG_IMAGE_ARCHIVE_DIR:-$SCRIPT_DIR/artifacts}"
VERSION="${XBLOG_VERSION:-}"

if [[ -z "$VERSION" ]]; then
  echo "XBLOG_VERSION is required for export-images.sh" >&2
  print_usage_block
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

cat <<EOF
This script is the offline export step.

Expected behavior:
  - collect locally built images tagged with $VERSION
  - export them as tar archives under:
    $ARCHIVE_DIR
  - optionally create checksums for transfer validation

Nothing is exported yet because the build pipeline is intentionally documented first.
EOF

