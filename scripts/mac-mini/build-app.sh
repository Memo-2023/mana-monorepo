#!/bin/bash
# Build and deploy specific app containers on the Mac Mini
# Automatically frees RAM by stopping monitoring before build
#
# Usage:
#   ./scripts/mac-mini/build-app.sh todo-web
#   ./scripts/mac-mini/build-app.sh todo-web todo-backend
#   ./scripts/mac-mini/build-app.sh --all-web    # rebuild all web apps
#   ./scripts/mac-mini/build-app.sh --base        # rebuild base images only

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
DOCKER="${DOCKER_CMD:-/usr/local/bin/docker}"

# Monitoring services (compose service names)
MONITORING_SERVICES=(
  grafana
  umami
  victoriametrics
  pushgateway
  cadvisor
  postgres-exporter
  redis-exporter
  node-exporter
  vmalert
  alertmanager
  alert-notifier
  glitchtip
  glitchtip-worker
)

# Track if we stopped monitoring
MONITORING_STOPPED=false

cleanup() {
  if [ "$MONITORING_STOPPED" = true ]; then
    echo ""
    echo "=== Restarting monitoring stack ==="
    $DOCKER compose -f "$COMPOSE_FILE" start "${MONITORING_SERVICES[@]}" 2>/dev/null || true
    echo "Monitoring restored."
  fi
}

# Always restart monitoring on exit (success, failure, or interrupt)
trap cleanup EXIT

stop_monitoring() {
  echo "=== Stopping monitoring to free RAM ==="
  $DOCKER compose -f "$COMPOSE_FILE" stop "${MONITORING_SERVICES[@]}" 2>/dev/null || true
  MONITORING_STOPPED=true

  # Also prune dangling build cache
  $DOCKER builder prune -f 2>/dev/null | tail -1 || true
  echo "RAM freed."
  echo ""
}

build_base_images() {
  echo "=== Building sveltekit-base image ==="
  $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.sveltekit-base" -t sveltekit-base:local "$PROJECT_ROOT" 2>&1 | tail -5
  echo "sveltekit-base:local built."
  echo ""

  echo "=== Building nestjs-base image ==="
  $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.nestjs-base" -t nestjs-base:local "$PROJECT_ROOT" 2>&1 | tail -5
  echo "nestjs-base:local built."
  echo ""
}

build_services() {
  local services=("$@")
  echo "=== Building: ${services[*]} ==="
  $DOCKER compose -f "$COMPOSE_FILE" build --no-cache "${services[@]}"
  echo ""
  echo "=== Restarting: ${services[*]} ==="
  $DOCKER compose -f "$COMPOSE_FILE" up -d --no-deps "${services[@]}"
}

# --- Main ---

if [ $# -eq 0 ]; then
  echo "Usage: $0 <service...> | --base | --all-web"
  echo ""
  echo "Examples:"
  echo "  $0 todo-web                    # Build & restart todo web"
  echo "  $0 todo-web todo-backend       # Build & restart both"
  echo "  $0 --base                      # Rebuild base images"
  echo "  $0 --all-web                   # Rebuild all web apps"
  exit 1
fi

cd "$PROJECT_ROOT"

# Pull latest code
echo "=== Pulling latest code ==="
git pull

# Free RAM
stop_monitoring

case "$1" in
  --base)
    build_base_images
    ;;
  --all-web)
    build_base_images
    # Find all web services in compose
    WEB_SERVICES=$($DOCKER compose -f "$COMPOSE_FILE" config --services 2>/dev/null | grep '\-web$' || true)
    if [ -n "$WEB_SERVICES" ]; then
      build_services $WEB_SERVICES
    else
      echo "No web services found."
    fi
    ;;
  *)
    build_services "$@"
    ;;
esac

echo ""
echo "=== Build complete ==="

# Show status of built services
for svc in "$@"; do
  if [ "$svc" != "--base" ] && [ "$svc" != "--all-web" ]; then
    STATUS=$($DOCKER compose -f "$COMPOSE_FILE" ps --format '{{.Name}}\t{{.Status}}' "$svc" 2>/dev/null || echo "$svc: unknown")
    echo "  $STATUS"
  fi
done
