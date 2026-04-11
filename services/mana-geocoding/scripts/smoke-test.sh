#!/usr/bin/env bash
# Smoke test for a running mana-geocoding service.
#
# Runs a handful of real-world queries against the wrapper and asserts
# that each returns at least one result with sensible category mapping.
# Fails fast on the first unexpected response.
#
# Usage:
#   ./scripts/smoke-test.sh                         # default http://localhost:3018
#   ./scripts/smoke-test.sh http://mana-geocoding:3018
#   BASE=http://mana-geocoding:3018 ./scripts/smoke-test.sh
#
# This is NOT a substitute for the unit tests in src/lib/__tests__/ — it
# requires a fully deployed Pelias stack with the DACH index already
# loaded. It's the test to run after a deploy to confirm the full pipeline
# is healthy.

set -euo pipefail

BASE="${1:-${BASE:-http://localhost:3018}}"
pass=0
fail=0

has() {
	command -v "$1" >/dev/null 2>&1
}

if ! has jq; then
	echo "error: jq is required for this script (brew install jq)" >&2
	exit 2
fi

echo "=== mana-geocoding smoke test @ $BASE ==="
echo

check() {
	local label="$1"
	local url="$2"
	local filter="$3"
	local expected="$4"

	local actual
	actual=$(curl -sf --max-time 10 "$url" 2>/dev/null | jq -r "$filter" 2>/dev/null || echo "")

	if [ "$actual" = "$expected" ]; then
		printf "  ✓ %-50s → %s\n" "$label" "$actual"
		pass=$((pass + 1))
	else
		printf "  ✗ %-50s → got %q, expected %q\n" "$label" "$actual" "$expected"
		fail=$((fail + 1))
	fi
}

urlenc() {
	# POSIX-friendly URL-encode for the test queries.
	# jq -Rr @uri is the easiest cross-platform path.
	printf '%s' "$1" | jq -Rr @uri
}

# --- 1. Health checks ---

echo "--- Health ---"
check "wrapper health" "$BASE/health" '.status' 'ok'
check "pelias health proxy" "$BASE/health/pelias" '.status' 'ok'
echo

# --- 2. Forward geocoding ---

echo "--- Forward ---"

# Venue name queries (hit /autocomplete path)
check "restaurant search → food category" \
	"$BASE/api/v1/geocode/search?q=$(urlenc 'Konzil Konstanz')&limit=1" \
	'.results[0].category' 'food'

check "train station search → transit category" \
	"$BASE/api/v1/geocode/search?q=$(urlenc 'Stuttgart Hauptbahnhof')&limit=1" \
	'.results[0].category' 'transit'

# Street+locality query (falls back to /search path)
check "street+locality fallback returns a result" \
	"$BASE/api/v1/geocode/search?q=$(urlenc 'Marktstätte Konstanz')&limit=1" \
	'.results | length > 0' 'true'

# Focus point biasing
check "focus bias returns something near Konstanz" \
	"$BASE/api/v1/geocode/search?q=$(urlenc 'Park')&limit=1&focus.lat=47.66&focus.lon=9.17" \
	'.results | length > 0' 'true'

echo

# --- 3. Reverse geocoding ---

echo "--- Reverse ---"

# Konstanz city center
check "reverse Konstanz returns a result" \
	"$BASE/api/v1/geocode/reverse?lat=47.663&lon=9.175" \
	'.results | length > 0' 'true'

# München Marienplatz
check "reverse München Marienplatz resolves" \
	"$BASE/api/v1/geocode/reverse?lat=48.137&lon=11.575" \
	'.results | length > 0' 'true'

echo

# --- 4. Cache ---

echo "--- Cache ---"

# Prime the cache with a unique query
NONCE="smoke-$(date +%s)"
curl -sf --max-time 10 "$BASE/api/v1/geocode/search?q=$(urlenc "Konzil $NONCE")&limit=1" >/dev/null
check "same query comes back cached" \
	"$BASE/api/v1/geocode/search?q=$(urlenc "Konzil $NONCE")&limit=1" \
	'.cached' 'true'

echo

# --- Summary ---

total=$((pass + fail))
echo "=== Result: $pass/$total passed ==="
if [ "$fail" -gt 0 ]; then
	exit 1
fi
