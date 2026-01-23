#!/bin/bash
# ManaCore Health Check Script
# Checks all services and optionally sends notifications

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=()

check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)

    if [ "$status" = "200" ]; then
        echo -e "  ${GREEN}[OK]${NC} $name"
        return 0
    else
        echo -e "  ${RED}[FAIL]${NC} $name (HTTP $status)"
        FAILURES+=("$name")
        return 1
    fi
}

echo ""
echo "=== ManaCore Health Check ==="
echo "Time: $(date)"
echo ""

echo "Infrastructure:"
# Check postgres via docker
if docker exec manacore-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} PostgreSQL"
else
    echo -e "  ${RED}[FAIL]${NC} PostgreSQL"
    FAILURES+=("PostgreSQL")
fi

# Check redis via docker
if docker exec manacore-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} Redis"
else
    echo -e "  ${RED}[FAIL]${NC} Redis"
    FAILURES+=("Redis")
fi

echo ""
echo "Auth & Dashboard:"
check_service "Auth API" "http://localhost:3001/api/v1/health"
check_service "Dashboard Web" "http://localhost:5173/"  # SvelteKit - check root

echo ""
echo "Chat:"
check_service "Chat Backend" "http://localhost:3002/api/v1/health"
check_service "Chat Web" "http://localhost:3000/"  # SvelteKit - check root

echo ""
echo "Todo:"
check_service "Todo Backend" "http://localhost:3018/api/v1/health"
check_service "Todo Web" "http://localhost:5188/"  # SvelteKit - check root

echo ""
echo "Calendar:"
check_service "Calendar Backend" "http://localhost:3016/api/v1/health"
check_service "Calendar Web" "http://localhost:5186/"  # SvelteKit - check root

echo ""
echo "Clock:"
check_service "Clock Backend" "http://localhost:3017/api/v1/health"
check_service "Clock Web" "http://localhost:5187/"  # SvelteKit - check root

echo ""
echo "Cloudflare Tunnel:"
if pgrep -x "cloudflared" >/dev/null; then
    echo -e "  ${GREEN}[OK]${NC} cloudflared running"
else
    echo -e "  ${RED}[FAIL]${NC} cloudflared not running"
    FAILURES+=("cloudflared")
fi

echo ""
echo "=== Summary ==="

if [ ${#FAILURES[@]} -eq 0 ]; then
    echo -e "${GREEN}All services healthy!${NC}"
    exit 0
else
    echo -e "${RED}Failed services (${#FAILURES[@]}):${NC}"
    for f in "${FAILURES[@]}"; do
        echo "  - $f"
    done

    # Send notification if ntfy is configured
    NTFY_TOPIC="${NTFY_TOPIC:-}"
    if [ -n "$NTFY_TOPIC" ]; then
        FAILED_LIST=$(printf '%s, ' "${FAILURES[@]}")
        curl -s -d "ManaCore Health Check Failed: ${FAILED_LIST%, }" \
            -H "Title: Mac Mini Alert" \
            -H "Priority: high" \
            -H "Tags: warning" \
            "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true
    fi

    exit 1
fi
