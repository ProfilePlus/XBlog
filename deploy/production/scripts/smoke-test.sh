#!/usr/bin/env bash
set -euo pipefail

CURL_BIN="${CURL_BIN:-curl}"
PUBLIC_URL="${PUBLIC_URL:?Set PUBLIC_URL, for example https://xblog.example.com}"
ADMIN_URL="${ADMIN_URL:?Set ADMIN_URL, for example https://admin.xblog.example.com}"
INGEST_URL="${INGEST_URL:?Set INGEST_URL, for example https://ingest.xblog.example.com}"
ADMIN_BASIC_AUTH="${ADMIN_BASIC_AUTH:-}"
ASSET_URL="${ASSET_URL:-}"

request_code() {
	local url="$1"
	shift || true
	"$CURL_BIN" -ksS -o /dev/null -w "%{http_code}" "$@" "$url"
}

assert_code() {
	local label="$1"
	local expected="$2"
	local actual="$3"

	if [[ "$actual" != "$expected" ]]; then
		echo "FAIL: $label expected $expected but got $actual" >&2
		exit 1
	fi

	echo "OK: $label -> $actual"
}

assert_codes() {
	local label="$1"
	local actual="$2"
	shift 2

	for expected in "$@"; do
		if [[ "$actual" == "$expected" ]]; then
			echo "OK: $label -> $actual"
			return
		fi
	done

	echo "FAIL: $label expected one of [$*] but got $actual" >&2
	exit 1
}

public_http_url="${PUBLIC_URL/https:/http:}"

assert_code "public https" "200" "$(request_code "$PUBLIC_URL")"
assert_codes "public http redirect" "$(request_code "$public_http_url")" "301" "308"
assert_code "admin basic auth gate" "401" "$(request_code "$ADMIN_URL")"

if [[ -n "$ADMIN_BASIC_AUTH" ]]; then
	assert_code "admin login page after basic auth" "200" "$(request_code "$ADMIN_URL/login" -u "$ADMIN_BASIC_AUTH")"
fi

assert_code "ingest health" "200" "$(request_code "$INGEST_URL/api/health")"
assert_code "ingest admin rejection" "403" "$(request_code "$INGEST_URL/v1/admin/tokens")"
assert_code "ingest auth rejection" "403" "$(request_code "$INGEST_URL/v1/auth/me")"

if [[ -n "$ASSET_URL" ]]; then
	assert_code "asset read" "200" "$(request_code "$ASSET_URL")"
fi

echo "All XBlog public deployment smoke checks passed."
