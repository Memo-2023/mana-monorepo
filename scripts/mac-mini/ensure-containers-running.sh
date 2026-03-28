#!/bin/bash
# ManaCore Container Health Enforcer
# Ensures all containers are actually running and healthy
#
# This script detects containers that are:
# - Stuck in "Created" or "Exited" status -> starts them
# - Crash-looping in "Restarting" status -> recreates them
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
RESTART_TRACKER="/tmp/manacore-restart-tracker"

# Load notification config if exists
if [ -f "$PROJECT_ROOT/.env.notifications" ]; then
    source "$PROJECT_ROOT/.env.notifications"
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_notification() {
    local message="$1"
    local priority="${2:-default}"

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
            -H "Title: ManaCore Container Health" \
            -H "Priority: $priority" \
            -H "Tags: white_check_mark" \
            "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true
    fi
}

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    log "ERROR: Docker is not running"
    exit 1
fi

# Get containers that are NOT running (Created, Exited)
STUCK_CONTAINERS=$(docker ps -a --filter "status=created" --filter "status=exited" --format "{{.Names}}" | grep "^mana-" || true)

# Get containers that are crash-looping (Restarting)
CRASHLOOP_CONTAINERS=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep "^mana-" || true)

# Track restart attempts to avoid infinite loops
track_restart() {
    local container="$1"
    local count_file="$RESTART_TRACKER/$container"
    mkdir -p "$RESTART_TRACKER"

    if [ -f "$count_file" ]; then
        local count=$(cat "$count_file")
        local age=$(( $(date +%s) - $(stat -f %m "$count_file" 2>/dev/null || stat -c %Y "$count_file" 2>/dev/null) ))
        # Reset counter if more than 1 hour old
        if [ "$age" -gt 3600 ]; then
            echo "1" > "$count_file"
            echo "1"
        else
            count=$((count + 1))
            echo "$count" > "$count_file"
            echo "$count"
        fi
    else
        echo "1" > "$count_file"
        echo "1"
    fi
}

if [ -z "$STUCK_CONTAINERS" ] && [ -z "$CRASHLOOP_CONTAINERS" ]; then
    log "OK: All containers are running"
    exit 0
fi

# Handle crash-looping containers first (more critical)
if [ -n "$CRASHLOOP_CONTAINERS" ]; then
    log "WARNING: Found crash-looping containers:"
    for container in $CRASHLOOP_CONTAINERS; do
        RESTART_COUNT=$(docker inspect "$container" --format '{{.RestartCount}}' 2>/dev/null || echo "0")
        log "  - $container (restart count: $RESTART_COUNT)"
    done

    log "Attempting to recover crash-looping containers..."
    for container in $CRASHLOOP_CONTAINERS; do
        ATTEMPTS=$(track_restart "$container")

        if [ "$ATTEMPTS" -gt 3 ]; then
            log "  SKIP: $container has been restarted $ATTEMPTS times in the last hour, needs manual intervention"
            send_notification "🚨 <b>Container needs manual fix</b>\n\n$container has crashed $ATTEMPTS times. Check logs:\n<code>docker logs $container</code>" "high"
            continue
        fi

        log "  Recreating $container (attempt $ATTEMPTS/3)..."
        # Stop, remove and recreate the container
        docker stop "$container" 2>/dev/null || true
        docker rm "$container" 2>/dev/null || true
    done
fi

# Handle stuck containers (Created/Exited)
if [ -n "$STUCK_CONTAINERS" ]; then
    log "WARNING: Found containers not running:"
    for container in $STUCK_CONTAINERS; do
        STATUS=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
        log "  - $container (status: $STATUS)"
    done
fi

# Combine all containers that need to be started
ALL_PROBLEM_CONTAINERS=$(echo -e "$STUCK_CONTAINERS\n$CRASHLOOP_CONTAINERS" | grep -v "^$" | sort -u || true)

if [ -z "$ALL_PROBLEM_CONTAINERS" ]; then
    log "OK: No containers need recovery"
    exit 0
fi

log "Starting containers via docker compose..."

cd "$PROJECT_ROOT"

# Use docker compose up for the specific services
# This ensures dependencies are respected
for container in $ALL_PROBLEM_CONTAINERS; do
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
        mana-app-contacts-web) SERVICE_NAME="contacts-web" ;;
        mana-app-contacts-backend) SERVICE_NAME="contacts-backend" ;;
        mana-app-storage-web) SERVICE_NAME="storage-web" ;;
        mana-app-storage-backend) SERVICE_NAME="storage-backend" ;;
        mana-app-presi-web) SERVICE_NAME="presi-web" ;;
        mana-app-nutriphi-web) SERVICE_NAME="nutriphi-web" ;;
        mana-app-nutriphi-backend) SERVICE_NAME="nutriphi-backend" ;;
        mana-app-skilltree-web) SERVICE_NAME="skilltree-web" ;;
        # mana-app-skilltree-backend: REMOVED
        mana-app-photos-web) SERVICE_NAME="photos-web" ;;
        # mana-app-photos-backend: REMOVED
        mana-app-web) SERVICE_NAME="mana-web" ;;
        mana-auth) SERVICE_NAME="mana-auth" ;;
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

# Verify containers are now running (check for created, exited, AND restarting)
STILL_STUCK=$(docker ps -a --filter "status=created" --filter "status=exited" --format "{{.Names}}" | grep "^mana-" || true)
STILL_CRASHING=$(docker ps -a --filter "status=restarting" --format "{{.Names}}" | grep "^mana-" || true)
ALL_STILL_BROKEN=$(echo -e "$STILL_STUCK\n$STILL_CRASHING" | grep -v "^$" | sort -u || true)

if [ -z "$ALL_STILL_BROKEN" ]; then
    FIXED_MSG="Auto-fixed containers: $(echo $ALL_PROBLEM_CONTAINERS | tr '\n' ', ')"
    log "SUCCESS: $FIXED_MSG"
    send_notification "🔧 <b>ManaCore Auto-Recovery</b>\n\n$FIXED_MSG"
else
    log "ERROR: Some containers still have issues:"
    for container in $ALL_STILL_BROKEN; do
        STATUS=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
        log "  - $container (status: $STATUS)"
    done
    send_notification "⚠️ <b>ManaCore Container Issue</b>\n\nContainers still broken: $(echo $ALL_STILL_BROKEN | tr '\n' ', ')" "high"
    exit 1
fi
