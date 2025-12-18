#!/bin/bash
# Auth Service Health Check Script
# Runs automated tests against mana-core-auth and updates dashboard
#
# Usage: ./auth-health-check.sh [environment]
# Environments: staging (default), production

set -e

# Configuration
ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
DASHBOARD_FILE="${SCRIPT_DIR}/dashboard/index.html"

# Set URLs based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    AUTH_URL="https://auth.manacore.ai"
elif [ "$ENVIRONMENT" = "staging" ]; then
    AUTH_URL="https://auth.staging.manacore.ai"
else
    AUTH_URL="http://localhost:3001"
fi

# Ensure directories exist
mkdir -p "$RESULTS_DIR"
mkdir -p "$(dirname "$DASHBOARD_FILE")"

# Initialize results
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RESULTS_FILE="${RESULTS_DIR}/results-${ENVIRONMENT}.json"
HISTORY_FILE="${RESULTS_DIR}/history-${ENVIRONMENT}.json"

echo "🔍 Running auth health checks for $ENVIRONMENT ($AUTH_URL)"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Test functions
test_health() {
    echo -n "  Testing health endpoint... "
    RESPONSE=$(curl -s -w "\n%{http_code}" "$AUTH_URL/api/v1/health" 2>/dev/null || echo -e "\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ PASS (HTTP $HTTP_CODE)"
        echo '{"test": "health", "status": "pass", "httpCode": '"$HTTP_CODE"', "response": '"$BODY"'}'
    else
        echo "❌ FAIL (HTTP $HTTP_CODE)"
        echo '{"test": "health", "status": "fail", "httpCode": '"$HTTP_CODE"', "error": "Health check failed"}'
    fi
}

test_jwks() {
    echo -n "  Testing JWKS endpoint... "
    RESPONSE=$(curl -s -w "\n%{http_code}" "$AUTH_URL/api/v1/auth/jwks" 2>/dev/null || echo -e "\n000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        # Check if it contains EdDSA key
        if echo "$BODY" | grep -q '"alg":"EdDSA"'; then
            echo "✅ PASS (EdDSA key found)"
            echo '{"test": "jwks", "status": "pass", "httpCode": '"$HTTP_CODE"', "algorithm": "EdDSA"}'
        else
            echo "⚠️ WARN (No EdDSA key)"
            echo '{"test": "jwks", "status": "warn", "httpCode": '"$HTTP_CODE"', "warning": "EdDSA key not found"}'
        fi
    else
        echo "❌ FAIL (HTTP $HTTP_CODE)"
        echo '{"test": "jwks", "status": "fail", "httpCode": '"$HTTP_CODE"', "error": "JWKS endpoint failed"}'
    fi
}

test_security_headers() {
    echo -n "  Testing security headers... "
    HEADERS=$(curl -sI "$AUTH_URL/api/v1/health" 2>/dev/null || echo "")

    MISSING=""
    [ -z "$(echo "$HEADERS" | grep -i 'Strict-Transport-Security')" ] && MISSING="$MISSING HSTS"
    [ -z "$(echo "$HEADERS" | grep -i 'X-Content-Type-Options')" ] && MISSING="$MISSING X-Content-Type-Options"
    [ -z "$(echo "$HEADERS" | grep -i 'X-Frame-Options')" ] && MISSING="$MISSING X-Frame-Options"
    [ -z "$(echo "$HEADERS" | grep -i 'Content-Security-Policy')" ] && MISSING="$MISSING CSP"

    if [ -z "$MISSING" ]; then
        echo "✅ PASS (All headers present)"
        echo '{"test": "security_headers", "status": "pass", "headers": ["HSTS", "X-Content-Type-Options", "X-Frame-Options", "CSP"]}'
    else
        echo "⚠️ WARN (Missing:$MISSING)"
        echo '{"test": "security_headers", "status": "warn", "missing": "'"${MISSING# }"'"}'
    fi
}

test_response_time() {
    echo -n "  Testing response time... "
    # Get time in milliseconds directly
    TIME_MS=$(curl -s -o /dev/null -w "%{time_total}" "$AUTH_URL/api/v1/health" 2>/dev/null | awk '{printf "%.0f", $1 * 1000}')

    # Default to 9999 if calculation failed
    [ -z "$TIME_MS" ] || [ "$TIME_MS" = "0" ] && TIME_MS=9999

    if [ "$TIME_MS" -lt 500 ]; then
        echo "✅ PASS (${TIME_MS}ms)"
        echo '{"test": "response_time", "status": "pass", "time_ms": '"$TIME_MS"'}'
    elif [ "$TIME_MS" -lt 2000 ]; then
        echo "⚠️ WARN (${TIME_MS}ms - slow)"
        echo '{"test": "response_time", "status": "warn", "time_ms": '"$TIME_MS"'}'
    else
        echo "❌ FAIL (${TIME_MS}ms - timeout)"
        echo '{"test": "response_time", "status": "fail", "time_ms": '"$TIME_MS"'}'
    fi
}

# Run all tests and collect results
echo "Running tests..."
HEALTH_RESULT=$(test_health)
JWKS_RESULT=$(test_jwks)
HEADERS_RESULT=$(test_security_headers)
RESPONSE_RESULT=$(test_response_time)

# Parse results for summary
HEALTH_STATUS=$(echo "$HEALTH_RESULT" | grep -o '"status": *"[^"]*"' | cut -d'"' -f4)
JWKS_STATUS=$(echo "$JWKS_RESULT" | grep -o '"status": *"[^"]*"' | cut -d'"' -f4)
HEADERS_STATUS=$(echo "$HEADERS_RESULT" | grep -o '"status": *"[^"]*"' | cut -d'"' -f4)
RESPONSE_STATUS=$(echo "$RESPONSE_RESULT" | grep -o '"status": *"[^"]*"' | cut -d'"' -f4)

# Determine overall status
if [ "$HEALTH_STATUS" = "fail" ] || [ "$JWKS_STATUS" = "fail" ] || [ "$RESPONSE_STATUS" = "fail" ]; then
    OVERALL_STATUS="fail"
elif [ "$HEALTH_STATUS" = "warn" ] || [ "$JWKS_STATUS" = "warn" ] || [ "$HEADERS_STATUS" = "warn" ] || [ "$RESPONSE_STATUS" = "warn" ]; then
    OVERALL_STATUS="degraded"
else
    OVERALL_STATUS="healthy"
fi

echo ""
echo "Overall status: $OVERALL_STATUS"

# Write results JSON
cat > "$RESULTS_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "url": "$AUTH_URL",
  "timestamp": "$TIMESTAMP",
  "status": "$OVERALL_STATUS",
  "tests": {
    "health": $(echo "$HEALTH_RESULT" | tail -1),
    "jwks": $(echo "$JWKS_RESULT" | tail -1),
    "security_headers": $(echo "$HEADERS_RESULT" | tail -1),
    "response_time": $(echo "$RESPONSE_RESULT" | tail -1)
  }
}
EOF

echo "Results written to: $RESULTS_FILE"

# Update history (keep last 30 days)
if [ -f "$HISTORY_FILE" ]; then
    # Add new result to history
    jq --argjson new "$(cat "$RESULTS_FILE")" '. + [$new] | .[-720:]' "$HISTORY_FILE" > "${HISTORY_FILE}.tmp" 2>/dev/null || echo "[$(<$RESULTS_FILE)]" > "${HISTORY_FILE}.tmp"
    mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
else
    echo "[$(cat "$RESULTS_FILE")]" > "$HISTORY_FILE"
fi

# Generate dashboard
"${SCRIPT_DIR}/generate-dashboard.sh" 2>/dev/null || echo "Dashboard generation skipped (run generate-dashboard.sh manually)"

echo ""
echo "✅ Health check complete"
exit 0
