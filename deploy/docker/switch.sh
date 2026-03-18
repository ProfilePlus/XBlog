#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-green}"

case "$TARGET" in
  blue|green)
    ;;
  *)
    echo "Usage: $0 {blue|green}" >&2
    exit 1
    ;;
esac

cat <<EOF
This script should switch Caddy traffic to the $TARGET stack.

The important invariant is:
  - do not change traffic before migration and smoke tests pass
  - make switching a small, reversible operation

Typical implementations will update the reverse proxy target or a symlinked config file.
EOF

