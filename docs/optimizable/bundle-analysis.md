# Bundle Analysis

**Snapshot 2026-04-22.** Run `pnpm run audit:bundle` after any `pnpm --filter @mana/web build` for live numbers.

## Snapshot

| Category | Size | % | Notes |
|---|---|---|---|
| entry | 92 KB | 0% | app.js + start.js — first JS a cold browser loads |
| nodes | 2.77 MB | 9% | per-route layout/page bundles (230 files) |
| chunks | 5.59 MB | 18% | shared code-split modules (711 files) |
| workers | 22.31 MB | 70% | transformers.js ONNX WASM — lazy until LLM/STT opened |
| assets | 1.04 MB | 3% | CSS, fonts, images |
| **total** | **31.80 MB** | | 1147 files |

Entry is tiny (92 KB). That's healthy. The 22 MB in `workers/` is
`ort-wasm-simd-threaded.asyncify-*.wasm` — the ONNX Runtime for
transformers.js. It's only fetched when the browser actually
instantiates the Web Worker (first use of `@mana/local-llm` or
`@mana/local-stt`). Most users never hit it.

## Biggest shared chunks

Top entries in `chunks/` ≥ 200 KB, with what's actually inside:

| Size | File | Content | Verdict |
|---|---|---|---|
| 797 KB | SDMVbHi1 | `@zxcvbn-ts/language-de` German dictionary | ✓ **lazy** — dynamic import in `PasswordStrength.svelte`, only on register / recovery |
| 454 KB | bdamX4EN | `@zxcvbn-ts/language-common` keyboard adjacency graphs | ✓ **lazy** — same import path |
| 317 KB | DtX-t1si | `@mana/shared-icons` (Phosphor SVG paths) | ⚠ **partly eager** — imported by many routes; see notes |
| 220 KB | BbeX9yAb | Vite `__vite__mapDeps` import-graph | ✓ **metadata only**, not real code |
| 162 KB | Bqmpszdn | (unknown) | below threshold |

## Biggest route bundles

Routes loaded per navigation (not eagerly):

| Size | Route | Note |
|---|---|---|
| 534 KB | `/(app)/invoices/[id]` | **heaviest route.** Likely swissqrbill + pdf-lib. Investigate — could split the QR-bill generator behind `await import()` so preview/list pages stay small. |
| 380 KB | `/(app)/broadcasts/[id]/edit` | Tiptap editor — unavoidable, tiptap is ~250 KB baseline |
| 260 KB | node 2 (root `(app)` layout) | All app-wide chrome: shell, stores, auth guard |
| 95 KB | `/(app)/calendar` | Acceptable; rrule is shared |
| 85 KB | `/(app)/todo` | Acceptable |

## Priority improvements

### 1. `/invoices/[id]` code-split — ✅ **SHIPPED 2026-04-22**

**Before:** 534 KB route bundle. **After:** 18.6 KB.

`DetailView.svelte` + `SendModal.svelte` now import `./pdf/renderer`
dynamically (`await import(...)`) so pdf-lib + swissqrbill/svg (~576 KB
combined) move into a separate chunk that only loads when the user
actually opens an invoice detail. Also split `generateSCORReference`
into its own `./pdf/scor.ts` so the invoices store can compute a
reference on create without pulling the heavy renderer graph.

### 2. `@mana/shared-icons` — **OPEN**

466 KB of Phosphor SVG paths across 2 chunks. Root cause from
`audit:icon-usage` report (2026-04-22):

- **204 distinct icons** imported across the codebase.
- **199 use the default "regular" weight** — but Phosphor ships all
  6 weights per icon regardless.
- Single worst offender: `app-registry/apps.ts` imports **69 icons**
  in one file (the module-name → icon-component map), pulled into the
  shared layout chunk → 69 × 6 weights × ~0.7 KB ≈ 290 KB on every
  cold load.

**Migration paths** (pick one, sized to follow-up sessions):

1. Rewrite `app-registry/apps.ts` so each module's icon is a string
   name, with a lazy `getIconComponent(name)` helper backed by
   per-path dynamic imports (`() => import('phosphor-svelte/House')`).
   Saves ~290 KB from the initial layout chunk. Biggest single win.
2. Drop `export * from 'phosphor-svelte'` in
   `packages/shared-icons/src/index.ts` and re-export only the 204
   icons actually used. Defends against future barrel-broadening.
3. Longest-term: build a custom icon set that only ships the weights
   actually used (most icons only need "regular").

Run `pnpm run audit:icon-usage --top 30` for the current inventory.

### 3. Root `(app)` layout (260 KB) — **OPEN**

`routes/(app)/+layout.svelte` statically imports ~15 start/stop
lifecycle hooks (mission tick, server-iteration executor, event store,
event bridge, streak tracker, goal tracker, byok init, tools init,
articles-from-news migration, reminder scheduler, llm queue). Each
pulls its own dependency graph into the shared layout chunk.

**Recommended approach:** wrap the non-critical ones in `queueMicrotask`
or `requestIdleCallback`-deferred dynamic imports — the layout finishes
hydrating, then the heavy lifecycle code streams in. The one-shot
`runArticlesFromNewsMigration` in particular is a prime candidate since
it's executed only once per user per session.

## What's already good

- Entry bundle is 92 KB — no bloat in the critical path.
- 22 MB of WASM (transformers.js) is correctly behind Web Workers —
  cold visitors don't pay for it.
- zxcvbn (1.25 MB German dict + keyboard graphs) is correctly behind a
  dynamic import in PasswordStrength.svelte — only register / recovery
  / password-change surfaces load it.
- Route-level code-splitting is working: 230 separate route bundles,
  median ~12 KB.

## Usage

```bash
pnpm --filter @mana/web build          # prerequisite
pnpm run audit:bundle                   # full report
pnpm run audit:bundle --top 30          # show top N chunks
pnpm run audit:bundle --summary         # category totals only
```

Heuristic rules: chunks in `chunks/` with ≥ 200 KB get a ⚠ flag.
Route bundles (`nodes/`) and worker bundles (`workers/`) are
always-lazy and don't get flagged. The content-hint regex knows about
transformers.js, zxcvbn, tiptap, pdf-lib, swissqrbill, rrule, suncalc,
dexie, marked, pako, date-fns, zod, svelte-dnd-action, svelte-i18n,
WASM, Phosphor icons, and Vite's own mapDeps metadata.
