#!/bin/sh
set -e

echo "=== CityCorners Backend Entrypoint ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-manacore} 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up!"

cd /app/apps/citycorners/apps/backend

# Run schema push (for development) or migrations (for production)
if [ "$NODE_ENV" = "production" ] && [ -d "src/db/migrations/meta" ]; then
  echo "Running database migrations..."
  npx tsx src/db/migrate.ts
  echo "Migrations completed!"
else
  echo "Pushing database schema (development mode)..."
  npx drizzle-kit push --force
  echo "Schema push completed!"
fi

# Run seed if seed file exists and SEED_ON_START is set
if [ "$SEED_ON_START" = "true" ] && [ -f "src/db/seed.ts" ]; then
  echo "Running database seed..."
  npx tsx src/db/seed.ts
  echo "Seed completed!"
fi

# Execute the main command
echo "Starting application..."
exec "$@"
