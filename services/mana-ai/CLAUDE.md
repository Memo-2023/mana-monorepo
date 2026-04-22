# mana-ai

Background runner for the AI Workbench. Picks up due Missions from the `mana_sync` Postgres and plans/proposes next steps without requiring an open browser tab. Complements the foreground `startMissionTick` in the webapp (`apps/mana/apps/web/src/lib/data/ai/missions/setup.ts`).

Design context:
- [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../../docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20 (AI Workbench base), §21 (Mission Key-Grants), §22 (Multi-Agent Workbench)
- [`docs/plans/ai-mission-key-grant.md`](../../docs/plans/ai-mission-key-grant.md) — Shipped (per-mission key-grant for encrypted inputs)
- [`docs/plans/multi-agent-workbench.md`](../../docs/plans/multi-agent-workbench.md) — Shipped (named agents, per-agent policy/memory, scene lens)
- [`docs/plans/team-workbench.md`](../../docs/plans/team-workbench.md) — Forward-looking (multi-user + shared team context)
- [`docs/future/AI_AGENTS_IDEAS.md`](../../docs/future/AI_AGENTS_IDEAS.md) — Unshipped improvement backlog

## Status: v0.3 (full close-the-loop)

What works end-to-end:

- [x] Boots as a Hono/Bun service on port `3067`
- [x] Exposes `/health` and service-key-gated `/internal/tick`
- [x] Replays `sync_changes` for `appId='ai' / table='aiMissions'` into live Mission records via field-level LWW (`src/db/missions-projection.ts`)
- [x] Lists due missions (`state='active' && nextRunAt <= now()`)
- [x] For each due mission: shared `buildPlannerPrompt` (from `@mana/shared-ai`) → mana-llm `/v1/chat/completions` → strict `parsePlannerResponse`
- [x] Per-mission try/catch so one flaky LLM response doesn't abort the queue; stats differentiate `plansProduced` / `plansWrittenBack` / `parseFailures`
- [x] Server-side tool allow-list (`src/planner/tools.ts`) mirrors the webapp's `DEFAULT_AI_POLICY` `propose` subset
- [x] **Write-back**: `db/iteration-writer.ts` appends the server-produced iteration to `Mission.iterations[]` via a `sync_changes` INSERT under an RLS-scoped `withUser` transaction. Row is attributed with actor `{kind:'system', source:'mission-runner'}`.
- [x] Webapp staging effect (`server-iteration-staging.ts`) picks up the synced iteration and translates each PlanStep into a local Proposal with full AI-actor attribution (missionId + iterationId + rationale). Idempotent via durable `proposalId` markers.
- [x] **Server-side input resolvers** for plaintext tables — `db/resolvers/` with a pluggable registry + single-record LWW replay (`record-replay.ts`). `goals` resolver ships by default. Encrypted tables (notes, kontext, tasks, events, journal, …) are intentionally **not** resolved server-side; those missions depend on the foreground runner which decrypts client-side. See `resolvers/types.ts` for the privacy rationale.
- [x] **Materialized mission snapshots** — `mana_ai.mission_snapshots` table with per-tick incremental refresh (`db/snapshot-refresh.ts`). `listDueMissions` is now a single indexed SELECT; the prior O(N changes) LWW replay stays only in `mergeAndFilter` for tests. Idempotent `migrate()` on boot creates the schema.
- [x] **Prometheus metrics** on `/metrics` — process defaults with
      `mana_ai_` prefix + counters (`mana_ai_ticks_total`,
      `mana_ai_plans_produced_total`, `mana_ai_plans_written_back_total`,
      `mana_ai_parse_failures_total`, `mana_ai_mission_errors_total`,
      `mana_ai_snapshots_*`) and histograms (`mana_ai_tick_duration_seconds`,
      `mana_ai_planner_request_duration_seconds`,
      `mana_ai_http_request_duration_seconds`). Scraped 30s by
      `docker/prometheus/prometheus.yml`'s `mana-ai` job. `/health` is
      also blackbox-probed and surfaces on **status.mana.how** under
      "Internal" as "Mana AI Runner".

All v0.3 roadmap items shipped. Future polish (not blockers):
- Multi-instance deploy with advisory locks on snapshot refresh (today single-process)
- Read-only `/internal/missions/:userId` endpoint for ops inspection

## Status: v0.4 (Mission Key-Grants, in Arbeit)

Opt-in Mechanismus zum Entschluesseln der encrypted Input-Tabellen (notes, tasks, events, journal, kontext) serverseitig. Plan: [`docs/plans/ai-mission-key-grant.md`](../../docs/plans/ai-mission-key-grant.md). Architektur: [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md` §21](../../docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md).

Was steht (Phase 0-2, Backend):

- [x] RSA-OAEP-2048 keypair slots — `MANA_AI_PRIVATE_KEY_PEM` (ai) / `MANA_AI_PUBLIC_KEY_PEM` (auth). Ohne Env-Var laeuft der Service unveraendert; Grants werden dann einfach uebersprungen.
- [x] Canonical HKDF in `@mana/shared-ai` (`missions/grant.ts`). Scope-Binding (tables + recordIds) via `info`-String → Scope-Change = neuer Key = existierender Grant automatisch invalidiert.
- [x] `POST /api/v1/me/ai-mission-grant` auf mana-auth — leitet MDK ab, RSA-wrapped, lehnt Zero-Knowledge-User ab, TTL-clamped [1h, 30d].
- [x] `mana_ai.decrypt_audit` Tabelle + RLS (`user_scope` via `app.current_user_id`). Append-only.
- [x] `crypto/unwrap-grant.ts` — Private-Key-Import, Grant-Entwrapping mit structured reasons (`not-configured` / `expired` / `wrap-rejected` / `malformed`).
- [x] `crypto/decrypt-value.ts` — Mirror des webapp AES-GCM wire format (`enc:1:<iv>.<ct>`).
- [x] Encrypted Resolver (`db/resolvers/encrypted.ts`) fuer notes / tasks / calendar / journal / kontext. Checkt recordId-Allowlist, replayt Record, entschluesselt `enc:1:`-Felder, schreibt Audit-Row pro Record.
- [x] Tick-Loop-Integration (`cron/tick.ts`) — unwrappt Grant pro Mission, baut `ResolverContext` mit `mdk + allowlist`, Key lebt nur waehrend `planOneMission`.
- [x] Metriken: `mana_ai_decrypts_total{table}`, `mana_ai_grant_scope_violations_total{table}` (Alert > 0!), `mana_ai_grant_skips_total{reason}`.

Was offen ist (Phase 3, Frontend):

- [x] Webapp `MissionGrantDialog` + Consent-Flow im Mission-Detail.
- [x] Revoke-Button + "Datenzugriff" Audit-Tab im Workbench.
- [x] `GET /api/v1/me/ai-audit` JWT-gated Endpoint live.
- [x] Feature-Flag `PUBLIC_AI_MISSION_GRANTS` + Cloudflare-Tunnel.
- [x] Produktions-Keypair auf Mac-Mini unter `secrets/mana-ai/`.

## Status: v0.5 (Multi-Agent Workbench)

Der Runner wird agent-bewusst — Missionen gehoeren einem benannten Agent, Policy und Memory leben auf dem Agent, Concurrency + Budget werden pro Agent respektiert.

- [x] `mana_ai.agent_snapshots` Tabelle (LWW-Projektion von `agents` aus `sync_changes`).
- [x] `refreshAgentSnapshots` + `loadActiveAgents` parallel zum Mission-Snapshot-Refresh.
- [x] `ServerMission.agentId` + `ServerAgent.policy` durchgereicht.
- [x] Tick resolvt pro Mission den Agent, gated `archived`/`paused`/`concurrency`, schreibt iteration unter `makeAgentActor(agent)` Identitaet.
- [x] `<agent_context>` Prompt-Block mit plaintext `role` + `systemPrompt` + `memory` (ciphertext wird uebersprungen).
- [x] `filterToolsByAgentPolicy` schneidet `deny`-Tools raus bevor der Planner sie sieht.
- [x] Metrik `mana_ai_agent_decisions_total{decision}`.

## Status: v0.7 (Cross-Tick Deep Research, 2026-04-22)

Opt-in asynchroner Deep-Research-Pfad für Missions, die explizit tiefe Recherche wollen. Ruft `mana-research`'s neue Gemini-Deep-Research-Max-Provider (`gemini-deep-research` / `gemini-deep-research-max`) über den internen Service-to-Service-Endpunkt `/api/v1/internal/research/async` auf. Weil Max bis zu 60 min läuft und unser Tick 60 s, läuft das über Ticks hinweg.

- [x] `ManaResearchClient` (`clients/mana-research.ts`) — HTTP-Client für mana-research's interne async-Endpoints. `X-Service-Key` + `X-User-Id`. Graceful-null bei Fehler.
- [x] `mana_ai.mission_research_jobs` Tabelle — ein Row pro pending Job pro Mission, PK `(user_id, mission_id)`. Präsenz = "läuft gerade". Nach `completed`/`failed` wird gelöscht.
- [x] Cross-Tick State-Machine in `cron/tick.ts` (`handleDeepResearch`):
  - Pending Job → poll → `queued`/`running` skip, `completed` inject Result, `failed` fall-through zu Shallow
  - Kein Job + `DEEP_RESEARCH_TRIGGER` + `config.deepResearchEnabled` → submit + insert → skip
- [x] Neuer Trigger `DEEP_RESEARCH_TRIGGER` ist **strenger** als der heutige `RESEARCH_TRIGGER` — matcht nur "deep research", "tiefe recherche", "umfassende recherche", "hintergrundrecherche", "deep dive". Zusätzlich per ENV gegated (`MANA_AI_DEEP_RESEARCH_ENABLED=true`, default off).
- [x] `planOneMission` Rückgabetyp ist jetzt eine Discriminated Union `{outcome:'planned'|'skipped'|'failed'}`. `'skipped'` (= research pending) wird **nicht** als parse-failure gezählt.
- [x] Metriken: `mana_ai_research_jobs_submitted_total{provider}`, `_completed_total{provider}`, `_failed_total{provider}`, `_pending_skips_total`.
- [x] Docker-Compose: `MANA_RESEARCH_URL`, `MANA_AI_DEEP_RESEARCH_ENABLED`, `depends_on: mana-research`.
- [x] `@mana/shared-research` als workspace-dep + `type-check` script in `package.json`.

Bewusst nicht gemacht (offen):
- Mission-Config-Flag in der Webapp. Trigger ist heute Regex-basiert, nicht explizit konfigurierbar. Das reicht für den Pilot; wenn wir öffnen, brauchen wir eine UI-Checkbox im Mission-Detail.
- Image-Output (`charts`, Nano-Banana). Steckt in `providerRaw`, wird nicht im Answer-Text gerendert.
- Streaming-Thought-Summaries. Würde eine eigene SSE-Brücke zum Frontend brauchen.

Details zum Deep-Research-Flow: [`docs/reports/gemini-deep-research.md`](../../docs/reports/gemini-deep-research.md) §3.2.

## Status: v0.6 (Server-side Web-Research + erweiterte Tools)

Der Runner kann jetzt vor dem Planner-Call eigenstaendig Web-Recherche ausfuehren (ohne Browser). Serverseitig werden 31 propose-Tools ueber 16 Module vom Planner vorgeschlagen (auto-Tools laufen ausschliesslich in der Webapp-Reasoning-Loop — der Server sieht nur propose).

- [x] `NewsResearchClient` (`planner/news-research-client.ts`) — HTTP-Client fuer `mana-api`'s `/api/v1/news-research/discover` + `/search`. Timeouts 15s/30s, graceful-null bei Fehler.
- [x] Pre-Planning-Research-Step in `cron/tick.ts` — bei Mission-Objectives mit Research-Keywords (`recherchier|research|news|today|historisch|...`) wird automatisch vor dem Planner-Call RSS-Discovery + Search ausgefuehrt. Ergebnisse als `ResolvedInput` mit `id='__web-research__'` injiziert.
- [x] `config.manaApiUrl` + Docker-Compose-Wiring (`MANA_API_URL: http://mana-api:3060`, `depends_on: mana-api`).
- [x] 31 propose-Tools ueber 16 Module (Server-Sicht — auto-Tools sind nur in der Webapp):
  - todo: `create_task`, `complete_task`, `complete_tasks_by_title`
  - calendar: `create_event`
  - notes: `create_note`, `update_note`, `append_to_note`, `add_tag_to_note`
  - places: `create_place`, `visit_place`
  - drink: `undo_drink`
  - news: `save_news_article`
  - news-research: `research_news`
  - journal: `create_journal_entry`
  - habits: `create_habit`, `log_habit`
  - contacts: `create_contact`
  - quiz: `create_quiz`, `update_quiz`, `add_quiz_question`, `update_quiz_question`, `delete_quiz_question`
  - goals: `create_goal`, `pause_goal`, `resume_goal`, `complete_goal`
  - mood: `log_mood`
  - events: `suggest_event`
  - finance: `add_transaction`
  - times: `start_timer`, `stop_timer`
- [x] Volle Tool-Liste inkl. der 28 auto-Tools: siehe `apps/mana/CLAUDE.md` §Tool Coverage. Einzige Wahrheitsquelle ist `AI_TOOL_CATALOG` in `@mana/shared-ai/src/tools/schemas.ts`; beide Seiten deriven daraus, Drift-Guard in `src/planner/tools.ts` blockt Regressionen.

## Port: 3067

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
curl http://localhost:3067/health
curl -X POST -H "X-Service-Key: dev-service-key" http://localhost:3067/internal/tick
```

## Environment Variables

```env
PORT=3067
SYNC_DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_sync
MANA_LLM_URL=http://localhost:3020
MANA_API_URL=http://localhost:3060        # news-research (RSS, shallow)
MANA_RESEARCH_URL=http://localhost:3068   # gemini-deep-research (deep, v0.7+)
MANA_AI_DEEP_RESEARCH_ENABLED=false       # opt-in gate for Max tasks
MANA_SERVICE_KEY=dev-service-key
TICK_INTERVAL_MS=60000
TICK_ENABLED=true    # flip to false to boot HTTP-only (for Docker health-check)
```

## Architecture

```
┌────────────────────┐
│  mana-ai (Bun)     │
│    :3067           │
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
│   ├── cron/tick.ts                — Scan loop, overlap-guarded. v0.7: cross-tick
│   │                                 deep-research state machine in
│   │                                 handleDeepResearch()
│   ├── clients/
│   │   └── mana-research.ts        — v0.7: HTTP client for mana-research's
│   │                                 internal /research/async endpoints
│   ├── db/
│   │   ├── connection.ts           — postgres.js pool
│   │   ├── migrate.ts              — schema bootstrap (mission_snapshots,
│   │   │                             decrypt_audit, agent_snapshots,
│   │   │                             token_usage, mission_research_jobs)
│   │   ├── missions-projection.ts  — sync_changes → Mission LWW replay
│   │   └── research-jobs.ts        — v0.7: CRUD for mission_research_jobs
│   ├── planner/
│   │   ├── llm-client.ts           — mana-llm HTTP client (OpenAI-compatible)
│   │   └── news-research-client.ts — mana-api RSS-based news-research
│   │                                 (shallow pre-planning step)
│   └── middleware/service-auth.ts  — X-Service-Key gate for /internal/*
├── Dockerfile
├── package.json
├── tsconfig.json
└── CLAUDE.md
```
