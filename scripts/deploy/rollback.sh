#!/bin/bash

# Rollback script for emergency deployment rollback
# Usage: ./rollback.sh [environment] [service]
# Example: ./rollback.sh production all
# Example: ./rollback.sh staging chat-backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${1:-"staging"}
SERVICE=${2:-"all"}

# Environment-specific variables
if [ "$ENVIRONMENT" == "production" ]; then
    SSH_HOST=${PRODUCTION_HOST}
    SSH_USER=${PRODUCTION_USER}
    SSH_KEY=${PRODUCTION_SSH_KEY}
    DEPLOY_DIR="~/manacore-production"
else
    SSH_HOST=${STAGING_HOST}
    SSH_USER=${STAGING_USER}
    SSH_KEY=${STAGING_SSH_KEY}
    DEPLOY_DIR="~/manacore-staging"
fi

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate required variables
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
    log_error "SSH configuration missing for ${ENVIRONMENT}"
    exit 1
fi

# SSH command helper
ssh_exec() {
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" "$@"
    else
        ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" "$@"
    fi
}

log_warn "⚠️  ROLLBACK INITIATED ⚠️"
log_info "Environment: ${ENVIRONMENT}"
log_info "Service: ${SERVICE}"
echo ""

# Confirm rollback
read -p "Are you sure you want to rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

echo ""
log_info "Starting rollback process..."

# Step 1: Check for previous deployment backup
log_info "Checking for previous deployment backup..."
ssh_exec << EOF
    cd ${DEPLOY_DIR}

    if [ ! -d "backups" ] || [ -z "\$(ls -A backups)" ]; then
        echo "ERROR: No backups found!"
        exit 1
    fi

    # Get latest backup
    LATEST_BACKUP=\$(ls -t backups | head -1)
    echo "Latest backup found: \$LATEST_BACKUP"

    cd backups/\$LATEST_BACKUP

    # Verify backup contents
    if [ ! -f "docker-compose.yml" ]; then
        echo "ERROR: Backup incomplete - missing docker-compose.yml"
        exit 1
    fi

    echo "Backup validated"
EOF

# Step 2: Stop current services
log_info "Stopping current services..."
ssh_exec << EOF
    cd ${DEPLOY_DIR}
    docker compose stop ${SERVICE}
EOF

# Step 3: Restore from backup
log_info "Restoring from backup..."
ssh_exec << EOF
    cd ${DEPLOY_DIR}

    LATEST_BACKUP=\$(ls -t backups | head -1)

    # Restore docker-compose file
    cp backups/\$LATEST_BACKUP/docker-compose.yml ./docker-compose.yml

    # Restore environment file if exists
    if [ -f "backups/\$LATEST_BACKUP/.env.backup" ]; then
        cp backups/\$LATEST_BACKUP/.env.backup ./.env
    fi

    echo "Files restored from backup: \$LATEST_BACKUP"
EOF

# Step 4: Restore database if service is auth
if [ "$SERVICE" == "all" ] || [ "$SERVICE" == "mana-core-auth" ]; then
    log_info "Restoring database..."
    ssh_exec << EOF
        cd ${DEPLOY_DIR}

        LATEST_BACKUP=\$(ls -t backups | head -1)

        if [ -f "backups/\$LATEST_BACKUP/postgres_backup.sql" ]; then
            # Restore PostgreSQL backup
            docker compose exec -T postgres psql -U \$POSTGRES_USER < backups/\$LATEST_BACKUP/postgres_backup.sql
            echo "Database restored"
        else
            echo "WARNING: No database backup found"
        fi
EOF
fi

# Step 5: Start services with previous images
log_info "Starting services with previous configuration..."
ssh_exec << EOF
    cd ${DEPLOY_DIR}

    # Get image tags from backup
    LATEST_BACKUP=\$(ls -t backups | head -1)

    if [ -f "backups/\$LATEST_BACKUP/deployment_images.txt" ]; then
        echo "Previous deployment images:"
        cat backups/\$LATEST_BACKUP/deployment_images.txt
    fi

    # Start services
    docker compose up -d ${SERVICE}

    # Wait for services to start
    sleep 20
EOF

# Step 6: Health checks
log_info "Running health checks after rollback..."

HEALTH_ENDPOINTS=(
    "mana-core-auth:3001:/api/v1/health"
    "maerchenzauber-backend:3002:/health"
    "chat-backend:3002:/api/health"
)

FAILED_CHECKS=0

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    IFS=':' read -r service port path <<< "$endpoint"

    if ssh_exec << EOF
        HEALTH=\$(docker compose -f ${DEPLOY_DIR}/docker-compose.yml exec -T ${service} wget -q -O - http://localhost:${port}${path} 2>/dev/null || echo "FAILED")

        if [[ "\$HEALTH" == *"FAILED"* ]]; then
            exit 1
        else
            exit 0
        fi
EOF
    then
        log_info "✅ ${service} is healthy"
    else
        log_warn "⚠️  ${service} health check failed"
        ((FAILED_CHECKS++))
    fi
done

echo ""

# Step 7: Display service status
log_info "Current service status:"
ssh_exec << EOF
    cd ${DEPLOY_DIR}
    docker compose ps
EOF

echo ""

# Final result
if [ $FAILED_CHECKS -eq 0 ]; then
    log_info "Rollback completed successfully! ✅"
    log_info "Services have been restored to previous version"
    exit 0
else
    log_error "Rollback completed with ${FAILED_CHECKS} failed health checks"
    log_warn "Manual intervention may be required"
    exit 1
fi
