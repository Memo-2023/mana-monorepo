#!/bin/sh
set -e

echo "=== Clock Backend Entrypoint ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up!"

cd /app/apps/clock/apps/backend

# Run schema push
echo "Pushing database schema..."
npx drizzle-kit push --force
echo "Schema push completed!"

# Execute the main command
echo "Starting application..."
exec "$@"
