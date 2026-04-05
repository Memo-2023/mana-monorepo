#!/bin/bash
# Backup script for Mana Monitoring Stack
# - VictoriaMetrics (2 years of metrics)
# - DuckDB (Business KPIs)

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/monitoring}"
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS="${RETENTION_DAYS:-30}"  # Keep backups for 30 days

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

# ============================================
# Backup VictoriaMetrics
# ============================================
backup_victoriametrics() {
    log_info "Creating VictoriaMetrics snapshot..."

    # Create snapshot via API
    SNAPSHOT_RESPONSE=$(curl -s -X POST "http://localhost:8428/snapshot/create")
    SNAPSHOT_NAME=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"snapshot":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$SNAPSHOT_NAME" ]; then
        log_error "Failed to create VictoriaMetrics snapshot"
        echo "$SNAPSHOT_RESPONSE"
        return 1
    fi

    log_info "Snapshot created: $SNAPSHOT_NAME"

    # Copy snapshot to backup directory
    # Note: Adjust path based on your volume mount
    VM_DATA_PATH="/var/lib/docker/volumes/mana-victoriametrics/_data"
    SNAPSHOT_PATH="$VM_DATA_PATH/snapshots/$SNAPSHOT_NAME"

    if [ -d "$SNAPSHOT_PATH" ]; then
        BACKUP_FILE="$BACKUP_DIR/victoriametrics-$DATE.tar.gz"
        log_info "Compressing snapshot to $BACKUP_FILE..."
        tar -czf "$BACKUP_FILE" -C "$VM_DATA_PATH/snapshots" "$SNAPSHOT_NAME"
        log_info "VictoriaMetrics backup complete: $BACKUP_FILE"

        # Delete snapshot after backup
        curl -s -X POST "http://localhost:8428/snapshot/delete?snapshot=$SNAPSHOT_NAME"
        log_info "Snapshot deleted from VictoriaMetrics"
    else
        log_warn "Snapshot directory not found at $SNAPSHOT_PATH"
        log_warn "If using Docker, you may need to run this inside the container"
    fi
}

# ============================================
# Backup DuckDB
# ============================================
backup_duckdb() {
    log_info "Backing up DuckDB analytics database..."

    # DuckDB is a single file, so we can just copy it
    DUCKDB_PATH="/var/lib/docker/volumes/mana-analytics/_data/metrics.duckdb"

    if [ -f "$DUCKDB_PATH" ]; then
        BACKUP_FILE="$BACKUP_DIR/analytics-$DATE.duckdb"
        cp "$DUCKDB_PATH" "$BACKUP_FILE"
        log_info "DuckDB backup complete: $BACKUP_FILE"

        # Also export to Parquet for long-term archival
        PARQUET_FILE="$BACKUP_DIR/analytics-$DATE.parquet"
        if command -v duckdb &> /dev/null; then
            duckdb "$DUCKDB_PATH" -c "COPY daily_metrics TO '$PARQUET_FILE' (FORMAT PARQUET)"
            log_info "Parquet export complete: $PARQUET_FILE"
        else
            log_warn "duckdb CLI not found, skipping Parquet export"
        fi
    else
        log_warn "DuckDB file not found at $DUCKDB_PATH"

        # Try alternative: backup via API
        log_info "Attempting backup via API..."
        curl -s "http://localhost:3001/api/analytics/latest" > "$BACKUP_DIR/analytics-latest-$DATE.json"
        curl -s "http://localhost:3001/api/analytics/growth?days=365" > "$BACKUP_DIR/analytics-growth-$DATE.json"
        log_info "API backup complete"
    fi
}

# ============================================
# Cleanup old backups
# ============================================
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
    log_info "Cleanup complete"
}

# ============================================
# Main
# ============================================
main() {
    log_info "Starting Mana Monitoring Backup"
    log_info "Backup directory: $BACKUP_DIR"
    log_info "Date: $DATE"
    echo ""

    backup_victoriametrics
    echo ""

    backup_duckdb
    echo ""

    cleanup_old_backups
    echo ""

    log_info "All backups complete!"
    log_info "Files in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"
}

# Run main function
main "$@"
