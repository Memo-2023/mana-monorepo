#!/bin/sh
set -e

# Skip migrations in Docker - tables are managed via 'pnpm db:push' locally
# For fresh databases, run 'pnpm db:push' manually first
echo "📋 Skipping migrations (run 'pnpm db:push' locally if needed)"

# Start the application
echo "🚀 Starting Mana Core Auth..."
exec node dist/main.js
