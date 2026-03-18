#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
	echo "Usage: $0 <plaintext-password>" >&2
	exit 1
fi

caddy hash-password --plaintext "$1"
