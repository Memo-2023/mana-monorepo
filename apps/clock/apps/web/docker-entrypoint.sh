#!/bin/sh
set -e

echo "🔧 Generating runtime configuration..."

# Environment variables with development defaults
API_BASE_URL=${API_BASE_URL:-"http://localhost:3017"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}

echo "📝 Config values:"
echo "   API_BASE_URL: $API_BASE_URL"
echo "   AUTH_URL: $AUTH_URL"

# Generate config.json from environment variables
cat > /app/apps/clock/apps/web/build/client/config.json <<EOF
{
  "API_BASE_URL": "${API_BASE_URL}",
  "AUTH_URL": "${AUTH_URL}"
}
EOF

echo "✅ Configuration generated at /app/apps/clock/apps/web/build/client/config.json"
cat /app/apps/clock/apps/web/build/client/config.json

# Remove pre-compressed versions (SvelteKit serves these instead of the raw file)
rm -f /app/apps/clock/apps/web/build/client/config.json.br
rm -f /app/apps/clock/apps/web/build/client/config.json.gz
echo "🗑️  Removed stale pre-compressed config files"

echo "🚀 Starting Clock web app..."
exec "$@"
