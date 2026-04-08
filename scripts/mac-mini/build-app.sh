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
  mana-mon-loki
  mana-mon-promtail
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
}

# Returns 0 (true) if the sveltekit-base:local image is older than the most
# recent commit touching any path that would actually change its contents.
#
# Why this exists: per-app web Dockerfiles do `FROM sveltekit-base:local` and
# do NOT re-copy packages/shared-* — those packages are baked into the base
# image. So a change to e.g. packages/shared-utils only reaches the live web
# app if the base image is also rebuilt. We learned this the hard way on
# 2026-04-08 when a CSP fix in shared-utils sat unused in production for an
# hour because every `build-app.sh mana-web` reused the cached base layer.
#
# Detection: compare the base image's Created timestamp against the last git
# commit that touched packages/, the base Dockerfile, or pnpm-lock.yaml. If
# any such commit is newer than the image, the image is stale.
is_base_image_stale() {
  # No image at all → definitely needs building
  if ! $DOCKER image inspect sveltekit-base:local >/dev/null 2>&1; then
    return 0
  fi

  local image_iso image_epoch latest_commit_epoch
  image_iso=$($DOCKER inspect -f '{{.Created}}' sveltekit-base:local 2>/dev/null)

  # Docker on the Mac Mini emits RFC3339 with the *local* TZ offset, e.g.
  # "2026-04-08T18:30:12.871278257+02:00". On Linux it's typically a Z
  # suffix. We strip everything from char 19 onward (fractional + offset),
  # leaving "2026-04-08T18:30:12", and parse it as LOCAL time — which is
  # what the original timestamp meant on this host. The GNU fallback can
  # handle the full string directly because GNU date understands offsets.
  image_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${image_iso:0:19}" +%s 2>/dev/null \
              || date -d "$image_iso" +%s 2>/dev/null \
              || echo 0)

  if [ "$image_epoch" = "0" ]; then
    # Couldn't parse — be conservative and force a rebuild
    return 0
  fi

  # %ct is the committer date as Unix epoch — directly comparable.
  latest_commit_epoch=$(git -C "$PROJECT_ROOT" log -1 --format=%ct -- \
    packages/ \
    docker/Dockerfile.sveltekit-base \
    pnpm-lock.yaml 2>/dev/null || echo 0)

  if [ "$latest_commit_epoch" -gt "$image_epoch" ]; then
    return 0  # stale
  fi
  return 1    # fresh
}

build_services() {
  local services=("$@")

  # Check if any service needs a base image rebuild
  for svc in "${services[@]}"; do
    case "$svc" in
      *-web)
        if is_base_image_stale; then
          if ! $DOCKER image inspect sveltekit-base:local >/dev/null 2>&1; then
            echo "=== Building sveltekit-base (first time) ==="
          else
            local last_commit
            last_commit=$(git -C "$PROJECT_ROOT" log -1 --oneline -- \
              packages/ docker/Dockerfile.sveltekit-base pnpm-lock.yaml 2>/dev/null || echo "?")
            echo "=== Rebuilding sveltekit-base (stale: newer commit touches packages/) ==="
            echo "    Triggering commit: $last_commit"
          fi
          $DOCKER build -f "$PROJECT_ROOT/docker/Dockerfile.sveltekit-base" -t sveltekit-base:local "$PROJECT_ROOT"
          echo ""
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
