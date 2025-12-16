#!/bin/sh
set -e

# Docker Entrypoint for Manacore Web
# Generates runtime config from environment variables
# Implements "build once, configure at runtime" pattern

echo "🔧 Generating runtime configuration..."

# Default values for local development
API_BASE_URL=${API_BASE_URL:-"http://localhost:5173"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}
TODO_API_URL=${TODO_API_URL:-"http://localhost:3018"}
CALENDAR_API_URL=${CALENDAR_API_URL:-"http://localhost:3016"}
CLOCK_API_URL=${CLOCK_API_URL:-"http://localhost:3017"}
CONTACTS_API_URL=${CONTACTS_API_URL:-"http://localhost:3015"}

# Ensure the directory exists (it should from the build, but be safe)
mkdir -p build/client

# Generate config.json from template
cat > build/client/config.json <<EOF
{
  "API_BASE_URL": "${API_BASE_URL}",
  "AUTH_URL": "${AUTH_URL}",
  "TODO_API_URL": "${TODO_API_URL}",
  "CALENDAR_API_URL": "${CALENDAR_API_URL}",
  "CLOCK_API_URL": "${CLOCK_API_URL}",
  "CONTACTS_API_URL": "${CONTACTS_API_URL}"
}
EOF

echo "✅ Runtime configuration generated:"
cat build/client/config.json

# Remove pre-compressed versions (SvelteKit serves these instead of the raw file)
rm -f build/client/config.json.br
rm -f build/client/config.json.gz
echo "🗑️  Removed stale pre-compressed config files"

echo ""
echo "🚀 Starting Node server..."

# Execute the CMD (node build)
exec "$@"
