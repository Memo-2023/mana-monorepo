# CLAUDE.md — Mana Unified App

Project-level guidance for `apps/mana/`. For monorepo-wide patterns (auth, services, dev commands, env vars), see the **[root `CLAUDE.md`](../../CLAUDE.md)**.

## Project Overview

**Mana** is the unified web app at **mana.how**, serving 27+ product modules (todo, calendar, contacts, chat, notes, dreams, memoro, cards, picture, presi, music, storage, …) under one SvelteKit build, one IndexedDB, one auth session, one deployment.

```
apps/mana/apps/
├── web/        # SvelteKit 2 + Svelte 5 unified app — the main surface
├── mobile/     # Expo / React Native (lower priority, may lag)
└── landing/    # Astro static landing → Cloudflare Pages
```

## Module System

Each module lives in `apps/web/src/lib/modules/{name}/` and registers itself via `module.config.ts`. Module state is split into three files:

| File | Role |
|------|------|
| `collections.ts` | Dexie table references + (sometimes) seed data |
| `queries.ts` | **Read-side** — Dexie liveQuery hooks, type converters, pure helpers for `$derived` |
| `stores/*.svelte.ts` | **Write-side** — mutation methods. Never reads for UI rendering (queries.ts does that). Only reads when a mutation needs existing state (toggle, increment). |

### Module store pattern

```typescript
// modules/todo/stores/tasks.svelte.ts
export const tasksStore = {
  async createTask(input: {...}) {
    const newLocal: LocalTask = { ...input, id: crypto.randomUUID() };
    const plaintextSnapshot = toTask({ ...newLocal });
    await encryptRecord('tasks', newLocal);
    await taskTable.add(newLocal);
    return plaintextSnapshot;
  },
};
```

```typescript
// modules/todo/queries.ts
export function useAllTasks() {
  return useLiveQueryWithDefault(async () => {
    const locals = await db.table<LocalTask>('tasks').orderBy('order').toArray();
    const visible = locals.filter((t) => !t.deletedAt);
    const decrypted = await decryptRecords('tasks', visible);
    return decrypted.map(toTask);
  }, [] as Task[]);
}
```

## Data Layer (Local-First)

The app reads and writes IndexedDB **first**, then syncs to **mana-sync** (Go, port 3050) in the background. One Dexie database (`mana`) holds 120+ collections from every module — colliding table names get a module prefix (e.g. `todoProjects`, `cardDecks`, `presiDecks`).

```
User action (e.g. tasksStore.createTask)
        │
        ▼
Module store builds the LocalRecord
        │
        ▼
encryptRecord(tableName, record)
        │
        ▼
table.add(encryptedRecord)            ← Dexie write
        │
        ▼
Dexie hooks (database.ts):
  - stamp userId
  - stamp __fieldTimestamps per field
  - stamp __lastActor + __fieldActors (user / ai / system — see AI Workbench)
  - record into _pendingChanges  (tagged with appId + actor)
  - record into _activity
        │
        ▼
Sync engine (sync.ts) — debounced 1s
  - groups changes by appId
  - POSTs to mana-sync
        │
        ▼
mana-sync → PostgreSQL with field-level LWW + RLS
        │
        ▼
Other clients pull via SSE / polling
        │
        ▼
applyServerChanges → Dexie hooks (suppressed) → liveQuery → decryptRecord → UI
```

**Deep dive**: [`apps/web/src/lib/data/DATA_LAYER_AUDIT.md`](apps/web/src/lib/data/DATA_LAYER_AUDIT.md) — sync engine, retry/backoff, quota recovery, telemetry, RLS, encryption rollout, threat model. **Single most important file for understanding how the app works under the hood.**

## At-Rest Encryption

User-typed content in **27 tables** is encrypted with **AES-GCM-256** before it touches IndexedDB. Master key lives in `mana-auth` (KEK-wrapped) and is fetched on login.

| Mode | Default | What Mana can decrypt |
|------|---------|----------------------|
| Standard | ✅ Yes | The user's master key, via the server-side KEK |
| Zero-Knowledge | Opt-in (Settings → Sicherheit) | Nothing — recovery code lives only with the user |

**When writing module code that touches sensitive fields:**

1. Add the table to `apps/web/src/lib/data/crypto/registry.ts` with the field allowlist
2. `await encryptRecord(tableName, record)` before `table.add()` / `table.update()`
3. `await decryptRecords(tableName, visible)` after the Dexie query, before the type converter
4. The Dexie hook in `database.ts` does NOT auto-encrypt — every store does it explicitly. This is by design (Web Crypto is async, hooks are sync).

Defaults: **encrypt** for new user-typed text fields; **plaintext** for IDs / timestamps / sort keys / enum discriminators.

User-facing docs: `apps/docs/src/content/docs/architecture/security.mdx`.

## Routing

```
apps/web/src/routes/
├── (auth)/              # Public auth pages (login, register, recovery)
├── (app)/               # Auth-gated app surface — 27+ module routes
│   ├── dashboard/       # Customizable widget grid
│   ├── settings/
│   │   └── security/    # Vault status + recovery code + ZK opt-in
│   ├── todo/            # …and many more module routes
│   └── …
└── api/                 # SvelteKit API endpoints (rare; most data is local-first)
```

The `(app)` group is wrapped by `AuthGate`, which redirects unauthenticated users to `/login` and reads the access tier from the JWT to gate beta/alpha/founder-only modules.

**Legacy Supabase**: removed. Anything mentioning `@supabase/ssr`, `safeGetSession()`, or `event.locals.supabase` is leftover from a much earlier iteration and should be deleted on sight.

## Path Aliases (`apps/web/svelte.config.js`)

`$lib` → `src/lib` · `$components` → `src/lib/components` · `$stores` → `src/lib/stores` · `$utils` → `src/lib/utils` · `$types` → `src/lib/types` · `$server` → `src/lib/server`

## Auth Access Pattern

Auth state lives in `$lib/stores/auth.svelte.ts`. The current user id is also pushed into `$lib/data/current-user.ts` so the Dexie creating-hook can auto-stamp `userId` on every record. **Module stores never need to know who the current user is** — they just write, and the hook stamps the right userId.

## Development Commands

For full local-dev (Mana Auth + mana-sync + web together), use the root-level `pnpm run mana:dev` or `pnpm dev:*:full` commands. See [root `CLAUDE.md`](../../CLAUDE.md) and [`docs/LOCAL_DEVELOPMENT.md`](../../docs/LOCAL_DEVELOPMENT.md).

Web-app-only:

```bash
cd apps/mana/apps/web
pnpm dev          # Dev server on :5173
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # svelte-check type check
pnpm lint         # Format check + ESLint
pnpm format       # Prettier write
pnpm test         # Vitest (unit + integration with fake-indexeddb)
pnpm test:e2e     # Playwright
```

## Tech Stack

- **Web**: SvelteKit 2 + Svelte 5 (runes mode), TailwindCSS, Vite
- **Auth**: Mana Auth (Better Auth + EdDSA JWT) via `@mana/shared-auth`
- **Data**: Dexie.js (local-first) + mana-sync (Go) backend
- **Encryption**: AES-GCM-256 via Web Crypto, server-wrapped MK with optional zero-knowledge
- **Local AI**: `@mana/local-llm` (Gemma 4 E2B, WebGPU) + `@mana/local-stt` (Whisper, WebGPU) — both run entirely in-browser via transformers.js
- **Testing**: Vitest, Playwright
- **Mobile**: Expo, Expo Router, NativeWind, EAS Build

Svelte 5 runes are mandatory — no legacy `let count = 0; $: doubled = count * 2`. Always `$state`, `$derived`, `$effect`. See [`.claude/guidelines/sveltekit-web.md`](../../.claude/guidelines/sveltekit-web.md).

## AI Workbench

The companion is a **second actor** that works alongside the human in every module. Full pipeline live end-to-end:

- **Actor attribution** — every event, record, and sync row carries `{ kind, principalId, displayName }` (+ mission/iteration/rationale for AI). `principalId` is the userId / agentId / `system:<source>` sentinel; `displayName` is cached at write time so rename doesn't rewrite history. Factories in `@mana/shared-ai/src/actor.ts`; runtime ambient context in `src/lib/data/events/actor.ts`.
- **Agents** — named AI personas that own Missions. `/ai-agents` module for CRUD (policy editor, memory, budget, concurrency). Default "Mana" agent auto-bootstrapped on first login; legacy missions backfilled. `data/ai/agents/{store,queries,bootstrap}.ts`.
- **AI policy** — per-tool `auto | propose | deny`. Lives on the agent (`agent.policy`). Proposable tool names come from `@mana/shared-ai`'s `AI_PROPOSABLE_TOOL_NAMES`; the mana-ai service runs a boot-time drift guard against the same list. Resolution in `src/lib/data/ai/policy.ts`; executor loads `agent.policy` for every AI write.
- **Proposal inbox** — drop `<AiProposalInbox module="…" />` into any module page to render pending proposals inline with approve / freitext-reject buttons. Cards show the owning agent's name + avatar chip. Wired in `/todo`, `/calendar`, `/places`, `/drink`, `/food`.
- **Missions** — long-lived autonomous work items at `/ai-missions` with concept + objective + linked inputs + cadence + **owning agent** (AgentPicker in the create flow). Both the foreground tick AND the server-side `mana-ai` service produce plans under the agent's identity; `data/ai/missions/server-iteration-staging.ts` translates server-source iterations into local Proposals on sync.
- **Input picker** — `<MissionInputPicker>` sources candidates from the `input-index` registry (notes / kontext / goals / tasks / calendar). The Runner resolves via the parallel `input-resolvers` registry. Encrypted tables (notes, tasks, …) decrypt client-side only.
- **Scene lens** — workbench scenes can bind to an agent via `scene.viewingAsAgentId` (context menu → "An Agent binden…"). Pure UI lens, not a data-scope change. `SceneAppBar` shows the agent avatar on bound scene tabs.
- **Workbench timeline** — `/ai-workbench` renders every AI-attributed event grouped by mission iteration with per-**agent** filter, per-module, per-mission. Each bucket header shows agent avatar + name + mission title. Per-bucket **Revert button** undoes the iteration's writes via `data/ai/revert/` (TaskCreated → delete, TaskCompleted → uncomplete, etc., newest-first). Separate **"Datenzugriff"** tab exposes the server-side decrypt audit (for missions with Key-Grants).

Full architecture (Planner prompt + parser in `@mana/shared-ai`, server-side runner, Postgres actor column, materialized snapshots, Multi-Agent gating, Prometheus metrics + status.mana.how integration): [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../../docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20 (AI Workbench) + §21 (Mission Grants) + §22 (Multi-Agent Workbench).

## Reference Documents

| Path | Purpose |
|------|---------|
| [`apps/web/src/lib/data/DATA_LAYER_AUDIT.md`](apps/web/src/lib/data/DATA_LAYER_AUDIT.md) | Data-layer + sync deep dive, encryption rollout, threat model, Actor attribution, backlog |
| [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../../docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md) | Companion brain + AI Workbench (Actor, Policy, Proposals, Missions roadmap) |
| `apps/docs/src/content/docs/architecture/security.mdx` | User-facing security walkthrough |
| `apps/docs/src/content/docs/architecture/authentication.mdx` | Auth flow + JWT structure |
| [Root `CLAUDE.md`](../../CLAUDE.md) | Monorepo overview, services, dev commands, env vars |
