#!/bin/sh
set -e

echo "=== NutriPhi Backend Entrypoint ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up!"

cd /app/apps/nutriphi/apps/backend

# Run schema push (non-fatal - app can still start if this fails)
echo "Pushing database schema..."
if npx drizzle-kit push --force; then
  echo "Schema push completed!"
else
  echo "Warning: Schema push failed, continuing anyway..."
fi

# Execute the main command
echo "Starting application..."
exec "$@"
