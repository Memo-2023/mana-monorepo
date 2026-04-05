#!/bin/bash
# Mana Database Backup Script
# Creates daily backups of all PostgreSQL databases with rotation
#
# Retention policy:
# - Daily backups: keep last 7 days
# - Weekly backups: keep last 4 weeks (Sundays)
#
# Run via LaunchD daily at 3 AM

set -e

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="/Volumes/ManaData/backups/postgres"
LOG_FILE="/tmp/mana-backup.log"
DATE=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday

# Load env for password
if [ -f "$PROJECT_ROOT/.env.macmini" ]; then
    source "$PROJECT_ROOT/.env.macmini"
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-mana123}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Load notification config if exists
if [ -f "$PROJECT_ROOT/.env.notifications" ]; then
    source "$PROJECT_ROOT/.env.notifications"
fi

send_notification() {
    local message="$1"
    local priority="${2:-default}"

    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=${message}" \
            -d "parse_mode=HTML" \
            >/dev/null 2>&1 || true
    fi
}

# Create backup directories
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"

log "=== Mana Database Backup ==="

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "mana-infra-postgres"; then
    log "ERROR: PostgreSQL container is not running"
    send_notification "🚨 <b>Backup Failed</b>\n\nPostgreSQL container not running" "high"
    exit 1
fi

# Get list of databases (exclude templates and postgres)
DATABASES=$(docker exec mana-infra-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';" | tr -d ' ' | grep -v "^$")

log "Found databases: $(echo $DATABASES | tr '\n' ' ')"

BACKUP_COUNT=0
BACKUP_SIZE=0
FAILED_DBS=""

for DB in $DATABASES; do
    log "Backing up: $DB"
    BACKUP_FILE="$BACKUP_DIR/daily/${DB}_${DATE}.sql.gz"

    # Create backup using pg_dump inside container, compress with gzip
    if docker exec mana-infra-postgres pg_dump -U postgres "$DB" 2>/dev/null | gzip > "$BACKUP_FILE"; then
        SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        log "  OK: $DB ($SIZE)"
        BACKUP_COUNT=$((BACKUP_COUNT + 1))
        BACKUP_SIZE=$((BACKUP_SIZE + $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)))
    else
        log "  FAILED: $DB"
        FAILED_DBS="$FAILED_DBS $DB"
        rm -f "$BACKUP_FILE"  # Remove incomplete backup
    fi
done

# On Sunday, create weekly backup
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    log "Creating weekly backup (Sunday)..."
    WEEKLY_DIR="$BACKUP_DIR/weekly/$DATE"
    mkdir -p "$WEEKLY_DIR"
    cp "$BACKUP_DIR/daily/"*"_${DATE}.sql.gz" "$WEEKLY_DIR/" 2>/dev/null || true
    log "Weekly backup created in $WEEKLY_DIR"
fi

# Rotate daily backups (keep last 7 days)
log "Rotating daily backups (keeping 7 days)..."
find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true

# Rotate weekly backups (keep last 4 weeks)
log "Rotating weekly backups (keeping 4 weeks)..."
find "$BACKUP_DIR/weekly" -mindepth 1 -maxdepth 1 -type d -mtime +28 -exec rm -rf {} \; 2>/dev/null || true

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')

log "=== Backup Summary ==="
log "Databases backed up: $BACKUP_COUNT"
log "Total backup size: $TOTAL_SIZE"

if [ -n "$FAILED_DBS" ]; then
    log "FAILED databases:$FAILED_DBS"
    send_notification "⚠️ <b>Backup Partially Failed</b>\n\nFailed:$FAILED_DBS\nSuccessful: $BACKUP_COUNT databases" "high"
    exit 1
else
    log "All backups successful!"
    # Only send notification on Sundays (weekly summary)
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        send_notification "💾 <b>Weekly Backup Complete</b>\n\n$BACKUP_COUNT databases backed up\nTotal size: $TOTAL_SIZE"
    fi
fi
