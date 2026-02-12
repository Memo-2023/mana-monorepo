#!/bin/bash
# ManaCore Container Health Enforcer
# Ensures all containers are actually running, not just created
#
# This script detects containers that are stuck in "Created" or "Exited"
# status and automatically starts them.
#
# Run via LaunchD every 5 minutes or after system startup.

set -e

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"
LOG_FILE="/tmp/manacore-container-health.log"

# Load notification config if exists
if [ -f "$PROJECT_ROOT/.env.notifications" ]; then
    source "$PROJECT_ROOT/.env.notifications"
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_notification() {
    local message="$1"

    # Telegram
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${message}" \
            -d "parse_mode=HTML" \
            >/dev/null 2>&1 || true
    fi

    # ntfy
    if [ -n "$NTFY_TOPIC" ]; then
        curl -s -d "$message" \
            -H "Title: ManaCore Container Fixed" \
            -H "Priority: default" \
            -H "Tags: white_check_mark" \
            "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true
    fi
}

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    log "ERROR: Docker is not running"
    exit 1
fi

# Get containers that are NOT running (Created, Exited, etc.)
# Filter only mana-* containers from our compose file
STUCK_CONTAINERS=$(docker ps -a --filter "status=created" --filter "status=exited" --format "{{.Names}}" | grep "^mana-" || true)

if [ -z "$STUCK_CONTAINERS" ]; then
    log "OK: All containers are running"
    exit 0
fi

log "WARNING: Found containers not running:"
echo "$STUCK_CONTAINERS" | while read container; do
    STATUS=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
    log "  - $container (status: $STATUS)"
done

# Start the stuck containers using docker compose
log "Starting stuck containers via docker compose..."

cd "$PROJECT_ROOT"

# Use docker compose up for the specific services
# This ensures dependencies are respected
for container in $STUCK_CONTAINERS; do
    # Extract service name from container name (remove mana-app- or mana-* prefix)
    # Container naming: mana-{category}-{service} or mana-app-{service}-{type}
    SERVICE_NAME=""

    case "$container" in
        mana-app-todo-web) SERVICE_NAME="todo-web" ;;
        mana-app-todo-backend) SERVICE_NAME="todo-backend" ;;
        mana-app-chat-web) SERVICE_NAME="chat-web" ;;
        mana-app-chat-backend) SERVICE_NAME="chat-backend" ;;
        mana-app-calendar-web) SERVICE_NAME="calendar-web" ;;
        mana-app-calendar-backend) SERVICE_NAME="calendar-backend" ;;
        mana-app-clock-web) SERVICE_NAME="clock-web" ;;
        mana-app-clock-backend) SERVICE_NAME="clock-backend" ;;
        mana-app-contacts-web) SERVICE_NAME="contacts-web" ;;
        mana-app-contacts-backend) SERVICE_NAME="contacts-backend" ;;
        mana-app-storage-web) SERVICE_NAME="storage-web" ;;
        mana-app-storage-backend) SERVICE_NAME="storage-backend" ;;
        mana-app-presi-web) SERVICE_NAME="presi-web" ;;
        mana-app-presi-backend) SERVICE_NAME="presi-backend" ;;
        mana-app-nutriphi-web) SERVICE_NAME="nutriphi-web" ;;
        mana-app-nutriphi-backend) SERVICE_NAME="nutriphi-backend" ;;
        mana-app-skilltree-web) SERVICE_NAME="skilltree-web" ;;
        mana-app-skilltree-backend) SERVICE_NAME="skilltree-backend" ;;
        mana-app-photos-web) SERVICE_NAME="photos-web" ;;
        mana-app-photos-backend) SERVICE_NAME="photos-backend" ;;
        mana-app-web) SERVICE_NAME="mana-web" ;;
        mana-core-auth) SERVICE_NAME="mana-auth" ;;
        mana-core-gateway) SERVICE_NAME="api-gateway" ;;
        mana-core-search) SERVICE_NAME="mana-search" ;;
        mana-core-searxng) SERVICE_NAME="searxng" ;;
        mana-core-media) SERVICE_NAME="mana-media" ;;
        mana-infra-postgres) SERVICE_NAME="postgres" ;;
        mana-infra-redis) SERVICE_NAME="redis" ;;
        mana-infra-minio) SERVICE_NAME="minio" ;;
        mana-matrix-synapse) SERVICE_NAME="synapse" ;;
        mana-matrix-element) SERVICE_NAME="element-web" ;;
        mana-matrix-web) SERVICE_NAME="matrix-web" ;;
        mana-matrix-bot-*) SERVICE_NAME="${container#mana-matrix-bot-}"; SERVICE_NAME="matrix-${SERVICE_NAME}-bot" ;;
        mana-mon-*) SERVICE_NAME="${container#mana-mon-}" ;;
        mana-auto-*) SERVICE_NAME="${container#mana-auto-}" ;;
        mana-service-*) SERVICE_NAME="${container#mana-service-}" ;;
        mana-app-llm-playground) SERVICE_NAME="llm-playground" ;;
        *)
            log "  Unknown container pattern: $container, trying direct start"
            docker start "$container" 2>&1 || true
            continue
            ;;
    esac

    if [ -n "$SERVICE_NAME" ]; then
        log "  Starting service: $SERVICE_NAME"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d "$SERVICE_NAME" 2>&1 || {
            log "  WARNING: Failed to start $SERVICE_NAME via compose, trying direct start"
            docker start "$container" 2>&1 || true
        }
    fi
done

# Wait for containers to start
sleep 10

# Verify containers are now running
STILL_STUCK=$(docker ps -a --filter "status=created" --filter "status=exited" --format "{{.Names}}" | grep "^mana-" || true)

if [ -z "$STILL_STUCK" ]; then
    FIXED_MSG="Auto-fixed stuck containers: $(echo $STUCK_CONTAINERS | tr '\n' ', ')"
    log "SUCCESS: $FIXED_MSG"
    send_notification "🔧 <b>ManaCore Auto-Recovery</b>\n\n$FIXED_MSG"
else
    log "ERROR: Some containers still not running:"
    echo "$STILL_STUCK" | while read container; do
        log "  - $container"
    done
    send_notification "⚠️ <b>ManaCore Container Issue</b>\n\nContainers still stuck: $(echo $STILL_STUCK | tr '\n' ', ')"
    exit 1
fi
