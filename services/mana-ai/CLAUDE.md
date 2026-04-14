# mana-ai

Background runner for the AI Workbench. Picks up due Missions from the `mana_sync` Postgres and plans/proposes next steps without requiring an open browser tab. Complements the foreground `startMissionTick` in the webapp (`apps/mana/apps/web/src/lib/data/ai/missions/setup.ts`).

Design context: [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md` §20](../../docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md).

## Status: v0.2 (plans end-to-end, no write-back)

What works:

- [x] Boots as a Hono/Bun service on port `3066`
- [x] Exposes `/health` and service-key-gated `/internal/tick`
- [x] Replays `sync_changes` for `appId='ai' / table='aiMissions'` into live Mission records via field-level LWW (`src/db/missions-projection.ts`)
- [x] Lists due missions (`state='active' && nextRunAt <= now()`)
- [x] For each due mission: builds the shared `buildPlannerPrompt` from `@mana/shared-ai`, calls `mana-llm` via `/v1/chat/completions`, parses + validates with `parsePlannerResponse`
- [x] Per-mission try/catch so one flaky LLM response doesn't abort the queue; stats differentiate `plansProduced` vs `parseFailures`
- [x] Server-side tool allow-list (`src/planner/tools.ts`) mirrors the webapp's `DEFAULT_AI_POLICY` subset where policy === 'propose'

Intentionally **not yet** implemented:

- [ ] Input-resolvers server-side — Planner currently sees `resolvedInputs: []` so the LLM only has concept + objective + iteration history. Real resolvers need per-module projections of `sync_changes` (notes, kontext, goals)
- [ ] Write-back path for plan results — the produced plan is logged, not persisted. Needs an RLS-scoped write helper mirroring mana-sync's `withUser` pattern. See "Open design questions" below; leaning option (a): append iteration with `source: 'server'` so the webapp staging-effect translates each step into a local Proposal.
- [ ] Per-user Postgres RLS scoping on reads — current read scans cross-user and relies on downstream code honouring `userId`
- [ ] Contract test between this service's `AI_AVAILABLE_TOOLS` and the webapp's `DEFAULT_AI_POLICY` — drift today = silent degradation

## Port: 3066

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL via `postgres` driver (read-only against `mana_sync`) |
| **Auth** | Service-to-service key; no end-user JWTs |

## Quick Start

```bash
# Requires mana_sync DB reachable
cd services/mana-ai
bun run dev

# Smoke test
curl http://localhost:3066/health
curl -X POST -H "X-Service-Key: dev-service-key" http://localhost:3066/internal/tick
```

## Environment Variables

```env
PORT=3066
SYNC_DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_sync
MANA_LLM_URL=http://localhost:3020
MANA_SERVICE_KEY=dev-service-key
TICK_INTERVAL_MS=60000
TICK_ENABLED=true    # flip to false to boot HTTP-only (for Docker health-check)
```

## Architecture

```
┌────────────────────┐
│  mana-ai (Bun)     │
│    :3066           │
│                    │   60s interval
│  ┌─────────────┐   │────────────────┐
│  │ tick loop   │   │                │
│  │ runTickOnce │   │                │
│  └─────────────┘   │                │
│       │            │                │
│       │ SELECT     │                │
│       ▼            │                │
│  ┌─────────────┐   │                │
│  │ missions-   │   │                │
│  │ projection  │   │                │
│  │ (LWW replay)│   │                │
│  └─────────────┘   │                ▼
│                    │          ┌──────────────┐
│  ┌─────────────┐   │          │  mana_sync   │
│  │ planner     │───┼─────────▶│  (Postgres)  │
│  │ client      │   │          └──────────────┘
│  └─────────────┘   │
│       │            │
└───────┼────────────┘
        │ POST /v1/chat/completions
        ▼
┌────────────────────┐
│  mana-llm (Python) │
│    :3020           │
└────────────────────┘
```

## Open design questions (for next PR)

### 1. How do plan results get back to the user's device?

Proposals live in a **local-only** Dexie table (`pendingProposals`) — they don't sync. So the server can't just write proposals directly.

Options:

**(a) Write iteration + plan to `aiMissions`, let the browser stage proposals on arrival.**
Server appends an iteration with `overallStatus: 'server-planned'` and the plan steps. When the webapp next syncs, an effect subscribed to iteration changes translates each step into a local `Proposal` using the existing `createProposal()`. Clean: preserves the "proposals are local" invariant. Risk: duplicate proposals if multiple devices pick up the same iteration.

**(b) Introduce `aiProposedSteps` as a synced table.**
Server writes here directly; the webapp treats it as a source for its local `pendingProposals`. Requires a migration step + duplicates the proposal model.

**(c) Make `pendingProposals` sync.**
Simplest schema change, most invasive: approvals + rejections now race across devices. Would need server-authoritative state transitions.

**Leaning (a)** — minimal schema change, single source of truth. Implementation sketch: add `iteration.source: 'browser' | 'server'` and a "staging queue" on the webapp that dedups via `iterationId`.

### 2. Does the server need full LWW replay?

The projection replays every `sync_changes` row for `aiMissions` on every tick. For a small user base this is fine; past ~100 users × hundreds of rows it becomes wasteful.

Option: materialized view refreshed on sync-change insert via a trigger or a per-user `ai_mission_snapshot` table the service maintains. Defer until the load shows up.

### 3. Planner prompt: duplicate or share?

`prompt.ts` + `parser.ts` live in the webapp's `@mana/web/src/lib/data/ai/missions/planner/`. Server-side copies would drift. Options:

- Extract a `@mana/shared-ai` package with the prompt/parser
- Keep two copies with a contract test
- Only the webapp plans; server just triggers the browser via push

First is cleanest; TS source, imports cleanly in both Bun and Vite.

## Writing code in here

- No database schema of its own — this service is pure consumer. If you need persistent state (retry queues, per-user cursors), add a separate table namespace under `mana_ai.*` schema on the `mana_sync` database, not a new DB.
- `src/db/missions-projection.ts` is the ONLY place that does LWW replay. Don't duplicate the logic; add new projection helpers there.
- Follow the foreground-runner contract: injected deps (planner, write-back) for tests. Bun's `bun test` runs in `src/**/*.test.ts`.

## Files

```
services/mana-ai/
├── src/
│   ├── index.ts                    — Hono bootstrap + tick scheduler wiring
│   ├── config.ts                   — Env loading
│   ├── cron/tick.ts                — Scan loop, overlap-guarded
│   ├── db/
│   │   ├── connection.ts           — postgres.js pool
│   │   └── missions-projection.ts  — sync_changes → Mission LWW replay
│   ├── planner/client.ts           — mana-llm HTTP client (OpenAI-compatible)
│   └── middleware/service-auth.ts  — X-Service-Key gate for /internal/*
├── Dockerfile
├── package.json
├── tsconfig.json
└── CLAUDE.md
```
