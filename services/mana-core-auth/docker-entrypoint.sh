#!/bin/sh
set -e

# Run database migrations using proper migration files
# This is SAFE - only applies versioned migration files, never drops tables
echo "📋 Running database migrations..."

# Wait for PostgreSQL to be ready (up to 60 seconds)
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # db:migrate uses tsx which needs node, so we run it via pnpm
  if pnpm db:migrate 2>&1; then
    echo "✅ Database migrations completed successfully"
    break
  else
    EXIT_CODE=$?
    RETRY_COUNT=$((RETRY_COUNT + 1))

    # Check if it's a connection error (exit code is typically non-zero for connection issues)
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⏳ Database not ready or migration in progress, retrying in 2 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
      sleep 2
    else
      echo "❌ Failed to run database migrations after $MAX_RETRIES attempts"
      echo "   Exit code: $EXIT_CODE"
      echo "   Check database connectivity and migration files"
      exit 1
    fi
  fi
done

# Start the application
echo "🚀 Starting Mana Core Auth..."
exec node dist/main.js
