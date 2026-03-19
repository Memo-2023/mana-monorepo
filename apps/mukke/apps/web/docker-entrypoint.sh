#!/bin/sh
set -e

# This script injects runtime environment variables into the SvelteKit build
# SvelteKit builds env vars at build time, but we need to inject them at runtime
# for Docker deployments where the container runs in different environments

echo "Starting Mukke Web with runtime configuration..."
echo "PUBLIC_MANA_CORE_AUTH_URL_CLIENT: ${PUBLIC_MANA_CORE_AUTH_URL_CLIENT:-not set}"
echo "PUBLIC_BACKEND_URL_CLIENT: ${PUBLIC_BACKEND_URL_CLIENT:-not set}"

# Execute the main command
exec "$@"
