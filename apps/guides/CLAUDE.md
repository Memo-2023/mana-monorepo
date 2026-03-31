# Guides — CLAUDE.md

Mana Guides is a local-first step-by-step guide app (SOPs, recipes, tutorials, learning paths).
Port: **5200** (web), **3027** (server)
Theme: Teal `#0d9488`
Tier: `beta`

## Apps

| App | Package | Port | Description |
|-----|---------|------|-------------|
| `apps/web` | `@guides/web` | 5200 | SvelteKit 5 local-first UI |
| `apps/server` | `@guides/server` | 3025 | Hono/Bun compute server (import, share) |

## Dev Commands

```bash
pnpm dev:guides:web      # Web only
pnpm dev:guides:server   # Server only
pnpm dev:guides:app      # Server + web
pnpm dev:guides:local    # Sync + server + web (no auth)
pnpm dev:guides:full     # Auth + sync + server + web
```

## Architecture

**Local-first**: All CRUD goes through `guidesStore` (Dexie.js IndexedDB), synced via mana-sync.
**Server (port 3025)**: Compute-only — web import via mana-search + mana-llm, shareable links.

### Data Model

```
LocalGuide         → has many LocalSection, LocalStep
LocalSection       → has many LocalStep (order field)
LocalStep          → belongs to LocalGuide, optional LocalSection
LocalCollection    → has many LocalGuide (ordered list)
LocalRun           → belongs to LocalGuide, stepStates: Record<stepId, StepState>
```

### Collections

| Collection | Index | Description |
|------------|-------|-------------|
| `guides` | category, difficulty, collectionId | Guide library |
| `sections` | guideId, order | Optional sections within a guide |
| `steps` | guideId, sectionId, order | Steps (instruction/warning/tip/checkpoint/code) |
| `collections` | type | Path or Library groupings |
| `runs` | guideId, startedAt | Execution history |

## Routes

```
/                        Library (guide grid, search, filters)
/guide/[id]              Guide detail + edit mode + run history
/guide/[id]/run          Run mode (?mode=scroll|focus)
/collections             Collections grid
/collections/[id]        Collection detail with progress
/history                 All run history
/shared/[token]          Public shared guide (no auth needed) — Phase 4
/(auth)/login            Login page
```

## Server Routes (port 3025)

```
POST /api/v1/import/url    → fetch URL → mana-search extract → mana-llm → { guide, sections }
POST /api/v1/import/text   → raw text/markdown → mana-llm → { guide, sections }
POST /api/v1/import/ai     → AI prompt → mana-llm → { guide, sections }
POST /api/v1/share         → create shareable link (7-day TTL) → { token, url, expiresAt }
GET  /api/v1/share/:token  → retrieve shared guide snapshot
GET  /health               → service health check
```

## Environment Variables

```env
# Web
PUBLIC_SYNC_SERVER_URL=ws://localhost:3050
PUBLIC_GUIDES_SERVER_URL=http://localhost:3027

# Server
PORT=3027
CORS_ORIGINS=http://localhost:5200
MANA_SEARCH_URL=http://localhost:3021
MANA_LLM_URL=http://localhost:3030
PUBLIC_BASE_URL=http://localhost:5200
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/data/local-store.ts` | 5 Dexie collections with TypeScript types |
| `apps/web/src/lib/data/guest-seed.ts` | 3 demo guides, 1 collection for onboarding |
| `apps/web/src/lib/stores/guides.svelte.ts` | Guide/section/step/collection mutations |
| `apps/web/src/lib/stores/runs.svelte.ts` | Run start/step state/complete mutations |
| `apps/web/src/routes/(app)/guide/[id]/run/+page.svelte` | Scroll + focus run modes |
| `apps/server/src/routes/import.ts` | URL/text/AI import via mana-llm |
| `apps/server/src/routes/share.ts` | Shareable guide links (in-memory MVP) |

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | Done | Core CRUD, local-first, guest seed, library/detail/run views |
| 2 | Done | Collections, StepEditorModal, CollectionEditModal, inline step add |
| 3 | In progress | Hono server (import + share done), ImportModal frontend, share button |
| 4 | Planned | DB persistence for shares, /shared/[token] public route, XP/gamification |
