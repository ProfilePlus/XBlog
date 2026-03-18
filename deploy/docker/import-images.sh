#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/docker/lib.sh
source "$SCRIPT_DIR/lib.sh"

need_cmd docker

ARCHIVE_PATH="${1:-${XBLOG_IMAGE_ARCHIVE:-}}"

if [[ -z "$ARCHIVE_PATH" ]]; then
  echo "Usage: $0 <image-archive.tar>" >&2
  exit 1
fi

require_file "$ARCHIVE_PATH"

cat <<EOF
This script is the offline import step.

Expected behavior:
  - docker load -i "$ARCHIVE_PATH"
  - verify required image tags are present
  - fail fast if the archive is incomplete

The actual deployment stack is documented in deploy/docker/README.md.
EOF

