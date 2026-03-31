#!/bin/bash

# Setup script for creating databases and pushing schemas
# Usage: ./scripts/setup-databases.sh [service]
# Examples:
#   ./scripts/setup-databases.sh        # Setup all
#   ./scripts/setup-databases.sh chat   # Setup only chat
#   ./scripts/setup-databases.sh auth   # Setup only auth

set -e

# Database connection details (from .env.development)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-manacore}"
DB_PASSWORD="${POSTGRES_PASSWORD:-devpassword}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Database Setup Script${NC}"
echo "======================================"

# Function to create database if it doesn't exist
create_db_if_not_exists() {
    local db_name=$1
    echo -e "${YELLOW}Checking database: ${db_name}${NC}"

    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc \
        "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1; then
        echo -e "  ${GREEN}✓ Exists${NC}"
    else
        echo -e "  Creating database ${db_name}..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $db_name;" > /dev/null
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $DB_USER;" > /dev/null
        echo -e "  ${GREEN}✓ Created${NC}"
    fi
}

# Function to push schema for a service
push_schema() {
    local filter=$1
    local name=$2
    echo -e "${YELLOW}Pushing schema for ${name}...${NC}"
    # Use --force to auto-approve in development (skips interactive prompts)
    if pnpm --filter "$filter" db:push --force 2>/dev/null; then
        echo -e "  ${GREEN}✓ Schema pushed${NC}"
    else
        echo -e "  ${RED}✗ Failed (may not have db:push script)${NC}"
    fi
}

# All databases that should exist
ALL_DATABASES=(
    "manacore"
    "mana_auth"
    "chat"
    "zitare"
    "contacts"
    "calendar"
    "clock"
    "todo"
    "manadeck"
    "storage"
    "presi"
    "moodlit"
    "inventory"
    "planta"
    "nutriphi"
    "photos"
    "projectdoc"
    "zitare_bot"
    "todo_bot"
    "nutriphi_bot"
    "questions"
    "skilltree"
    "mukke"
    "traces"
    "context"
    "citycorners"
    "uload"
    # Hono service databases (extracted from former mana-core-auth)
    "mana_credits"
    "mana_user"
    "mana_subscriptions"
    "mana_analytics"
    "mana_sync"
)

# Check if specific service requested
SERVICE_FILTER=${1:-""}

setup_service() {
    local service=$1

    case $service in
        auth|mana-auth)
            create_db_if_not_exists "mana_auth"
            push_schema "@mana/auth" "mana-auth"
            ;;
        chat)
            create_db_if_not_exists "chat"
            push_schema "@chat/server" "chat"
            ;;
        zitare)
            create_db_if_not_exists "zitare"
            # Schema managed by mana-sync (backend removed)
            ;;
        contacts)
            create_db_if_not_exists "contacts"
            # Schema managed by mana-sync (local-first)
            ;;
        calendar)
            create_db_if_not_exists "calendar"
            # Schema managed by mana-sync (local-first)
            ;;
        clock)
            create_db_if_not_exists "clock"
            # Schema managed by mana-sync (backend removed)
            ;;
        todo)
            create_db_if_not_exists "todo"
            push_schema "@todo/server" "todo"
            ;;
        manadeck)
            create_db_if_not_exists "manadeck"
            # Schema managed by mana-sync (local-first)
            ;;
        moodlit)
            create_db_if_not_exists "moodlit"
            push_schema "@moodlit/server" "moodlit"
            ;;
        picture)
            create_db_if_not_exists "picture"
            # Schema managed by mana-sync (local-first)
            ;;
        photos)
            create_db_if_not_exists "photos"
            # Schema managed by mana-sync (backend removed)
            ;;
        planta)
            create_db_if_not_exists "planta"
            push_schema "@planta/server" "planta"
            ;;
        nutriphi)
            create_db_if_not_exists "nutriphi"
            # Schema managed by mana-sync (local-first)
            ;;
        presi)
            create_db_if_not_exists "presi"
            # Schema managed by mana-sync (NestJS backend removed, Hono server for shares)
            ;;
        storage)
            create_db_if_not_exists "storage"
            # Schema managed by mana-sync (local-first)
            ;;
        projectdoc)
            create_db_if_not_exists "projectdoc"
            push_schema "@manacore/telegram-project-doc-bot" "projectdoc"
            ;;
        zitare_bot|zitare-bot)
            create_db_if_not_exists "zitare_bot"
            push_schema "@manacore/telegram-zitare-bot" "zitare-bot"
            ;;
        todo_bot|todo-bot)
            create_db_if_not_exists "todo_bot"
            push_schema "@manacore/telegram-todo-bot" "todo-bot"
            ;;
        nutriphi_bot|nutriphi-bot)
            create_db_if_not_exists "nutriphi_bot"
            push_schema "@manacore/telegram-nutriphi-bot" "nutriphi-bot"
            ;;
        questions)
            create_db_if_not_exists "questions"
            # Schema managed by mana-sync (local-first)
            ;;
        skilltree)
            create_db_if_not_exists "skilltree"
            # Schema managed by mana-sync (backend removed)
            ;;
        mukke)
            create_db_if_not_exists "mukke"
            push_schema "@mukke/server" "mukke"
            ;;
        traces)
            create_db_if_not_exists "traces"
            push_schema "@traces/server" "traces"
            ;;
        context)
            create_db_if_not_exists "context"
            push_schema "@context/server" "context"
            ;;
        citycorners)
            create_db_if_not_exists "citycorners"
            # Schema managed by mana-sync (backend removed)
            ;;
        uload)
            create_db_if_not_exists "uload"
            # Schema managed by mana-sync (local-first app)
            ;;
        *)
            echo -e "${RED}Unknown service: $service${NC}"
            echo "Available services: auth, chat, zitare, contacts, calendar, clock, todo, manadeck, moodlit, picture, photos, planta, nutriphi, presi, storage, projectdoc, zitare_bot, todo_bot, nutriphi_bot, questions, skilltree, mukke, traces, context, citycorners, uload"
            exit 1
            ;;
    esac
}

if [ -n "$SERVICE_FILTER" ]; then
    echo -e "Setting up for service: ${SERVICE_FILTER}"
    setup_service "$SERVICE_FILTER"
    echo -e "\n${GREEN}✓ Setup complete!${NC}"
    exit 0
fi

# Setup all databases
echo -e "\n${GREEN}Step 1: Creating databases${NC}"
echo "--------------------------------------"
for db in "${ALL_DATABASES[@]}"; do
    create_db_if_not_exists "$db"
done

echo -e "\n${GREEN}Step 2: Pushing schemas${NC}"
echo "--------------------------------------"

# Push schemas for all known services
for service in auth chat zitare contacts calendar clock todo manadeck picture photos moodlit planta nutriphi presi storage questions skilltree mukke traces context citycorners; do
    setup_service "$service" 2>/dev/null || true
done

echo -e "\n${GREEN}✓ Database setup complete!${NC}"
