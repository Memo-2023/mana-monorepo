#!/bin/bash
# ManaCore PostgreSQL Restore Script
#
# Usage:
#   ./restore.sh chat backups/chat_20250116_030000.sql.gz
#
# WARNING: This will OVERWRITE the existing database!

set -euo pipefail

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-manacore-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Validate arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <database_name> <backup_file.sql.gz>"
    echo "Example: $0 chat backups/chat_20250116_030000.sql.gz"
    exit 1
fi

DB_NAME=$1
BACKUP_FILE=$2

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restoration
echo ""
log_warn "WARNING: This will OVERWRITE the database '$DB_NAME'!"
log_warn "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled."
    exit 0
fi

log_info "=== ManaCore Restore Started ==="

# Create backup of current state before restore
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
CURRENT_BACKUP="./backups/${DB_NAME}_pre_restore_${TIMESTAMP}.sql.gz"

log_info "Creating backup of current state..."
docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$DB_NAME" 2>/dev/null | gzip > "$CURRENT_BACKUP" || true
log_info "Current state backed up to: $CURRENT_BACKUP"

# Drop and recreate database
log_info "Dropping and recreating database: $DB_NAME"
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
log_info "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" "$DB_NAME"

log_info "=== ManaCore Restore Completed ==="
log_info "Database '$DB_NAME' has been restored from $BACKUP_FILE"
log_info "Previous state saved to: $CURRENT_BACKUP"
