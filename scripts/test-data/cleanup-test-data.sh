#!/bin/bash
# Cleanup Test Data
#
# Removes test data from databases after test execution.
# Can be used to reset databases to a clean state.
#
# Usage:
#   ./scripts/test-data/cleanup-test-data.sh [service]
#
# Examples:
#   ./scripts/test-data/cleanup-test-data.sh              # Clean all services
#   ./scripts/test-data/cleanup-test-data.sh auth         # Clean auth only

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE_FILTER=${1:-"all"}

echo -e "${YELLOW}Cleaning up test data...${NC}"

# Configuration
export NODE_ENV="test"
export DATABASE_URL_TEMPLATE="postgresql://manacore:devpassword@localhost:5432"

# Cleanup function
cleanup_database() {
  local db_name=$1

  echo -e "\n${YELLOW}Cleaning database: ${db_name}${NC}"

  export DATABASE_URL="${DATABASE_URL_TEMPLATE}/${db_name}"

  # Drop and recreate database
  psql -U manacore -h localhost -c "DROP DATABASE IF EXISTS ${db_name};" postgres 2>/dev/null || true
  psql -U manacore -h localhost -c "CREATE DATABASE ${db_name};" postgres 2>/dev/null || true

  echo -e "${GREEN}✓ Cleaned ${db_name}${NC}"
}

# Execute cleanup based on filter
case "$SERVICE_FILTER" in
  "all")
    cleanup_database "manacore"
    cleanup_database "chat"
    cleanup_database "todo"
    cleanup_database "calendar"
    cleanup_database "contacts"
    cleanup_database "picture"
    ;;
  "auth")
    cleanup_database "manacore"
    ;;
  "chat")
    cleanup_database "chat"
    ;;
  "todo")
    cleanup_database "todo"
    ;;
  "calendar")
    cleanup_database "calendar"
    ;;
  "contacts")
    cleanup_database "contacts"
    ;;
  "picture")
    cleanup_database "picture"
    ;;
  *)
    echo -e "${RED}Unknown service: $SERVICE_FILTER${NC}"
    echo "Available services: all, auth, chat, todo, calendar, contacts, picture"
    exit 1
    ;;
esac

echo -e "\n${GREEN}✓ Test data cleaned up successfully!${NC}"
