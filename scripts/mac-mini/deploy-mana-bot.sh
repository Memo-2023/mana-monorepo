#!/bin/bash
# Deploy Matrix Mana Bot (Gateway) to Mac Mini
# This script handles the complete deployment process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "============================================"
echo "  Matrix Mana Bot - Full Deployment"
echo "============================================"
echo ""

cd "$PROJECT_DIR"

# Check if .env exists and has the token
if ! grep -q "MATRIX_MANA_BOT_TOKEN" .env 2>/dev/null; then
    echo -e "${YELLOW}Warning: MATRIX_MANA_BOT_TOKEN not found in .env${NC}"
    echo "Run ./scripts/mac-mini/setup-mana-bot.sh first to register the bot."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Pull latest code
echo -e "${CYAN}Step 1: Pulling latest code...${NC}"
git pull --ff-only || {
    echo -e "${YELLOW}Git pull failed. You may have local changes.${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Step 2: Build shared package
echo ""
echo -e "${CYAN}Step 2: Building @manacore/bot-services...${NC}"
cd "$PROJECT_DIR/packages/bot-services"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build || {
    echo -e "${RED}Failed to build bot-services package${NC}"
    exit 1
}
echo -e "${GREEN}bot-services built successfully${NC}"

# Step 3: Build gateway bot
echo ""
echo -e "${CYAN}Step 3: Building matrix-mana-bot...${NC}"
cd "$PROJECT_DIR/services/matrix-mana-bot"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build || {
    echo -e "${RED}Failed to build matrix-mana-bot${NC}"
    exit 1
}
echo -e "${GREEN}matrix-mana-bot built successfully${NC}"

# Step 4: Build Docker image
echo ""
echo -e "${CYAN}Step 4: Building Docker image...${NC}"
cd "$PROJECT_DIR"
docker build -t matrix-mana-bot:latest ./services/matrix-mana-bot || {
    echo -e "${RED}Failed to build Docker image${NC}"
    exit 1
}
echo -e "${GREEN}Docker image built successfully${NC}"

# Step 5: Stop existing container if running
echo ""
echo -e "${CYAN}Step 5: Stopping existing container...${NC}"
docker compose -f docker-compose.macmini.yml stop matrix-mana-bot 2>/dev/null || true
docker compose -f docker-compose.macmini.yml rm -f matrix-mana-bot 2>/dev/null || true

# Step 6: Start new container
echo ""
echo -e "${CYAN}Step 6: Starting matrix-mana-bot...${NC}"
docker compose -f docker-compose.macmini.yml up -d matrix-mana-bot || {
    echo -e "${RED}Failed to start container${NC}"
    exit 1
}

# Step 7: Wait for health check
echo ""
echo -e "${CYAN}Step 7: Waiting for health check...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3310/health > /dev/null 2>&1; then
        echo -e "${GREEN}Health check passed!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Health check failed after 30 seconds${NC}"
        echo "Check logs with: docker logs manacore-matrix-mana-bot"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Step 8: Show status
echo ""
echo "============================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "============================================"
echo ""
echo "Container Status:"
docker ps --filter "name=manacore-matrix-mana-bot" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Health Check:"
curl -s http://localhost:3310/health | jq . 2>/dev/null || curl -s http://localhost:3310/health
echo ""
echo ""
echo "Next Steps:"
echo "1. Invite the bot to a Matrix room:"
echo "   /invite @mana:mana.how"
echo ""
echo "2. Test with:"
echo "   hilfe"
echo "   !todo Test aufgabe"
echo "   !list"
echo ""
echo "3. View logs with:"
echo "   docker logs -f manacore-matrix-mana-bot"
echo ""
