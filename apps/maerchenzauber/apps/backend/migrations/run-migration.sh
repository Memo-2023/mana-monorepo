#!/bin/bash

# Run migration to add is_favorite column to stories table
# This script connects to Supabase and runs the migration

# Source environment variables from backend
cd "$(dirname "$0")/.."

# Get Supabase credentials from environment
SUPABASE_URL="${MAERCHENZAUBER_SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: Supabase credentials not found in environment"
    echo "Please ensure MAERCHENZAUBER_SUPABASE_URL and MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY are set"
    exit 1
fi

echo "🔄 Running migration: add_is_favorite_to_stories.sql"
echo "📍 Supabase URL: $SUPABASE_URL"

# Extract database connection details
DB_HOST=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co.*|\1.supabase.co|')
DB_NAME="postgres"
DB_USER="postgres"

# Use psql to run the migration
export PGPASSWORD="$SUPABASE_SERVICE_KEY"

psql -h "db.${DB_HOST}" \
     -U "$DB_USER" \
     -d "$DB_NAME" \
     -f migrations/add_is_favorite_to_stories.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed"
    exit 1
fi
