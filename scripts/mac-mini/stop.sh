#!/bin/bash
# ManaCore Mac Mini Stop Script
# Stops all Docker containers

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

echo "=== Stopping ManaCore Services ==="
echo ""

cd "$PROJECT_ROOT"

echo "Stopping Docker containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "Containers stopped."
echo ""
echo "Note: Cloudflare tunnel is still running (managed by launchd)"
echo "To stop tunnel: launchctl unload ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist"
echo ""
