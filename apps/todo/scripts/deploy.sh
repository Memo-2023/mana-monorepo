#!/bin/bash
# Todo Deployment Script
# Usage: ./scripts/deploy.sh [--build]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONOREPO_ROOT="$(dirname "$(dirname "$PROJECT_DIR")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Todo App Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for .env file
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and configure it:${NC}"
    echo "  cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

# Build if requested
if [ "$1" == "--build" ]; then
    echo -e "\n${YELLOW}Building Docker images...${NC}"
    docker compose -f docker-compose.prod.yml build
fi

# Pull latest images (if not building)
if [ "$1" != "--build" ]; then
    echo -e "\n${YELLOW}Pulling latest images...${NC}"
    docker compose -f docker-compose.prod.yml pull 2>/dev/null || true
fi

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down --remove-orphans

# Start containers
echo -e "\n${YELLOW}Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check health
echo -e "\n${YELLOW}Checking service health...${NC}"

check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}$service: healthy${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "  ${RED}$service: unhealthy${NC}"
    return 1
}

check_health "Backend" "http://localhost:3018/health"
check_health "Web" "http://localhost:5188"

# Show container status
echo -e "\n${YELLOW}Container status:${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  Backend API: http://localhost:3018"
echo "  Web App:     http://localhost:5188"
echo ""
echo "View logs with:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
