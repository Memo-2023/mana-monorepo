#!/bin/bash
#
# E2E Sync Flow Test
#
# Tests the full sync cycle: Client A pushes → Server stores → Client B pulls
# Requires: mana-sync running on localhost:3050, mana-auth for JWT
#
# Usage: ./test/e2e-sync-flow.sh [AUTH_TOKEN]
#
# If no token provided, attempts to get one from mana-auth.

set -e

SYNC_URL="${SYNC_URL:-http://localhost:3050}"
AUTH_URL="${AUTH_URL:-http://localhost:3001}"
APP_ID="test-e2e"
CLIENT_A="client-a-$(date +%s)"
CLIENT_B="client-b-$(date +%s)"
RECORD_ID="test-record-$(date +%s)"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get auth token
TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Getting auth token from $AUTH_URL..."
  TOKEN=$(curl -s -X POST "$AUTH_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"claude-test@mana.how","password":"ClaudeTest2024"}' | \
    grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get auth token. Pass one as argument.${NC}"
    exit 1
  fi
fi

echo "=== E2E Sync Flow Test ==="
echo "Sync URL: $SYNC_URL"
echo "App ID: $APP_ID"
echo ""

# ─── Test 1: Health Check ─────────────────────────────────

echo -n "1. Health check... "
HEALTH=$(curl -s "$SYNC_URL/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}: $HEALTH"
  exit 1
fi

# ─── Test 2: Client A pushes an insert ─────────────────────

echo -n "2. Client A pushes insert... "
PUSH_RESPONSE=$(curl -s -X POST "$SYNC_URL/sync/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_A\",
    \"since\": \"1970-01-01T00:00:00.000Z\",
    \"changes\": [{
      \"table\": \"tasks\",
      \"id\": \"$RECORD_ID\",
      \"op\": \"insert\",
      \"data\": {\"title\": \"E2E Test Task\", \"completed\": false}
    }]
  }")

if echo "$PUSH_RESPONSE" | grep -q '"syncedUntil"'; then
  SYNCED_UNTIL=$(echo "$PUSH_RESPONSE" | grep -o '"syncedUntil":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}PASS${NC} (syncedUntil: $SYNCED_UNTIL)"
else
  echo -e "${RED}FAIL${NC}: $PUSH_RESPONSE"
  exit 1
fi

# ─── Test 3: Client B pulls and sees the change ──────────

echo -n "3. Client B pulls changes... "
PULL_RESPONSE=$(curl -s "$SYNC_URL/sync/$APP_ID/pull?collection=tasks&since=1970-01-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_B")

if echo "$PULL_RESPONSE" | grep -q "$RECORD_ID"; then
  echo -e "${GREEN}PASS${NC} (found record $RECORD_ID)"
else
  echo -e "${RED}FAIL${NC}: Record not found in pull response"
  echo "$PULL_RESPONSE" | head -5
  exit 1
fi

# ─── Test 4: Client B pushes an update ───────────────────

echo -n "4. Client B pushes update... "
UPDATE_RESPONSE=$(curl -s -X POST "$SYNC_URL/sync/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_B" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_B\",
    \"since\": \"$SYNCED_UNTIL\",
    \"changes\": [{
      \"table\": \"tasks\",
      \"id\": \"$RECORD_ID\",
      \"op\": \"update\",
      \"fields\": {
        \"title\": {\"value\": \"Updated by Client B\", \"updatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"completed\": {\"value\": true, \"updatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
      }
    }]
  }")

if echo "$UPDATE_RESPONSE" | grep -q '"syncedUntil"'; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}: $UPDATE_RESPONSE"
  exit 1
fi

# ─── Test 5: Client A sees the update ────────────────────

echo -n "5. Client A pulls update... "
PULL2_RESPONSE=$(curl -s "$SYNC_URL/sync/$APP_ID/pull?collection=tasks&since=$SYNCED_UNTIL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_A")

if echo "$PULL2_RESPONSE" | grep -q "Updated by Client B"; then
  echo -e "${GREEN}PASS${NC} (saw Client B's update)"
else
  echo -e "${RED}FAIL${NC}: Update not visible to Client A"
  echo "$PULL2_RESPONSE" | head -5
  exit 1
fi

# ─── Test 6: Client A pushes a delete ────────────────────

echo -n "6. Client A pushes delete... "
DELETE_RESPONSE=$(curl -s -X POST "$SYNC_URL/sync/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Id: $CLIENT_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_A\",
    \"since\": \"$SYNCED_UNTIL\",
    \"changes\": [{
      \"table\": \"tasks\",
      \"id\": \"$RECORD_ID\",
      \"op\": \"delete\"
    }]
  }")

if echo "$DELETE_RESPONSE" | grep -q '"syncedUntil"'; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}: $DELETE_RESPONSE"
  exit 1
fi

# ─── Test 7: Unauthorized request rejected ───────────────

echo -n "7. Unauthorized request rejected... "
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SYNC_URL/sync/$APP_ID" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"bad","since":"2024-01-01T00:00:00Z","changes":[]}')

if [ "$UNAUTH_RESPONSE" = "401" ]; then
  echo -e "${GREEN}PASS${NC} (401)"
else
  echo -e "${RED}FAIL${NC}: Expected 401, got $UNAUTH_RESPONSE"
  exit 1
fi

echo ""
echo -e "${GREEN}=== All 7 tests passed! ===${NC}"
echo "Full sync cycle verified: push → store → pull → update → pull → delete"
