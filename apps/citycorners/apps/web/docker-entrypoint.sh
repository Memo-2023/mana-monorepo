#!/bin/sh
set -e

echo "Starting CityCorners Web with runtime configuration..."
echo "PUBLIC_MANA_CORE_AUTH_URL_CLIENT: ${PUBLIC_MANA_CORE_AUTH_URL_CLIENT:-not set}"
echo "PUBLIC_CITYCORNERS_API_URL_CLIENT: ${PUBLIC_CITYCORNERS_API_URL_CLIENT:-not set}"

# Execute the main command
exec "$@"
