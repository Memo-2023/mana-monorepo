#!/bin/bash
#
# Mac Mini Deployment Script v2 — New Architecture (Hono + Bun + Go)
#
# Deploys the complete Mana stack:
# - Infrastructure: PostgreSQL, Redis, MinIO, SearXNG
# - Core Services: mana-auth, mana-credits, mana-user, mana-subscriptions, mana-analytics
# - Go Services: mana-sync, mana-search, mana-crawler, mana-api-gateway, mana-notify, mana-matrix-bot
# - Python AI: mana-llm, mana-stt, mana-tts, mana-image-gen
# - App Frontends: 19 SvelteKit web apps
#
# Usage:
#   ./scripts/mac-mini/deploy-v2.sh           # Full deploy
#   ./scripts/mac-mini/deploy-v2.sh --quick   # Skip builds, just restart
#   ./scripts/mac-mini/deploy-v2.sh --status  # Just show status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$PROJECT_ROOT"

# ─── Helper Functions ────────────────────────────────────────

check_health() {
    local name=$1
    local url=$2
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
    else
        echo -e "  ${RED}✗${NC} $name ($status)"
    fi
}

# ─── Status Only ─────────────────────────────────────────────

if [ "$1" = "--status" ]; then
    echo -e "${BLUE}=== Mana Service Status ===${NC}"
    echo ""
    echo "Core (Hono + Bun):"
    check_health "mana-auth (3001)" "http://localhost:3001/health"
    check_health "mana-credits (3061)" "http://localhost:3061/health"
    check_health "mana-user (3062)" "http://localhost:3062/health"
    check_health "mana-subscriptions (3063)" "http://localhost:3063/health"
    check_health "mana-analytics (3064)" "http://localhost:3064/health"
    echo ""
    echo "Go Services:"
    check_health "mana-sync (3050)" "http://localhost:3050/health"
    check_health "mana-search (3021)" "http://localhost:3021/health"
    check_health "mana-api-gateway (3060)" "http://localhost:3060/health"
    echo ""
    echo "Infrastructure:"
    check_health "PostgreSQL (5432)" "http://localhost:5432" # Won't return 200, but tests connectivity
    docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | head -30
    exit 0
fi

# ─── Pre-flight Checks ──────────────────────────────────────

echo -e "${BLUE}=== Mana Deployment v2 ===${NC}"
echo ""

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Missing $ENV_FILE — copy from .env.macmini.example${NC}"
    exit 1
fi

# ─── Pull Latest Code ───────────────────────────────────────

echo -e "${YELLOW}Pulling latest code...${NC}"
git pull --rebase origin main 2>/dev/null || echo "Pull skipped (not on main or no remote)"
echo ""

# ─── Create Databases ───────────────────────────────────────

echo -e "${YELLOW}Ensuring databases exist...${NC}"

# Start just postgres first
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
sleep 5

# Create all needed databases
for db in mana_auth mana_credits mana_user mana_subscriptions mana_analytics mana_sync \
          chat todo calendar contacts storage cards music nutriphi planta \
          questions traces context citycorners photos presi skilltree; do
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
done
echo -e "${GREEN}Databases ready.${NC}"
echo ""

# ─── Build & Start Services ─────────────────────────────────

if [ "$1" != "--quick" ]; then
    echo -e "${YELLOW}Building images...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel 2>&1 | tail -5
    echo ""
fi

echo -e "${YELLOW}Starting all services...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
echo ""

# ─── Wait & Health Check ────────────────────────────────────

echo -e "${YELLOW}Waiting for services to start (20s)...${NC}"
sleep 20
echo ""

echo -e "${BLUE}=== Health Checks ===${NC}"
echo ""
echo "Core (Hono + Bun):"
check_health "mana-auth" "http://localhost:3001/health"
check_health "mana-credits" "http://localhost:3061/health"
check_health "mana-user" "http://localhost:3062/health"
check_health "mana-subscriptions" "http://localhost:3063/health"
check_health "mana-analytics" "http://localhost:3064/health"

echo ""
echo "Go Services:"
check_health "mana-sync" "http://localhost:3050/health"
check_health "mana-search" "http://localhost:3021/health"
check_health "mana-api-gateway" "http://localhost:3060/health"

echo ""
echo "Infrastructure:"
check_health "PostgreSQL" "http://localhost:5432"
check_health "Redis" "http://localhost:6379"
check_health "MinIO" "http://localhost:9000/minio/health/live"

echo ""
echo -e "${GREEN}=== Deployment complete ===${NC}"
echo ""
echo "Useful commands:"
echo "  ./scripts/mac-mini/deploy-v2.sh --status   # Check health"
echo "  docker compose -f docker-compose.macmini.yml logs -f mana-auth  # View logs"
echo "  docker compose -f docker-compose.macmini.yml restart mana-auth  # Restart service"
