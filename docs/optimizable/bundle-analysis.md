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

1. **`/invoices/[id]` code-split** — 534 KB is large. `swissqrbill`
   and `pdf-lib` are probably both eagerly imported. Wrap the PDF/QR
   generation path with `await import('swissqrbill')` so the route
   bundle drops to ~150 KB for the list/display case. Real win for
   Swiss-bill users on 3G / slow laptops.

2. **`@mana/shared-icons` chunking** — 317 + 149 KB of Phosphor SVG
   paths across two chunks. Phosphor doesn't tree-shake well because
   its icons are named exports of a single module. Either:
   - migrate to tree-shakable per-icon imports, OR
   - lazy-load rarely-used icons in the module that imports them
   instead of the shared chunk.

3. **Root `(app)` layout (260 KB)** — on the high side for "just the
   shell". Investigate whether any module-specific stores / AI pipeline
   bits are leaking into the shared layout when they could be
   route-scoped.

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
