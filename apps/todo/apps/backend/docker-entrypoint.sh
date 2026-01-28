#!/bin/sh
set -e

echo "=========================================="
echo "  Todo Backend Startup"
echo "=========================================="
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3018}"

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database..."

    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    # Default port if not found
    DB_PORT=${DB_PORT:-5432}

    # Wait for database to accept connections
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
            echo "Database is ready!"
            break
        fi
        echo "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "Warning: Could not connect to database after $max_attempts attempts"
    fi
fi

# Push database schema (safe for production - only adds missing tables/columns)
if [ "$RUN_DB_PUSH" = "true" ]; then
    echo "Pushing database schema..."
    npx drizzle-kit push --force || echo "Warning: db:push failed, continuing anyway..."
fi

echo "Starting application..."
exec "$@"
