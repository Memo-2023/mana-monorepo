#!/bin/bash
# Mana Disk Space Monitor
# Checks disk usage on system and data volumes
# Alerts via Telegram/ntfy when thresholds are exceeded
#
# Thresholds:
#   - Warning: 80%
#   - Critical: 90%
#
# Run via LaunchD hourly

set -e

# Ensure PATH includes required tools
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="/tmp/mana-disk-check.log"

# Thresholds
WARNING_THRESHOLD=80
CRITICAL_THRESHOLD=90

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
        local ntfy_priority="default"
        [ "$priority" = "high" ] && ntfy_priority="high"
        [ "$priority" = "critical" ] && ntfy_priority="urgent"

        curl -s -d "$message" \
            -H "Title: Mana Disk Alert" \
            -H "Priority: $ntfy_priority" \
            -H "Tags: warning" \
            "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1 || true
    fi
}

PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://localhost:9091}"

push_disk_metrics() {
    local disk_label="$1"
    local mount_point="$2"
    local usage_pct="$3"
    local avail_human="$4"
    local avail_bytes="${5:-0}"
    local size_bytes="${6:-0}"

    cat <<PROMEOF | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/mac_disk/disk/${disk_label}" >/dev/null 2>&1 || true
# HELP mac_disk_used_percent Disk usage percent on macOS host
# TYPE mac_disk_used_percent gauge
mac_disk_used_percent{disk="${disk_label}",mountpoint="${mount_point}",avail_human="${avail_human}"} ${usage_pct}
# HELP mac_disk_avail_bytes Disk available bytes on macOS host
# TYPE mac_disk_avail_bytes gauge
mac_disk_avail_bytes{disk="${disk_label}",mountpoint="${mount_point}"} ${avail_bytes}
# HELP mac_disk_size_bytes Total disk size bytes on macOS host
# TYPE mac_disk_size_bytes gauge
mac_disk_size_bytes{disk="${disk_label}",mountpoint="${mount_point}"} ${size_bytes}
PROMEOF
}

push_colima_metrics() {
    local colima_disk="/Users/mana/.colima/_lima/_disks/colima/datadisk"
    [ -f "$colima_disk" ] || return 0
    local used_kb
    used_kb=$(du -sk "$colima_disk" 2>/dev/null | awk '{print $1}')
    local used_gb
    used_gb=$(awk "BEGIN {printf \"%.1f\", ${used_kb:-0} / 1048576}")
    cat <<PROMEOF | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/mac_disk/disk/colima" >/dev/null 2>&1 || true
# HELP mac_colima_disk_used_gb Colima VM datadisk actual on-disk usage in GB
# TYPE mac_colima_disk_used_gb gauge
mac_colima_disk_used_gb ${used_gb}
PROMEOF
    log "Colima VM disk: ${used_gb}GB on disk"
}

check_disk() {
    local mount_point="$1"
    local name="$2"
    local disk_label="${3:-}"

    # Check if mount point exists
    if [ ! -d "$mount_point" ]; then
        log "WARNING: Mount point $mount_point does not exist"
        return 1
    fi

    # Get disk usage percentage (macOS compatible)
    local usage
    usage=$(df -h "$mount_point" 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}')

    if [ -z "$usage" ]; then
        log "ERROR: Could not get disk usage for $mount_point"
        return 1
    fi

    # Get available and total space
    local available
    available=$(df -h "$mount_point" 2>/dev/null | awk 'NR==2 {print $4}')
    local avail_bytes size_bytes
    avail_bytes=$(df "$mount_point" 2>/dev/null | awk 'NR==2 {print $4 * 512}')
    size_bytes=$(df "$mount_point" 2>/dev/null | awk 'NR==2 {print $2 * 512}')

    log "$name: ${usage}% used (${available} free)"

    # Push metrics to Pushgateway → Prometheus → vmalert → Telegram
    if [ -n "$disk_label" ]; then
        push_disk_metrics "$disk_label" "$mount_point" "$usage" "$available" "${avail_bytes:-0}" "${size_bytes:-0}"
    fi

    # Check thresholds
    if [ "$usage" -ge "$CRITICAL_THRESHOLD" ]; then
        log "CRITICAL: $name at ${usage}%!"
        send_notification "🚨 <b>CRITICAL: Disk Space</b>

<b>$name</b> is at <b>${usage}%</b>
Available: ${available}

Immediate action required!" "critical"
        return 2
    elif [ "$usage" -ge "$WARNING_THRESHOLD" ]; then
        log "WARNING: $name at ${usage}%"
        send_notification "⚠️ <b>WARNING: Disk Space</b>

<b>$name</b> is at <b>${usage}%</b>
Available: ${available}

Consider cleaning up old files." "high"
        return 1
    fi

    return 0
}

check_docker_disk() {
    # Check Docker disk usage
    if ! command -v docker &> /dev/null; then
        log "Docker not found in PATH"
        return 0
    fi

    if ! docker info >/dev/null 2>&1; then
        log "Docker is not running"
        return 0
    fi

    # Get Docker disk usage
    local docker_usage
    docker_usage=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1)

    log "Docker disk usage: $docker_usage"

    # Check for dangling images and unused volumes
    local dangling_images
    dangling_images=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l | tr -d ' ')

    local unused_volumes
    unused_volumes=$(docker volume ls -f "dangling=true" -q 2>/dev/null | wc -l | tr -d ' ')

    log "Docker: $dangling_images dangling images, $unused_volumes unused volumes"

    # Always clean up dangling images (old build layers, no longer referenced)
    if [ "$dangling_images" -gt 0 ]; then
        log "Removing $dangling_images dangling images..."
        docker image prune -f 2>/dev/null | tail -1
    fi

    # Always clean up unused volumes (orphans from removed containers)
    if [ "$unused_volumes" -gt 0 ]; then
        log "Removing $unused_volumes unused volumes..."
        docker volume prune -f 2>/dev/null | tail -1
    fi

    # Clean build cache older than 7 days
    local build_cache
    build_cache=$(docker system df --format '{{.Size}}' 2>/dev/null | tail -1)
    log "Docker build cache: $build_cache"
    docker builder prune -f --filter until=168h 2>/dev/null | tail -1

    # Emergency: full prune if system disk critical
    local system_usage
    system_usage=$(df -h / 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}')
    if [ "$system_usage" -ge "$CRITICAL_THRESHOLD" ]; then
        log "CRITICAL disk usage at ${system_usage}% — running aggressive Docker cleanup..."
        docker system prune -af --filter until=48h 2>/dev/null | tail -1
        log "Aggressive cleanup completed"
    fi
}

check_postgres_backups() {
    local backup_dir="/Volumes/ManaData/backups/postgres"

    if [ ! -d "$backup_dir" ]; then
        return 0
    fi

    # Get backup directory size
    local backup_size
    backup_size=$(du -sh "$backup_dir" 2>/dev/null | awk '{print $1}')

    log "PostgreSQL backups: $backup_size"

    # Count old backups (older than 30 days in daily folder)
    local old_backups
    old_backups=$(find "$backup_dir/daily" -name "*.sql.gz" -mtime +30 2>/dev/null | wc -l | tr -d ' ')

    if [ "$old_backups" -gt 0 ]; then
        log "Note: $old_backups old daily backups could be cleaned up"
    fi
}

check_stale_node_modules() {
    # node_modules on the server is never needed — Docker builds inside containers
    # If someone accidentally ran pnpm install, clean it up
    local monorepo_nm="$PROJECT_ROOT/node_modules"
    if [ -d "$monorepo_nm" ]; then
        local nm_size
        nm_size=$(du -sh "$monorepo_nm" 2>/dev/null | awk '{print $1}')
        log "WARNING: Found node_modules on server (${nm_size}), removing..."
        rm -rf "$monorepo_nm"
        # Also remove nested node_modules
        find "$PROJECT_ROOT" -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
        log "Removed all node_modules from server"
    fi
}

check_docker_logs() {
    # Check for large Docker log files
    local docker_logs_dir="/var/lib/docker/containers"

    # On macOS with Docker Desktop, logs are in the VM
    # We can check via docker inspect instead
    if ! docker info >/dev/null 2>&1; then
        return 0
    fi

    # Get containers with largest log sizes
    local large_logs=0
    for container in $(docker ps -q 2>/dev/null); do
        local log_size
        log_size=$(docker inspect "$container" --format '{{.LogPath}}' 2>/dev/null | xargs -I {} docker run --rm -v /var/lib/docker:/var/lib/docker:ro alpine stat -c%s {} 2>/dev/null || echo "0")

        # Convert to MB (if size > 100MB, flag it)
        if [ "$log_size" -gt 104857600 ] 2>/dev/null; then
            local container_name
            container_name=$(docker inspect "$container" --format '{{.Name}}' 2>/dev/null | tr -d '/')
            log "Large log file: $container_name ($(($log_size / 1048576))MB)"
            large_logs=$((large_logs + 1))
        fi
    done 2>/dev/null || true

    if [ "$large_logs" -gt 0 ]; then
        log "Found $large_logs containers with large log files"
    fi
}

# Main execution
log "=== Mana Disk Space Check ==="

ALERT_STATUS=0

# Check system disk (internal SSD)
check_disk "/" "System Disk" "internal" || ALERT_STATUS=$?

# Check ManaData volume (external SSD)
if [ -d "/Volumes/ManaData" ]; then
    check_disk "/Volumes/ManaData" "ManaData SSD" "manaData" || ALERT_STATUS=$?
fi

# Push Colima VM disk metrics
push_colima_metrics

# Remove accidental node_modules on server
check_stale_node_modules

# Check Docker disk usage + auto-prune
check_docker_disk

# Check backup sizes
check_postgres_backups

# Summary
log "=== Check Complete ==="

if [ "$ALERT_STATUS" -eq 2 ]; then
    log "Status: CRITICAL - Immediate action required"
    exit 2
elif [ "$ALERT_STATUS" -eq 1 ]; then
    log "Status: WARNING - Attention needed"
    exit 1
else
    log "Status: OK - All disks within thresholds"
    exit 0
fi
