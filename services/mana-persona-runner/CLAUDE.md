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

## What M3.a ships (2026-04-22)

Scaffold only — enough to prove the service boots, speaks to mana-auth, and can log in as a persona end-to-end.

- `src/config.ts`     — env-driven config + production-secret assertion
- `src/clients/auth.ts` — login + listSpaces, convenience `loginAndResolvePersonalSpace`
- `src/password.ts`   — HMAC derivation (mirror of `scripts/personas/password.ts`, see comment)
- `src/index.ts`      — Hono app, `/health`, `/metrics`, dev-only `/diag/login`

**Not yet built:** tick dispatcher, Claude Agent SDK integration, MCP client wiring, action/feedback callbacks. Those land in M3.b + M3.c.

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

## Local diag smoke

Once mana-auth + a seeded persona exist:

```bash
# Start the stack
pnpm docker:up
pnpm dev:auth                                    # mana-auth on 3001
pnpm --filter @mana/mcp-service dev              # mana-mcp on 3069
pnpm --filter @mana/persona-runner dev           # this service on 3070

# From a second shell, once `pnpm seed:personas` has run:
curl -s "localhost:3070/diag/login?email=persona.anna@mana.test" | jq
# → { ok: true, email: "persona.anna@mana.test", userId: "…", spaceId: "…" }
```

A successful diag call proves: password derivation matches the seed script, mana-auth login works, the personal space auto-created at signup is discoverable.

## Why a separate service (not part of mana-ai)

- **Lifecycle**: persona-runner is test infra. Starts and stops with a demo, can be paused without downtime noise. mana-ai is a production worker for real user missions — different risk profile.
- **Observability**: mixing them means "is this tick Anna running the suite or a real user running their mission?" becomes a log-filter problem. Separate services give you separate Prometheus scrapes.
- **Tool source**: mana-ai today uses an internal tool catalog; persona-runner uses MCP. When M4 unifies both onto `@mana/tool-registry`, the split still makes sense as two consumers of the same tool surface.
