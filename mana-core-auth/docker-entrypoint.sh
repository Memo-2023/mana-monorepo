#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Run actual migrations (creates schemas + tables)
pnpm migration:run

echo "✅ Migrations complete"

# Start the application
echo "🚀 Starting Mana Core Auth..."
exec node dist/main.js
