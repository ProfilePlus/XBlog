#!/usr/bin/env bash
set -euo pipefail

# Shared helpers for the Docker deployment scripts.
# The goal is to keep each script small and readable.

repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/../.."
  pwd
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    printf '%s\n' "docker compose"
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    printf '%s\n' "docker-compose"
    return 0
  fi

  echo "docker compose is not available." >&2
  exit 1
}

need_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

require_file() {
  local file="$1"
  local message="${2:-Missing required file: $file}"

  if [[ ! -f "$file" ]]; then
    echo "$message" >&2
    exit 1
  fi
}

print_usage_block() {
  cat <<'EOF'
Usage:
  export XBLOG_VERSION=20260319-1
  ./deploy/docker/<script>.sh
EOF
}

