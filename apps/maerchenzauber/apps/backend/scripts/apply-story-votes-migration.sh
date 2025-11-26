#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/../migrations/create_story_votes_table.sql"

echo ""
echo -e "${YELLOW}📋 Story Votes Migration${NC}"
echo "================================"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Migration file found${NC}"
echo ""
echo "Please run this SQL in your Supabase SQL Editor:"
echo ""
echo -e "${YELLOW}1. Go to your Supabase project dashboard${NC}"
echo -e "${YELLOW}2. Navigate to: SQL Editor > New Query${NC}"
echo -e "${YELLOW}3. Copy and paste the following SQL:${NC}"
echo ""
echo "================================================"
cat "$MIGRATION_FILE"
echo "================================================"
echo ""
echo -e "${GREEN}After running the migration, the story voting feature will work!${NC}"
echo ""
