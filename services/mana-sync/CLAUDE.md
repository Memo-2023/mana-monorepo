# mana-sync

Central sync server for local-first Mana apps. Handles data synchronization between IndexedDB (Dexie.js) clients and PostgreSQL via field-level Last-Write-Wins (LWW) conflict resolution.

## Architecture

```
Client A (Browser)                Client B (Browser)
  IndexedDB (Dexie)                 IndexedDB (Dexie)
       |                                 |
       | POST /sync/{appId}              | GET /sync/{appId}/pull
       v                                 v
  ┌──────────────────────────────────────────┐
  │            mana-sync (Go)                │
  │  Port 3050 | JWT auth via JWKS           │
  │                                          │
  │  HTTP: sync + pull endpoints             │
  │  WS:   real-time sync-available notify   │
  │                                          │
  │  Conflict Resolution: Field-level LWW    │
  └──────────────────┬───────────────────────┘
                     |
                     v
               PostgreSQL
            (sync_changes table)
```

## Quick Start

```bash
# From monorepo root
pnpm dev:sync           # Start server (requires DB + auth running)
pnpm dev:sync:build     # Compile Go binary

# Standalone
cd services/mana-sync
go build -o server ./cmd/server
JWKS_URL=http://localhost:3001/api/auth/jwks \
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_sync \
./server
```

## Sync Protocol

### Push (POST /sync/{appId})

Client sends a batch of changes, server records them and returns changes from other clients.

```
CLIENT -> SERVER:
{
  "clientId": "chrome-tab-abc123",
  "since": "2024-01-01T10:00:00.000Z",
  "changes": [
    {
      "table": "todos",
      "id": "todo-123",
      "op": "update",
      "fields": {
        "title": { "value": "Buy milk", "updatedAt": "2024-01-01T10:05:00Z" },
        "completed": { "value": true, "updatedAt": "2024-01-01T10:06:00Z" }
      }
    }
  ]
}

SERVER -> CLIENT:
{
  "serverChanges": [ ... changes from other clients ... ],
  "conflicts": [],
  "syncedUntil": "2024-01-01T10:06:15.123456789Z"
}
```

### Pull (GET /sync/{appId}/pull)

Client requests changes for a specific collection since a timestamp.

```
GET /sync/todo/pull?collection=tasks&since=2024-01-01T10:00:00Z
Header: X-Client-Id: chrome-tab-abc123
Header: Authorization: Bearer <jwt>
```

### WebSocket — Unified (GET /ws) [Recommended]

Single connection per user. Receives notifications for all apps with `appId` in the payload.

```
CLIENT -> SERVER: { "type": "auth", "token": "<jwt>" }
SERVER -> CLIENT: { "type": "auth-ok" }

// When another client syncs:
SERVER -> CLIENT: { "type": "sync-available", "appId": "todo", "tables": ["tasks"] }

// Keepalive:
CLIENT -> SERVER: { "type": "ping" }
SERVER -> CLIENT: { "type": "pong" }
```

### WebSocket — Legacy (GET /ws/{appId})

One connection per app. Only receives notifications for that specific app. Backward-compatible.

```
CLIENT -> SERVER: { "type": "auth", "token": "<jwt>" }
SERVER -> CLIENT: { "type": "auth-ok" }
SERVER -> CLIENT: { "type": "sync-available", "appId": "todo", "tables": ["tasks"] }
```

## Conflict Resolution: Field-Level LWW

Each field update carries a timestamp. When the same field is modified by multiple clients, the latest timestamp wins.

```
Client A: title="Buy milk"    @ 10:05:00
Client B: title="Buy eggs"    @ 10:05:30
Result:   title="Buy eggs"    (Client B wins — later timestamp)

Client A: title="Buy milk"    @ 10:05:00
Client A: completed=true      @ 10:06:00
Client B: title="Buy eggs"    @ 10:05:30
Result:   title="Buy eggs", completed=true  (merged — different fields)
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /sync/{appId}` | POST | JWT | Push changes, get server delta |
| `GET /sync/{appId}/pull` | GET | JWT | Pull changes for a collection |
| `GET /ws` | WS | JWT (in-band) | Unified real-time sync (all apps, one connection) |
| `GET /ws/{appId}` | WS | JWT (in-band) | Legacy per-app sync notifications |
| `GET /health` | GET | No | Health check with connection stats |
| `GET /metrics` | GET | No | Prometheus metrics |

## Database Schema

Single table for all sync data:

```sql
sync_changes (
  id UUID PRIMARY KEY,
  app_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  op TEXT NOT NULL CHECK (insert | update | delete),
  data JSONB,
  field_timestamps JSONB DEFAULT '{}',
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

Indexes: `(user_id, app_id, created_at)`, `(table_name, record_id, created_at)`, `(user_id, app_id, table_name, created_at)`

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3050 | Server port |
| `DATABASE_URL` | `postgresql://...localhost:5432/mana_sync` | PostgreSQL connection |
| `JWKS_URL` | `http://localhost:3001/api/auth/jwks` | mana-core-auth JWKS endpoint |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

## Testing

```bash
cd services/mana-sync
go test ./... -v
```

Test coverage: auth (JWT extraction, validator), config (env loading), sync (validation, serialization, LWW types).

## Project Structure

```
services/mana-sync/
├── cmd/server/main.go          — Entry point, routes, graceful shutdown
├── internal/
│   ├── auth/jwt.go             — EdDSA JWT validation via JWKS
│   ├── auth/jwt_test.go        — Token extraction, validator tests
│   ├── config/config.go        — Environment variable loading
│   ├── config/config_test.go   — Config defaults and env override tests
│   ├── store/postgres.go       — PostgreSQL schema, queries
│   ├── sync/handler.go         — HTTP endpoints, LWW logic, validation
│   ├── sync/handler_test.go    — Validation, serialization tests
│   ├── sync/types.go           — Protocol data structures
│   └── ws/hub.go               — WebSocket connection management
├── go.mod
└── CLAUDE.md
```

## Security

- JWT validated via EdDSA JWKS (same as NestJS backends)
- WebSocket connections must authenticate within 10 seconds
- Request body limited to 10 MB
- Operation types validated (insert/update/delete only)
- Table and record IDs required on all changes
- RecordChange failures abort the entire sync (no partial writes)

## Connected Apps (19)

Todo, Calendar, Clock, Contacts, Chat, Questions, Mukke, Context, Photos, Cards, Picture, Presi, Storage, Zitare, SkillTree, CityCorners, NutriPhi, Planta, Inventar, uLoad, Times, Calc
