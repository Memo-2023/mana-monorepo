#!/bin/sh
set -e

echo "🔧 Generating runtime configuration..."

# Environment variables with development defaults
BACKEND_URL=${BACKEND_URL:-"http://localhost:3016"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}

echo "📝 Config values:"
echo "   BACKEND_URL: $BACKEND_URL"
echo "   AUTH_URL: $AUTH_URL"

# Generate config.json from environment variables
cat > /app/apps/calendar/apps/web/build/client/config.json <<EOF
{
  "BACKEND_URL": "${BACKEND_URL}",
  "AUTH_URL": "${AUTH_URL}"
}
EOF

echo "✅ Configuration generated at /app/apps/calendar/apps/web/build/client/config.json"
cat /app/apps/calendar/apps/web/build/client/config.json

echo "🚀 Starting Calendar web app..."
exec "$@"
