#!/bin/bash
# ManaCore Mac Mini Startup Script
# Called by launchd on boot — starts Colima + all containers
#
# LaunchAgent: ~/Library/LaunchAgents/com.manacore.docker-startup.plist

set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

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

# ─── Kill Docker Desktop if it auto-started ───
if pgrep -f "Docker.app" >/dev/null 2>&1; then
    log "Docker Desktop detected, stopping..."
    osascript -e 'quit app "Docker"' 2>/dev/null
    sleep 5
    pkill -f "Docker.app" 2>/dev/null || true
    sleep 3
    log "Docker Desktop stopped"
fi

# ─── Start Colima ───
if colima status 2>/dev/null | grep -q "running"; then
    log "Colima already running"
else
    log "Starting Colima..."

    # Clear stale process state from hard shutdown (stop only, never delete — delete wipes all images)
    colima stop --force 2>/dev/null || true
    sleep 2

    colima start \
        --cpu 8 \
        --memory 12 \
        --disk 200 \
        --vm-type vz \
        --vz-rosetta \
        --mount-type virtiofs \
        --mount /Users/mana:w \
        --mount /Volumes/ManaData:w \
        2>&1 | tee -a "$LOG_FILE"

    if ! colima status 2>/dev/null | grep -q "running"; then
        log "ERROR: Colima failed to start"
        exit 1
    fi
    log "Colima started successfully"
fi

# ─── Verify Docker CLI works ───
if ! docker info >/dev/null 2>&1; then
    log "ERROR: Docker CLI not connected to Colima"
    exit 1
fi
log "Docker CLI connected"

# ─── Restore named volumes if missing ───
BACKUP_DIR="/Volumes/ManaData/backups/docker-migration-20260328"
for vol in mana-redis-data mana-victoria-data mana-alertmanager-data mana-grafana-data mana-analytics-data mana-loki-data mana-matrix-bots-data; do
    if ! docker volume inspect "$vol" >/dev/null 2>&1; then
        BACKUP_FILE="$BACKUP_DIR/${vol}.tar.gz"
        if [ -f "$BACKUP_FILE" ]; then
            log "Restoring volume: $vol"
            docker volume create "$vol" >/dev/null
            docker run --rm -v "$vol":/target -v "$BACKUP_DIR":/backup:ro \
                alpine sh -c "tar xzf /backup/${vol}.tar.gz -C /target 2>/dev/null"
        fi
    fi
done

# ─── Check prerequisites ───
if [ ! -f "$COMPOSE_FILE" ]; then
    log "ERROR: $COMPOSE_FILE not found"
    exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: $ENV_FILE not found"
    exit 1
fi

# ─── Start containers ───
log "Starting Docker containers..."
cd "$PROJECT_ROOT"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-build 2>&1 | tee -a "$LOG_FILE"

# ─── Force-recreate stateful containers that cache config ───
# synapse copies homeserver.yaml at startup; stale container uses old cached config
log "Force-recreating config-sensitive containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-build --force-recreate synapse 2>&1 | tee -a "$LOG_FILE"

# ─── Wait and verify ───
log "Waiting 45s for services to initialize..."
sleep 45

RUNNING=$(docker ps -q | wc -l | tr -d ' ')
log "Containers running: $RUNNING"

# ─── Create missing databases ───
log "Ensuring databases exist..."
for db in mana_auth mana_credits chat todo calendar clock contacts storage; do
    docker exec mana-infra-postgres psql -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
done

log "=== Startup Complete ($RUNNING containers running) ==="
