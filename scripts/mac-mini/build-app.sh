#!/bin/bash
# Build and deploy specific app containers on the Mac Mini
# Checks available memory and only stops monitoring if needed for builds.
#
# Usage:
#   ./scripts/mac-mini/build-app.sh todo-web
#   ./scripts/mac-mini/build-app.sh todo-web todo-backend
#   ./scripts/mac-mini/build-app.sh --all-web    # rebuild all web apps
#   ./scripts/mac-mini/build-app.sh --base        # rebuild base images only
#   ./scripts/mac-mini/build-app.sh --force-free  # always stop monitoring

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
DOCKER="${DOCKER_CMD:-/usr/local/bin/docker}"

# Minimum free memory (in MB) needed for a Docker build
BUILD_MEM_THRESHOLD_MB=3000

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

get_available_memory_mb() {
  # Get Colima VM total memory and current Docker usage
  local vm_total_mb
  vm_total_mb=$(colima list -j 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(int(d[0].get('memory',0) / 1048576))" 2>/dev/null || echo "12288")

  # Sum all container memory usage
  local used_mb
  used_mb=$($DOCKER stats --no-stream --format '{{.MemUsage}}' 2>/dev/null | \
    awk '{
      split($1, a, "/");
      val = a[1];
      gsub(/[[:space:]]/, "", val);
      if (index(val, "GiB") > 0) { gsub(/GiB/, "", val); total += val * 1024; }
      else if (index(val, "MiB") > 0) { gsub(/MiB/, "", val); total += val; }
      else if (index(val, "KiB") > 0) { gsub(/KiB/, "", val); total += val / 1024; }
    } END { printf "%.0f", total }')

  echo $(( vm_total_mb - used_mb ))
}

maybe_stop_monitoring() {
  local force="${1:-false}"

  if [ "$force" = "true" ]; then
    echo "=== Force-freeing RAM (--force-free) ==="
    stop_monitoring_now
    return
  fi

  echo "=== Checking available memory ==="
  local avail_mb
  avail_mb=$(get_available_memory_mb)
  echo "  Available: ${avail_mb} MB (need: ${BUILD_MEM_THRESHOLD_MB} MB)"

  if [ "$avail_mb" -lt "$BUILD_MEM_THRESHOLD_MB" ]; then
    echo "  → Not enough — stopping monitoring to free RAM"
    stop_monitoring_now
  else
    echo "  → Sufficient — monitoring stays running ✓"
    echo ""
    # Still prune build cache
    $DOCKER builder prune -f 2>/dev/null | tail -1 || true
  fi
}

stop_monitoring_now() {
  $DOCKER stop "${MONITORING_CONTAINERS[@]}" 2>/dev/null || true
  MONITORING_STOPPED=true
  $DOCKER builder prune -f 2>/dev/null | tail -1 || true
  echo "  RAM freed."
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
  echo "  $0 --force-free todo-web       # Force stop monitoring before build"
  exit 1
fi

cd "$PROJECT_ROOT"

# Check for --force-free flag
FORCE_FREE=false
ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--force-free" ]; then
    FORCE_FREE=true
  else
    ARGS+=("$arg")
  fi
done
set -- "${ARGS[@]}"

# Pull latest code
echo "=== Pulling latest code ==="
git pull

# Smart memory check — only stop monitoring if needed
maybe_stop_monitoring "$FORCE_FREE"

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
