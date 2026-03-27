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

# Monitoring containers (by container name — more reliable than compose service names)
MONITORING_CONTAINERS=(
  mana-mon-grafana
  mana-mon-umami
  mana-mon-victoria
  mana-mon-pushgateway
  mana-mon-cadvisor
  mana-mon-postgres-exporter
  mana-mon-redis-exporter
  mana-mon-node-exporter
  mana-mon-vmalert
  mana-mon-alertmanager
  mana-mon-alert-notifier
  mana-mon-glitchtip
  mana-mon-glitchtip-worker
)

# Track if we stopped monitoring
MONITORING_STOPPED=false

cleanup() {
  if [ "$MONITORING_STOPPED" = true ]; then
    echo ""
    echo "=== Restarting monitoring stack ==="
    $DOCKER start "${MONITORING_CONTAINERS[@]}" 2>/dev/null || true
    echo "Monitoring restored."
  fi
}

# Always restart monitoring on exit (success, failure, or interrupt)
trap cleanup EXIT

stop_monitoring() {
  echo "=== Stopping monitoring to free RAM ==="
  $DOCKER stop "${MONITORING_CONTAINERS[@]}" 2>/dev/null || true
  MONITORING_STOPPED=true

  # Also prune dangling build cache
  $DOCKER builder prune -f 2>/dev/null | tail -1 || true
  echo "RAM freed."
  echo ""
}

build_base_images() {
  echo "=== Building sveltekit-base image ==="
  $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.sveltekit-base" -t sveltekit-base:local "$PROJECT_ROOT"
  echo "sveltekit-base:local built."
  echo ""

  echo "=== Building nestjs-base image ==="
  $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.nestjs-base" -t nestjs-base:local "$PROJECT_ROOT"
  echo "nestjs-base:local built."
  echo ""
}

build_services() {
  local services=("$@")

  # Check if any service needs a base image rebuild
  for svc in "${services[@]}"; do
    case "$svc" in
      *-web)
        if ! $DOCKER image inspect sveltekit-base:local >/dev/null 2>&1; then
          echo "=== Building sveltekit-base (first time) ==="
          $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.sveltekit-base" -t sveltekit-base:local "$PROJECT_ROOT"
        fi
        break
        ;;
    esac
  done

  echo "=== Building: ${services[*]} ==="
  $DOCKER compose -f "$COMPOSE_FILE" build --no-cache "${services[@]}" 2>&1
  echo ""
  echo "=== Restarting: ${services[*]} ==="
  $DOCKER compose -f "$COMPOSE_FILE" up -d --no-deps "${services[@]}" 2>&1
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
  echo "  $0 mana-matrix-bot             # Build & restart consolidated Matrix bot (Go)"
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
