#!/bin/bash
# Mana Mac Mini Restart Script
# Restarts all Docker containers gracefully

set -e

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

echo "=== Mana Restart ==="
echo ""

# Check for flags
PULL_IMAGES=false
FORCE_RECREATE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --pull) PULL_IMAGES=true ;;
        --force) FORCE_RECREATE=true ;;
        --help)
            echo "Usage: restart.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --pull    Pull latest images before restart"
            echo "  --force   Force recreate containers"
            echo "  --help    Show this help"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

cd "$PROJECT_ROOT"

# Optional: Pull latest images
if [ "$PULL_IMAGES" = true ]; then
    echo "Pulling latest images..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    echo ""
fi

# Stop containers
echo "Stopping containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "Starting containers..."

if [ "$FORCE_RECREATE" = true ]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate
else
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
fi

echo ""
echo "Waiting for services to start (30s)..."
sleep 30

echo ""
echo "=== Container Status ==="
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Running health check..."
"$SCRIPT_DIR/health-check.sh"
