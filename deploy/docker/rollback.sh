#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-blue}"

case "$TARGET" in
  blue|green)
    ;;
  *)
    echo "Usage: $0 {blue|green}" >&2
    exit 1
    ;;
esac

cat <<EOF
This script should roll traffic back to the $TARGET stack.

Rollback principle:
  - switch back first
  - then investigate
  - never try to repair the broken stack in place while traffic is still on it
EOF

