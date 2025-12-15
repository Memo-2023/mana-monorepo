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

# Generate config.json from template
cat > /app/build/client/config.json <<EOF
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
cat /app/build/client/config.json

echo ""
echo "🚀 Starting Node server..."

# Execute the CMD (node build)
exec "$@"
