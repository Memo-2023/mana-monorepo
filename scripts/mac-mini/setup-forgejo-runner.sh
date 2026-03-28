#!/bin/bash
# Register Forgejo Runner on Mac Mini
# Run after Forgejo is up and admin user exists
set -e

DOCKER="${DOCKER_CMD:-/usr/local/bin/docker}"
FORGEJO_URL="http://localhost:3041"
FORGEJO_PUBLIC_URL="https://git.mana.how"

# Step 1: Get runner registration token from Forgejo API
echo "=== Getting runner registration token ==="
API_TOKEN=$(cat /Volumes/ManaData/forgejo-api-token 2>/dev/null || echo "")
if [ -z "$API_TOKEN" ]; then
    echo "No API token found. Generate one:"
    echo "  $DOCKER exec --user git mana-core-forgejo forgejo admin user generate-access-token --username till --token-name runner-setup --scopes all"
    echo "  Save to: /Volumes/ManaData/forgejo-api-token"
    exit 1
fi

RUNNER_TOKEN=$(curl -s -X POST "$FORGEJO_URL/api/v1/user/actions/runners/registration-token" \
    -H "Authorization: token $API_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Runner token: $RUNNER_TOKEN"

# Step 2: Start runner container
echo ""
echo "=== Starting Forgejo Runner ==="
$DOCKER compose -f docker-compose.macmini.yml up -d forgejo-runner

# Step 3: Register runner
echo ""
echo "=== Registering runner ==="
sleep 5

$DOCKER exec mana-core-forgejo-runner forgejo-runner register \
    --instance "$FORGEJO_PUBLIC_URL" \
    --token "$RUNNER_TOKEN" \
    --name "mac-mini" \
    --labels "ubuntu-latest:docker://node:20,go:docker://golang:1.25-alpine,docker:docker://docker:dind" \
    --no-interactive

# Step 4: Start runner daemon
echo ""
echo "=== Starting runner daemon ==="
$DOCKER restart mana-core-forgejo-runner

echo ""
echo "=== Runner registered and started ==="
echo "Check status: $FORGEJO_PUBLIC_URL/-/admin/runners"
