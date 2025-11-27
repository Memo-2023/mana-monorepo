#!/bin/bash

# Database migration script for Supabase projects
# Usage: ./migrate-db.sh [project] [environment]
# Example: ./migrate-db.sh chat staging
# Example: ./migrate-db.sh mana-core-auth production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT=${1}
ENVIRONMENT=${2:-"staging"}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate input
if [ -z "$PROJECT" ]; then
    log_error "Project name is required"
    echo "Usage: ./migrate-db.sh [project] [environment]"
    echo "Available projects: chat, maerchenzauber, manadeck, memoro, picture, nutriphi, news, mana-core-auth"
    exit 1
fi

log_info "Running database migrations for ${PROJECT} (${ENVIRONMENT})..."

# Set Supabase environment variables based on project and environment
case "$PROJECT" in
    "chat")
        if [ "$ENVIRONMENT" == "production" ]; then
            SUPABASE_URL=${CHAT_SUPABASE_URL}
            SUPABASE_SERVICE_KEY=${CHAT_SUPABASE_SERVICE_KEY}
        else
            SUPABASE_URL=${STAGING_CHAT_SUPABASE_URL}
            SUPABASE_SERVICE_KEY=${STAGING_CHAT_SUPABASE_SERVICE_KEY}
        fi
        MIGRATION_DIR="apps/chat/supabase/migrations"
        ;;
    "maerchenzauber")
        if [ "$ENVIRONMENT" == "production" ]; then
            SUPABASE_URL=${MAERCHENZAUBER_SUPABASE_URL}
            SUPABASE_SERVICE_KEY=${MAERCHENZAUBER_SUPABASE_SERVICE_KEY}
        else
            SUPABASE_URL=${STAGING_MAERCHENZAUBER_SUPABASE_URL}
            SUPABASE_SERVICE_KEY=${STAGING_MAERCHENZAUBER_SUPABASE_SERVICE_KEY}
        fi
        MIGRATION_DIR="apps/maerchenzauber/supabase/migrations"
        ;;
    "mana-core-auth")
        if [ "$ENVIRONMENT" == "production" ]; then
            DATABASE_URL=${PRODUCTION_AUTH_DATABASE_URL}
        else
            DATABASE_URL=${STAGING_AUTH_DATABASE_URL}
        fi
        MIGRATION_DIR="services/mana-core-auth/src/db/migrations"

        # Use Drizzle for mana-core-auth
        log_info "Running Drizzle migrations for mana-core-auth..."
        cd services/mana-core-auth
        pnpm run db:migrate
        exit 0
        ;;
    *)
        log_error "Unknown project: $PROJECT"
        exit 1
        ;;
esac

# Check if migration directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
    log_warn "No migrations found for ${PROJECT}"
    exit 0
fi

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed"
    log_info "Install it with: npm install -g supabase"
    exit 1
fi

# Link to remote project
log_info "Linking to Supabase project..."
supabase link --project-ref $(echo $SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

# Run migrations
log_info "Applying migrations from ${MIGRATION_DIR}..."
cd $MIGRATION_DIR

# List pending migrations
log_info "Pending migrations:"
ls -1 *.sql 2>/dev/null || log_info "No SQL migrations found"

# Apply migrations using Supabase CLI
for migration in *.sql; do
    if [ -f "$migration" ]; then
        log_info "Applying migration: $migration"
        supabase db push
    fi
done

log_info "Database migrations completed successfully! ✅"
