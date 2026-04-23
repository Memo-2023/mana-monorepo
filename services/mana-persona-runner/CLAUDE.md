# mana-persona-runner

Tick-loop service that drives the **M2 personas** through the app via Claude + the **mana-mcp** gateway. Test infrastructure — not a user-facing service, not deployed to prod until the runner has proven itself in staging.

**Plan:** [`docs/plans/mana-mcp-and-personas.md`](../../docs/plans/mana-mcp-and-personas.md) (M3)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **AI** | `@anthropic-ai/claude-agent-sdk` (native MCP tool-loop) |
| **Tools** | `mana-mcp` (`:3069`) — Streamable HTTP, per-persona JWT |
| **Upstream** | `mana-auth` (`:3001`) for login + spaces + action/feedback persistence |

## Port: 3070

## What it does (when the tick loop lands — M3.b)

Every `TICK_INTERVAL_MS`:

1. Query `auth.personas` for rows whose `tickCadence` + `lastActiveAt` make them due.
2. Limit to `PERSONA_CONCURRENCY` personas in parallel.
3. For each due persona:
   - **Login**: `POST /api/v1/auth/login` with deterministic HMAC-derived password (same algorithm as `scripts/personas/password.ts`).
   - **Resolve space**: `GET /api/auth/organization/list`, pick first `personal` space.
   - **Claude call**: `@anthropic-ai/claude-agent-sdk` with `persona.systemPrompt`, MCP server wired to `:3069`, `X-Mana-Space` pinned to the persona's personal space.
   - **Self-reflection**: after the tool loop settles, ask Claude in-character to rate each module used (1–5 + note).
   - **Persist**: `POST /api/v1/internal/personas/:id/actions` and `/feedback` on mana-auth (service-key auth).

## Files

- `src/config.ts`     — env-driven config + production-secret assertion
- `src/clients/auth.ts` — login + listSpaces, convenience `loginAndResolvePersonalSpace`
- `src/clients/mana-auth-internal.ts` — `X-Service-Key`-gated calls: `listDuePersonas`, `postActions`, `postFeedback`
- `src/password.ts`   — HMAC derivation (mirror of `scripts/personas/password.ts`, see comment)
- `src/runner/claude-session.ts` — per-tick `runMainTurn` + `runRatingTurn` on top of `@anthropic-ai/claude-agent-sdk`
- `src/runner/tick.ts` — orchestrator: due → concurrency-limited fan-out → per-persona pipeline
- `src/runner/types.ts` — `ActionRow`/`FeedbackRow` shapes shared between runner modules
- `src/index.ts`      — Hono app, `/health`, `/metrics`, dev-only `/diag/login` + `/diag/tick`

## Tick pipeline (M3.b)

```
setInterval(config.tickIntervalMs)
    │
    ▼
GET  /api/v1/internal/personas/due          (service-key)
    │  due? hourly>1h, daily>24h, weekdays>24h mon-fri
    ▼
for each persona (max concurrency at once):
    │
    POST /api/v1/auth/login                 (persona JWT)
    GET  /api/auth/organization/list        (personal space id)
    │
    ▼
    runMainTurn
      query({ systemPrompt, mcpServers: { mana: {type:'http', url, headers} }, maxTurns })
      for each SDKMessage:
        tool_use block  →  push ActionRow (ok provisional)
        tool_result err →  flip last ActionRow to 'error'
        module prefix   →  modulesUsed.add(module)
    │
    ▼
    runRatingTurn (same systemPrompt, fresh query, tools:[])
      prompt: 'rate each of {modulesUsed} 1-5, respond JSON'
      parse {ratings:[{module,rating,notes}]}  →  FeedbackRow[]
      invalid JSON       →  one synthetic rating row '__parse' as marker
    │
    ▼
POST /api/v1/internal/personas/:id/actions  (idempotent, batch ≤500)
POST /api/v1/internal/personas/:id/feedback (idempotent, batch ≤100)
    │
    ▼
mana-auth writes rows + bumps personas.last_active_at
```

The outer tick `Promise.allSettled`s each persona, so one failure never
kills the batch. Per-persona exceptions become `failed: [{persona,error}]`
entries in the tick result and get logged. `tickInFlight` guards against
overlap when Claude latency exceeds the interval.

## What's NOT in M3.b (deferred)

- Precise `tool_use_id` ↔ `tool_result` pairing. Today the last action
  gets flipped to `error` when a `tool_result` carries `is_error: true`.
  Good enough for the audit dashboard; exact attribution lands when the
  dashboard needs it.
- Retries/back-off on Claude 429/5xx. The SDK has some built-in; we do
  no extra handling. A burst of 429s can fail a batch — next tick picks
  them up anyway.
- Prometheus counters. Health + log lines today, counters when the
  dashboard lands in M6.

## Environment Variables

```env
PORT=3070
MANA_AUTH_URL=http://localhost:3001
MANA_MCP_URL=http://localhost:3069

# Service-to-service auth for action/feedback persistence (M3.c).
MANA_SERVICE_KEY=...

# Claude API key the runner uses to drive each persona's turn.
ANTHROPIC_API_KEY=...

# Must match whatever the seed script used when the personas were created.
# In production: rotate together with the seed script's env.
PERSONA_SEED_SECRET=...

# Tick loop (M3.b).
TICK_INTERVAL_MS=60000
PERSONA_CONCURRENCY=2

# Operational kill-switch. When true, the service stays up (health-ok)
# but no ticks fire. Useful during demos or when debugging a persona.
RUNNER_PAUSED=false
```

## End-to-end smoke (M3 exit gate)

Proves: personas exist, runner picks them up, Claude drives tools via
MCP, actions + ratings land in Postgres.

```bash
# 1. Stack
pnpm docker:up
cd services/mana-auth && bun run db:push     # applies users.kind + auth.personas* tables
pnpm dev:auth                                 # mana-auth on 3001
pnpm dev:sync                                 # mana-sync on 3050
pnpm --filter @mana/mcp-service dev           # mana-mcp on 3069
pnpm --filter @mana/persona-runner dev        # this service on 3070
    # (boots warning-only if MANA_SERVICE_KEY or ANTHROPIC_API_KEY missing)

# 2. Seed the 10 catalog personas
export MANA_ADMIN_JWT=…                       # admin-tier JWT
export PERSONA_SEED_SECRET=…                  # any value; must match runner
pnpm seed:personas

# 3. Verify login works
curl -s "localhost:3070/diag/login?email=persona.anna@mana.test" | jq
# → { ok: true, userId: "…", spaceId: "…" }

# 4. Fire a tick manually (dev-only endpoint, avoids waiting the full interval)
export MANA_SERVICE_KEY=…
export ANTHROPIC_API_KEY=…
curl -s -X POST localhost:3070/diag/tick | jq
# → { ok: true, result: { due: 10, ranSuccessfully: N, failed: [], durationMs: … } }

# 5. Inspect what landed
psql -c "SELECT persona_id, tool_name, result FROM auth.persona_actions ORDER BY created_at DESC LIMIT 20;"
psql -c "SELECT persona_id, module, rating, notes FROM auth.persona_feedback ORDER BY created_at DESC LIMIT 20;"
```

A green run through step 5 is the M3 exit criterion.

## Why a separate service (not part of mana-ai)

- **Lifecycle**: persona-runner is test infra. Starts and stops with a demo, can be paused without downtime noise. mana-ai is a production worker for real user missions — different risk profile.
- **Observability**: mixing them means "is this tick Anna running the suite or a real user running their mission?" becomes a log-filter problem. Separate services give you separate Prometheus scrapes.
- **Tool source**: mana-ai today uses an internal tool catalog; persona-runner uses MCP. When M4 unifies both onto `@mana/tool-registry`, the split still makes sense as two consumers of the same tool surface.
