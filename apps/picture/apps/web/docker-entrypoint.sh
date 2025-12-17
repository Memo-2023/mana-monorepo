#!/bin/sh
set -e

echo "Generating runtime configuration..."

# Environment variables with development defaults
BACKEND_URL=${BACKEND_URL:-"http://localhost:3006"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}

echo "Config values:"
echo "   BACKEND_URL: $BACKEND_URL"
echo "   AUTH_URL: $AUTH_URL"

# Generate config.json from environment variables
cat > /app/apps/picture/apps/web/build/client/config.json <<EOF
{
  "BACKEND_URL": "${BACKEND_URL}",
  "AUTH_URL": "${AUTH_URL}"
}
EOF

echo "Configuration generated at /app/apps/picture/apps/web/build/client/config.json"
cat /app/apps/picture/apps/web/build/client/config.json

# Remove pre-compressed versions (SvelteKit serves these instead of the raw file)
rm -f /app/apps/picture/apps/web/build/client/config.json.br
rm -f /app/apps/picture/apps/web/build/client/config.json.gz
echo "Removed stale pre-compressed config files"

echo "Starting Picture web app..."
exec "$@"
