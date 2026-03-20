#!/usr/bin/env bash
# Deploy Metrics Library
# Source this file in CI/CD: source scripts/deploy-metrics.sh
#
# Provides functions for timing, DB inserts, and Pushgateway pushes.

set -euo pipefail

DEPLOY_START_EPOCH=""
PUSHGATEWAY_URL="http://localhost:9091"
PSQL_CMD="docker exec -i mana-infra-postgres psql -U postgres -d mana -tAq"

# ── Timing ──────────────────────────────────────────────────

deploy_timer_start() {
  DEPLOY_START_EPOCH=$(date +%s)
}

deploy_timer_elapsed() {
  local now
  now=$(date +%s)
  echo $(( now - DEPLOY_START_EPOCH ))
}

# ── Docker helpers ──────────────────────────────────────────

# Get image size in MB for a compose service
# Usage: get_image_size_mb <compose-service-name>
get_image_size_mb() {
  local service="$1"
  local size_bytes
  size_bytes=$(docker image inspect "$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" images "$service" -q 2>/dev/null)" --format='{{.Size}}' 2>/dev/null || echo "0")
  echo "scale=2; $size_bytes / 1048576" | bc 2>/dev/null || echo "0"
}

# Health check with retry and timing
# Usage: check_health_timed <service-name> <url>
# Output: <status> <seconds> <http_code>  (e.g. "ok 4.2 200")
check_health_timed() {
  local service="$1"
  local url="$2"
  local timeout=30
  local interval=2
  local start http_code elapsed

  start=$(date +%s)
  while true; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
    elapsed=$(( $(date +%s) - start ))

    if [ "$http_code" = "200" ]; then
      echo "ok ${elapsed}.0 $http_code"
      return 0
    fi

    if [ "$elapsed" -ge "$timeout" ]; then
      echo "failed ${elapsed}.0 $http_code"
      return 1
    fi

    sleep "$interval"
  done
}

# ── Database inserts ────────────────────────────────────────

# Ensure schema exists (idempotent guard)
ensure_deploy_schema() {
  $PSQL_CMD -c "CREATE SCHEMA IF NOT EXISTS deploy_tracking;" 2>/dev/null || true
}

# Insert a deployment row, returns the new id
# Usage: insert_deployment <run_id> <run_attempt> <commit_sha> <commit_message> <branch> <trigger> <deployer> <services_csv> <status>
insert_deployment() {
  local run_id="$1" run_attempt="$2" commit_sha="$3" commit_message="$4"
  local branch="$5" trigger="$6" deployer="$7" services_csv="$8" status="$9"

  # Convert comma-separated to PostgreSQL array literal
  local pg_array
  pg_array=$(echo "$services_csv" | sed "s/,/','/g")

  $PSQL_CMD <<SQL
INSERT INTO deploy_tracking.deployments
  (run_id, run_attempt, commit_sha, commit_message, branch, trigger, deployer, services, status)
VALUES
  ($run_id, $run_attempt, '$commit_sha', '$(echo "$commit_message" | sed "s/'/''/g")', '$branch', '$trigger', '$deployer', ARRAY['$pg_array'], '$status')
RETURNING id;
SQL
}

# Finalise a deployment row
# Usage: finalise_deployment <id> <status> <duration_s>
finalise_deployment() {
  local id="$1" status="$2" duration_s="$3"
  $PSQL_CMD <<SQL
UPDATE deploy_tracking.deployments
SET status = '$status', finished_at = NOW(), duration_s = $duration_s
WHERE id = $id;
SQL
}

# Insert a service row
# Usage: insert_deploy_service <deployment_id> <service_name> <build_duration_s> <image_size_mb> <startup_time_s> <health_status> <health_http_code>
insert_deploy_service() {
  local dep_id="$1" svc="$2" build_dur="$3" img_mb="$4" startup="$5" health="$6" http_code="$7"
  $PSQL_CMD <<SQL
INSERT INTO deploy_tracking.deploy_services
  (deployment_id, service_name, build_duration_s, image_size_mb, startup_time_s, health_status, health_http_code)
VALUES
  ($dep_id, '$svc', $build_dur, $img_mb, $startup, '$health', $http_code);
SQL
}

# ── Pushgateway ─────────────────────────────────────────────

# Push overall deploy metrics
# Usage: push_deploy_metrics <status> <duration_s> <branch>
push_deploy_metrics() {
  local status="$1" duration_s="$2" branch="$3"
  local status_val=0
  [ "$status" = "success" ] && status_val=1

cat <<PROM | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/deploy/branch/${branch}" || true
# TYPE deploy_last_timestamp_seconds gauge
deploy_last_timestamp_seconds $(date +%s)
# TYPE deploy_last_duration_seconds gauge
deploy_last_duration_seconds $duration_s
# TYPE deploy_last_status gauge
deploy_last_status $status_val
PROM
}

# Push per-service metrics
# Usage: push_service_metrics <service> <build_duration_s> <image_size_mb> <healthy>
push_service_metrics() {
  local svc="$1" build_dur="$2" img_mb="$3" healthy="$4"
  local healthy_val=0
  [ "$healthy" = "ok" ] && healthy_val=1

cat <<PROM | curl -s --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/deploy_service/service/${svc}" || true
# TYPE deploy_service_build_duration_seconds gauge
deploy_service_build_duration_seconds $build_dur
# TYPE deploy_service_image_size_mb gauge
deploy_service_image_size_mb $img_mb
# TYPE deploy_service_healthy gauge
deploy_service_healthy $healthy_val
PROM
}
