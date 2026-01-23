#!/bin/bash
# ManaCore Mac Mini Startup Script
# This script is called by launchd on boot to start all services

set -e

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

LOG_FILE="/tmp/manacore-startup.log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== ManaCore Startup Script ==="
log "Project root: $PROJECT_ROOT"

# Wait for Docker to be ready
log "Waiting for Docker..."
MAX_WAIT=120
WAITED=0
while ! docker info >/dev/null 2>&1; do
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $WAITED -ge $MAX_WAIT ]; then
        log "ERROR: Docker not available after ${MAX_WAIT}s"
        exit 1
    fi
done
log "Docker is ready (waited ${WAITED}s)"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: Environment file not found: $ENV_FILE"
    exit 1
fi

# Pull latest images (optional, comment out for faster startup)
# log "Pulling latest images..."
# docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

# Start containers
log "Starting Docker containers..."
cd "$PROJECT_ROOT"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to initialize
log "Waiting 45s for services to initialize..."
sleep 45

# Create databases if they don't exist
log "Ensuring databases exist..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE manacore_auth;" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE chat;" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE todo;" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE calendar;" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE clock;" 2>/dev/null || true

# Run health checks
log "Running health checks..."
"$SCRIPT_DIR/health-check.sh" >> "$LOG_FILE" 2>&1

log "=== Startup Complete ==="
