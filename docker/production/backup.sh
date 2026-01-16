#!/bin/bash
# ManaCore PostgreSQL Backup Script
#
# Usage:
#   ./backup.sh              # Backup all databases
#   ./backup.sh chat         # Backup specific database
#
# Setup cron for daily backups:
#   crontab -e
#   0 3 * * * /opt/manacore/backup.sh >> /var/log/manacore-backup.log 2>&1

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-manacore-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Databases to backup (add more as needed)
DATABASES=("manacore_auth" "chat" "todo" "calendar" "clock")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Timestamp for backup files
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

backup_database() {
    local db_name=$1
    local backup_file="${BACKUP_DIR}/${db_name}_${TIMESTAMP}.sql.gz"

    log_info "Backing up database: $db_name"

    if docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$db_name" 2>/dev/null | gzip > "$backup_file"; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Created: $backup_file ($size)"
        return 0
    else
        log_error "Failed to backup $db_name"
        rm -f "$backup_file"
        return 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    local count=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
    log_info "Remaining backups: $count"
}

# Main execution
log_info "=== ManaCore Backup Started ==="

# Check if specific database requested
if [ $# -eq 1 ]; then
    backup_database "$1"
else
    # Backup all databases
    failed=0
    for db in "${DATABASES[@]}"; do
        if ! backup_database "$db"; then
            ((failed++))
        fi
    done

    if [ $failed -gt 0 ]; then
        log_warn "$failed database(s) failed to backup"
    fi
fi

# Cleanup old backups
cleanup_old_backups

log_info "=== ManaCore Backup Completed ==="

# Summary
echo ""
log_info "Backup summary:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10 || log_warn "No backups found"
