#!/bin/bash
#
# Push Drizzle schemas to all service databases
# Run after databases are created (deploy-v2.sh handles this)
#
# Usage: ./scripts/mac-mini/push-schemas.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Push Drizzle Schemas ==="
echo ""

push_schema() {
    local name=$1
    local dir=$2
    echo -n "  $name... "
    if (cd "$PROJECT_ROOT/$dir" && bun run db:push 2>/dev/null); then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
    fi
}

echo "Core Services:"
push_schema "mana-auth" "services/mana-auth"
push_schema "mana-credits" "services/mana-credits"
push_schema "mana-user" "services/mana-user"
push_schema "mana-subscriptions" "services/mana-subscriptions"
push_schema "mana-analytics" "services/mana-analytics"
push_schema "news-ingester" "services/news-ingester"

echo ""
echo "Done. mana-sync creates its schema automatically on startup."
