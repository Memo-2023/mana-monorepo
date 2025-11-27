#!/bin/bash

# Health check script for deployed services
# Usage: ./health-check.sh [environment]
# Example: ./health-check.sh staging
# Example: ./health-check.sh production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${1:-"staging"}

# Environment-specific configuration
if [ "$ENVIRONMENT" == "production" ]; then
    BASE_URL=${PRODUCTION_API_URL:-"https://api.manacore.app"}
else
    BASE_URL=${STAGING_API_URL:-"https://staging.manacore.app"}
fi

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check endpoints
declare -A ENDPOINTS=(
    ["Mana Core Auth"]="/api/v1/health"
    ["Maerchenzauber Backend"]="/health"
    ["Chat Backend"]="/api/health"
)

# Counter for failed checks
FAILED=0
TOTAL=0

log_info "Running health checks for ${ENVIRONMENT}..."
log_info "Base URL: ${BASE_URL}"
echo ""

# Check each endpoint
for service in "${!ENDPOINTS[@]}"; do
    endpoint="${ENDPOINTS[$service]}"
    url="${BASE_URL}${endpoint}"

    ((TOTAL++))

    log_info "Checking ${service}..."

    # Make HTTP request
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${url}" -m 10 || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        log_info "✅ ${service}: OK (HTTP ${HTTP_CODE})"
    else
        log_error "❌ ${service}: FAILED (HTTP ${HTTP_CODE})"
        ((FAILED++))
    fi

    echo ""
done

# Summary
echo "=========================================="
log_info "Health Check Summary:"
echo "  Total checks: ${TOTAL}"
echo "  Passed: $((TOTAL - FAILED))"
echo "  Failed: ${FAILED}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    log_info "All health checks passed! ✅"
    exit 0
else
    log_error "${FAILED} health check(s) failed ❌"
    exit 1
fi
