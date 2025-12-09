#!/bin/sh
set -e

echo "Starting Todo Backend..."
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3018}"

exec "$@"
