#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit push --config drizzle.config.ts --force || echo "Migration failed, continuing anyway..."

# Start the application
echo "Starting Storage Backend..."
exec "$@"
