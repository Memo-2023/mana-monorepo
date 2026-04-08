# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mana** is the unified web application serving 27+ product modules (todo, calendar, contacts, chat, notes, dreams, memoro, cards, picture, presi, music, storage, …) under one SvelteKit app, one IndexedDB, one auth session, and one deployment at **mana.how**.

- **Web App** (`apps/web`): SvelteKit 2 + Svelte 5 unified app — the main surface
- **Mobile App** (`apps/mobile`): Expo / React Native (work-in-progress, separate codebase)
- **Landing** (`apps/landing`): Astro static landing page deployed to Cloudflare Pages

## Architecture

### Unified Module System

All modules share one SvelteKit build. Each module lives in `apps/web/src/lib/modules/{name}/` and registers itself via a `module.config.ts` file. The data layer uses a single Dexie IndexedDB (`mana`) containing all 120+ collections from every module — table names that collide across modules are prefixed (e.g. `todoProjects`, `cardDecks`, `presiDecks`).

Module state lives in three files per module:

| File | Role |
|------|------|
| `collections.ts` | Dexie table references + (sometimes) seed data |
| `queries.ts` | Read-side: Dexie liveQuery hooks, type converters, pure helpers for `$derived` |
| `stores/*.svelte.ts` | Write-side: mutation methods, no reads (those go through queries.ts) |

### Authentication

**Mana Auth** is the central authentication service (`services/mana-auth/`, port 3001), built on Better Auth + Hono + Bun. The web app talks to it via the shared `@mana/shared-auth` client.

- **Token format**: EdDSA JWT with minimal claims (`sub`, `email`, `role`, `sid`, `tier`)
- **Session storage**: Cookies (`*.mana.how` domain) + JWT in memory
- **Route protection**: `(app)` group is auth-gated via the `AuthGate` component in the layout
- **Cross-app SSO**: Same Mana Auth session works across all `*.mana.how` apps
- **Access tiers**: `guest` < `public` < `beta` < `alpha` < `founder` — apps can require a minimum tier via `mana-apps.ts`

The legacy Supabase integration was removed. Anything mentioning `@supabase/ssr`, `safeGetSession()`, or `event.locals.supabase` is a leftover from a much earlier iteration and should be deleted on sight.

### Data Layer (Local-First)

The app reads and writes to IndexedDB **first**, then syncs to the server in the background via the **mana-sync** Go service (port 3050).

Architecture diagram:

```
User action (e.g. tasksStore.createTask)
        │
        ▼
Module store builds the LocalRecord
        │
        ▼
encryptRecord(tableName, record)        ← Phase 4–9 encryption layer
        │
        ▼
table.add(encryptedRecord)              ← Dexie write
        │
        ▼
Dexie hooks (database.ts):
  - stamp userId
  - stamp __fieldTimestamps per field
  - record into _pendingChanges
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

For the deep dive — sync engine, retry/backoff, quota recovery, telemetry, RLS, encryption rollout — read **`apps/web/src/lib/data/DATA_LAYER_AUDIT.md`**. This is the single most important file for understanding how the app works under the hood.

### At-Rest Encryption

User-typed content in **27 tables** is encrypted with **AES-GCM-256** before it touches IndexedDB. The master key lives in `mana-auth` (KEK-wrapped) and is fetched on login.

Two trust modes:

| Mode | Default | What Mana can decrypt |
|------|---------|----------------------|
| Standard | ✅ Yes | The user's master key, via the server-side KEK |
| Zero-Knowledge | Opt-in (Settings → Sicherheit) | Nothing — recovery code lives only with the user |

**When writing module code that touches sensitive fields:**

1. Add the table to `apps/web/src/lib/data/crypto/registry.ts` with the field allowlist
2. Wrap writes: `await encryptRecord(tableName, record)` before `table.add()` / `table.update()`
3. Wrap reads: `decryptRecords(tableName, visible)` after the Dexie query, before the type converter
4. The Dexie hook in `database.ts` does NOT auto-encrypt — every store does it explicitly. This is by design (Web Crypto is async, hooks are sync).

For new sensitive fields, default to **encrypt**. For new structural fields (IDs, timestamps, enums, sort/filter keys), default to **plaintext**.

User-facing docs at `apps/docs/src/content/docs/architecture/security.mdx`.

### Routing Structure

```
apps/web/src/routes/
├── (auth)/              # Public auth pages (login, register, recovery)
├── (app)/               # Auth-gated app surface — 27+ module routes
│   ├── dashboard/       # Customizable widget grid
│   ├── settings/
│   │   └── security/    # Vault status + recovery code + ZK opt-in
│   ├── todo/            # …and many more module routes
│   └── …
├── workbench/           # Multi-pane interface (ListView + DetailView per module)
└── api/                 # SvelteKit API endpoints (rare; most data is local-first)
```

### Path Aliases

Defined in `apps/web/svelte.config.js`:

- `$lib` → `src/lib`
- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$utils` → `src/lib/utils`
- `$types` → `src/lib/types`
- `$server` → `src/lib/server`

## Development Commands

### Web App (apps/web)

```bash
cd apps/web

# Development
pnpm dev                # Start dev server on port 5173

# Building
pnpm build              # Build for production
pnpm preview            # Preview production build

# Code Quality
pnpm check              # Type-check with svelte-check
pnpm lint               # Format check + ESLint
pnpm format             # Prettier write

# Testing
pnpm test               # Run Vitest unit tests
pnpm test:ui            # Run Vitest with UI
pnpm test:e2e           # Run Playwright E2E tests
```

For full local-dev setup (Mana Auth + mana-sync + web together), use the root-level `dev:*:full` commands. See `docs/LOCAL_DEVELOPMENT.md` and the root `CLAUDE.md`.

### Mobile App (apps/mobile)

The mobile app is currently lower-priority than the web app and may lag behind in features. Standard Expo commands apply (`pnpm start`, `pnpm ios`, `pnpm android`, EAS builds for production).

## Environment Configuration

Generated automatically from the root `.env.development` via `pnpm setup:env`. The relevant variables for the web app:

```env
PUBLIC_MANA_AUTH_URL=http://localhost:3001
PUBLIC_MANA_SYNC_URL=http://localhost:3050
```

The web app does NOT read or store any database credentials directly — all server-side data goes through Mana Auth + mana-sync. See the root `CLAUDE.md` for the full env-var rundown.

## Technology Stack

### Web App

- **Framework**: SvelteKit 2 + Svelte 5 (runes mode throughout)
- **Styling**: TailwindCSS
- **Auth**: Mana Auth (Better Auth + EdDSA JWT) via `@mana/shared-auth`
- **Data**: Local-first with Dexie.js + mana-sync (Go) backend
- **Encryption**: AES-GCM-256 via Web Crypto, server-wrapped MK with optional zero-knowledge mode
- **Testing**: Vitest (unit + integration with fake-indexeddb), Playwright (E2E)
- **Build**: Vite

### Mobile App

- **Framework**: Expo + React Native
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind
- **Build**: EAS Build

## Important Patterns

### Module Store Pattern

Every module has a mutation-only store that handles writes + a queries file that handles reads. The store NEVER reads from Dexie via `await table.toArray()` for UI rendering — that's the queries file's job (via liveQuery hooks). The store only reads when it needs to mutate based on existing state (e.g. toggle, increment).

```typescript
// modules/todo/stores/tasks.svelte.ts
import { taskTable } from '../collections';
import { encryptRecord } from '$lib/data/crypto';
import { toTask } from '../queries';

export const tasksStore = {
  async createTask(input: {...}) {
    const newLocal: LocalTask = { ...input, id: crypto.randomUUID() };
    const plaintextSnapshot = toTask({ ...newLocal });
    await encryptRecord('tasks', newLocal);
    await taskTable.add(newLocal);
    return plaintextSnapshot;
  },
  // ...
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

### Svelte 5 Runes Mode

All routes and components use Svelte 5 runes:

```typescript
// CORRECT
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => {
  console.log(count);
});

// WRONG (legacy Svelte 3/4)
let count = 0;
$: doubled = count * 2;
```

### Auth Access

Auth state lives in `$lib/stores/auth.svelte.ts`. The current user id is also pushed into the data layer's `current-user.ts` so the Dexie creating-hook can auto-stamp `userId` on every record. Module stores never need to know who the current user is.

### Route Protection

The `(app)` group is wrapped by an `AuthGate` component that redirects unauthenticated users to `/login` and reads the access tier from the JWT to gate beta/alpha/founder-only modules.

## Reference Documents

| Path | Purpose |
|------|---------|
| `apps/web/src/lib/data/DATA_LAYER_AUDIT.md` | Complete data-layer architecture, sync engine, encryption rollout, threat model, backlog |
| `apps/docs/src/content/docs/architecture/security.mdx` | User-facing security & encryption walkthrough |
| `apps/docs/src/content/docs/architecture/authentication.mdx` | Auth flow + JWT structure |
| Root `CLAUDE.md` | Monorepo overview, dev commands, sibling services |
