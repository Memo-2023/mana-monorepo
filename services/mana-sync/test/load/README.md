# mana-sync Load Tests

k6 load tests for the sync server (HTTP sync endpoints + WebSocket connections).

## Prerequisites

```bash
# Install k6
brew install grafana/tap/k6

# Start infrastructure
pnpm docker:up
pnpm dev:auth
pnpm dev:sync
```

## Get Auth Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.token')
```

## Run Tests

### Smoke Test (10 VUs, 30s)
```bash
k6 run --vus 10 --duration 30s \
  --env AUTH_TOKEN=$TOKEN \
  test/load/sync-load.js
```

### Medium Load (100 VUs, 2min)
```bash
k6 run --vus 100 --duration 2m \
  --env AUTH_TOKEN=$TOKEN \
  test/load/sync-load.js
```

### Stress Test (500 VUs, 5min) — ramp scenario
```bash
k6 run --env AUTH_TOKEN=$TOKEN test/load/sync-load.js
```

### WebSocket Only (up to 1000 connections)
```bash
k6 run --env SCENARIO=websocket --env AUTH_TOKEN=$TOKEN test/load/sync-load.js
```

### Sync Throughput (200 req/s constant)
```bash
k6 run --env SCENARIO=sync --env AUTH_TOKEN=$TOKEN test/load/sync-load.js
```

## Thresholds

| Metric | Target |
|--------|--------|
| HTTP p95 | < 500ms |
| Sync push p95 | < 300ms |
| Sync pull p95 | < 200ms |
| Error rate | < 1% |

## Custom Metrics

- `sync_push_duration` — POST /sync/{appId} latency
- `sync_pull_duration` — GET /sync/{appId}/pull latency
- `ws_connect_duration` — WebSocket handshake + auth time
- `sync_conflicts` — Number of LWW conflicts detected
- `sync_errors` — Error rate across all sync operations
