#!/bin/bash

# Deploy to Hetzner server via SSH
# Usage: ./deploy-hetzner.sh [environment] [service]
# Example: ./deploy-hetzner.sh staging all
# Example: ./deploy-hetzner.sh production chat-backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-"staging"}
SERVICE=${2:-"all"}

# Environment-specific variables
if [ "$ENVIRONMENT" == "production" ]; then
    SSH_HOST=${PRODUCTION_HOST}
    SSH_USER=${PRODUCTION_USER}
    SSH_KEY=${PRODUCTION_SSH_KEY}
    DEPLOY_DIR="~/manacore-production"
    COMPOSE_FILE="docker-compose.production.yml"
else
    SSH_HOST=${STAGING_HOST}
    SSH_USER=${STAGING_USER}
    SSH_KEY=${STAGING_SSH_KEY}
    DEPLOY_DIR="~/manacore-staging"
    COMPOSE_FILE="docker-compose.staging.yml"
fi

# Function to print colored output
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
    log_error "Please set: ${ENVIRONMENT^^}_HOST and ${ENVIRONMENT^^}_USER"
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

# SCP command helper
scp_copy() {
    if [ -n "$SSH_KEY" ]; then
        scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$@"
    else
        scp -o StrictHostKeyChecking=no "$@"
    fi
}

log_info "Starting deployment to ${ENVIRONMENT}..."
log_info "Target: ${SSH_USER}@${SSH_HOST}"
log_info "Service: ${SERVICE}"
echo ""

# Step 1: Prepare deployment directory
log_info "Preparing deployment directory..."
ssh_exec << EOF
    mkdir -p ${DEPLOY_DIR}
    mkdir -p ${DEPLOY_DIR}/logs
    mkdir -p ${DEPLOY_DIR}/backups
    cd ${DEPLOY_DIR}
EOF

# Step 2: Copy docker-compose file
log_info "Copying docker-compose configuration..."
scp_copy "${COMPOSE_FILE}" "${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/docker-compose.yml"

# Step 3: Copy environment file if exists
if [ -f ".env.${ENVIRONMENT}" ]; then
    log_info "Copying environment configuration..."
    scp_copy ".env.${ENVIRONMENT}" "${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/.env"
else
    log_warn "No .env.${ENVIRONMENT} file found, using existing environment"
fi

# Step 4: Pull latest images
log_info "Pulling latest Docker images..."
ssh_exec << EOF
    cd ${DEPLOY_DIR}
    docker compose pull ${SERVICE}
EOF

# Step 5: Run migrations if needed
if [ "$SERVICE" == "all" ] || [ "$SERVICE" == "mana-core-auth" ]; then
    log_info "Running database migrations..."
    ssh_exec << EOF
        cd ${DEPLOY_DIR}
        docker compose run --rm mana-core-auth pnpm run db:migrate || echo "Migrations completed or skipped"
EOF
fi

# Step 6: Deploy services
log_info "Deploying services..."
if [ "$SERVICE" == "all" ]; then
    # Zero-downtime rolling update for all services
    ssh_exec << 'EOF'
        cd ${DEPLOY_DIR}

        SERVICES=$(docker compose config --services)

        for service in $SERVICES; do
            echo "Deploying $service..."

            # Scale up with new version
            docker compose up -d --no-deps --scale $service=2 $service
            sleep 15

            # Scale down to single instance
            docker compose up -d --no-deps --scale $service=1 $service
            sleep 5
        done

        # Cleanup old images
        docker image prune -f
EOF
else
    # Deploy single service
    ssh_exec << EOF
        cd ${DEPLOY_DIR}
        docker compose up -d --no-deps ${SERVICE}
        sleep 10
EOF
fi

# Step 7: Health checks
log_info "Running health checks..."
HEALTH_ENDPOINTS=(
    "mana-core-auth:3001:/api/v1/health"
    "maerchenzauber-backend:3002:/health"
    "chat-backend:3002:/api/health"
)

FAILED_CHECKS=0

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    IFS=':' read -r service port path <<< "$endpoint"

    log_info "Checking health of ${service}..."

    if ssh_exec << EOF
        HEALTH=\$(docker compose -f ${DEPLOY_DIR}/docker-compose.yml exec -T ${service} wget -q -O - http://localhost:${port}${path} 2>/dev/null || echo "FAILED")

        if [[ "\$HEALTH" == *"FAILED"* ]]; then
            echo "Health check failed for ${service}"
            exit 1
        else
            echo "Health check passed for ${service}"
            exit 0
        fi
EOF
    then
        log_info "✅ ${service} is healthy"
    else
        log_error "❌ ${service} health check failed"
        ((FAILED_CHECKS++))
    fi
done

echo ""

# Step 8: Display service status
log_info "Current service status:"
ssh_exec << EOF
    cd ${DEPLOY_DIR}
    docker compose ps
EOF

echo ""

# Final result
if [ $FAILED_CHECKS -eq 0 ]; then
    log_info "Deployment to ${ENVIRONMENT} completed successfully! ✅"
    exit 0
else
    log_error "Deployment completed with ${FAILED_CHECKS} failed health checks"
    log_warn "Please check service logs with: ssh ${SSH_USER}@${SSH_HOST} 'cd ${DEPLOY_DIR} && docker compose logs'"
    exit 1
fi
