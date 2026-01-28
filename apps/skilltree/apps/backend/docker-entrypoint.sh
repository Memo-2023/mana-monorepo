#!/bin/sh
set -e

echo "Starting SkillTree Backend..."

# Wait for PostgreSQL to be ready
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for PostgreSQL..."

    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    # Default to postgres:5432 if extraction fails
    DB_HOST=${DB_HOST:-postgres}
    DB_PORT=${DB_PORT:-5432}

    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres 2>/dev/null; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 2
    done

    echo "PostgreSQL is ready!"

    # Run database migrations/push
    echo "Pushing database schema..."
    pnpm db:push || echo "Schema push completed (may have no changes)"
fi

echo "Starting server..."
exec "$@"
