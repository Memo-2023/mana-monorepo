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
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_sync \
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
        "title": { "value": "Buy milk", "at": "2024-01-01T10:05:00Z" },
        "completed": { "value": true, "at": "2024-01-01T10:06:00Z" }
      },
      "actor": { "kind": "user", "principalId": "user-1", "displayName": "Du" },
      "origin": "user"
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
| `POST /sync/{appId}` | POST | JWT + Billing | Push changes, get server delta |
| `GET /sync/{appId}/pull` | GET | JWT + Billing | Pull changes for a collection |
| `GET /sync/{appId}/stream` | GET | JWT + Billing | SSE stream for real-time changes |
| `GET /ws` | WS | JWT (in-band) | Unified real-time sync (all apps, one connection) |
| `GET /ws/{appId}` | WS | JWT (in-band) | Legacy per-app sync notifications |
| `GET /health` | GET | No | Health check with connection stats |
| `GET /metrics` | GET | No | Prometheus metrics |

**Billing gate**: Push, pull, and stream endpoints are wrapped by a billing middleware that checks the user's sync subscription status via `mana-credits`. Returns **402 Payment Required** if sync is not active. Status is cached for 5 minutes per user. Fail-open: if mana-credits is unreachable, sync is allowed.

## Data Export / Import

Data export is **not** a mana-sync responsibility anymore (since 2026-04-22). The previous `GET /backup/export` server-side event-stream export was removed in favour of a fully client-driven snapshot export: the webapp reads its local Dexie store, decrypts per-field, optionally passphrase-seals, and downloads a `.mana` archive. See `apps/mana/apps/web/src/lib/data/backup/v2/` and `docs/plans/data-export-v2.md` for the format + pipeline.

Rationale for the move:
- Zero-knowledge users hold their vault key client-side only — a server-side exporter cannot produce plaintext archives for them.
- GDPR data-portability is better served by plaintext-by-default (Art. 20) than by ciphertext blobs only decryptable with an active Mana install.
- Module-selective export is intrinsically a client concern — the server has no business knowing which subset of a user's data the user wants to hand out.

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
  field_meta JSONB DEFAULT '{}',
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  schema_version INT NOT NULL DEFAULT 1,
  actor JSONB,  -- AI Workbench attribution: { kind: user|ai|system, ... }
  origin TEXT,  -- pipeline: user | agent | system | migration
  space_id TEXT
)
```

**`actor` column (2026-04-14)**: Opaque JSON blob the webapp stamps on every change to distinguish user writes from autonomous AI writes and derived subsystem writes. Server does NOT parse the shape — just persists + re-emits. Pre-actor clients omit the field; the column is nullable. See `apps/mana/apps/web/src/lib/data/events/actor.ts` for the discriminated union + `COMPANION_BRAIN_ARCHITECTURE.md §20` for the full pipeline.

**`origin` column + `field_meta` rename (2026-04-26, F1 of `docs/plans/sync-field-meta-overhaul.md`)**: `field_timestamps` was renamed to `field_meta` for symmetry with the client-side `__fieldMeta` and to reserve room for richer per-field metadata. The new `origin` column carries the pipeline that produced the write on the originating client (`user` / `agent` / `system` / `migration`) — drives client-side conflict-detection: only `'user'`-origin writes can lose to a server overwrite and surface a conflict toast (F2). FieldChange wire shape changed from `{ value, updatedAt }` to `{ value, at }` to match.

Indexes: `(user_id, app_id, created_at)`, `(table_name, record_id, created_at)`, `(user_id, app_id, table_name, created_at)`

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3050 | Server port |
| `DATABASE_URL` | `postgresql://...localhost:5432/mana_sync` | PostgreSQL connection |
| `JWKS_URL` | `http://localhost:3001/api/auth/jwks` | mana-auth JWKS endpoint |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `MANA_CREDITS_URL` | `http://localhost:3061` | mana-credits service URL for billing checks |
| `MANA_SERVICE_KEY` | `dev-service-key` | Service-to-service auth key |

## Testing

```bash
cd services/mana-sync
go test ./... -v
```

Test coverage: auth (JWT extraction, validator), config (env loading), sync (validation, serialization, LWW types), backup (ZIP writer round-trip + legacy `schema_version=0` clamping + empty-export manifest).

## Project Structure

```
services/mana-sync/
├── cmd/server/main.go          — Entry point, routes, graceful shutdown
├── internal/
│   ├── auth/jwt.go             — EdDSA JWT validation via JWKS
│   ├── auth/jwt_test.go        — Token extraction, validator tests
│   ├── backup/writer.go        — Pure ZIP writer for .mana archives (testable without DB)
│   ├── backup/writer_test.go   — 4 cases: round-trip, empty, legacy schema_version=0
│   ├── backup/handler.go       — HTTP shim for GET /backup/export (auth-only)
│   ├── billing/check.go        — Sync billing status checker (cached, fail-open)
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
- Sync endpoints gated by billing check (402 if subscription inactive)
- WebSocket connections must authenticate within 10 seconds
- Request body limited to 10 MB
- Operation types validated (insert/update/delete only)
- Table and record IDs required on all changes
- RecordChange failures abort the entire sync (no partial writes)
- `/backup/export` is auth-only by design (GDPR), but `StreamAllUserChanges` is RLS-scoped to the caller's `user_id` via the same `withUser()` transaction pattern as every other query — cross-user export is impossible at the DB layer

## Connected Apps (19)

Todo, Calendar, Clock, Contacts, Chat, Questions, Mukke, Context, Photos, Cards, Picture, Presi, Storage, Quotes, SkillTree, CityCorners, Food, Planta, Inventar, uLoad, Times, Calc
