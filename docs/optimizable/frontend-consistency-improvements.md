# Frontend Consistency Improvements

Tracked improvements for UI / styling consistency across the Mana
unified app.

## 1. ListView theme-token migration — ✅ **SHIPPED 2026-04-22**

All 76 module ListViews and the broader `lib/modules/**` + `routes/(app)/**`
surface now use theme tokens (`text-foreground`, `bg-muted`,
`border-border`, `--color-*` scoped CSS) instead of raw Tailwind
`white/N` or neutral-palette classes.

Enforced by three validators wired into `validate:all` + lint-staged:

- `validate:theme-variables` — CSS variable naming (`--muted` forbidden,
  `--color-muted` required)
- `validate:theme-utilities` — Tailwind class rules: no `(bg|text|border)-white/N`,
  no `(bg|text|border)-(gray|slate|zinc|neutral|stone)-N`
- `validate:theme-parity` — 25 tokens × 9 theme variants parity check

See `packages/shared-tailwind/brand-literals.md` for the register of
intentional hex literals (period pink, calc retro skins, skilltree
branch accents, who deck colours, etc.).

## 2. `transition-all` sweep — ✅ **SHIPPED 2026-04-22**

All 98 `transition-all` occurrences replaced with specific transitions
(`transition-colors`, `transition-opacity`, `transition-[width]`,
`transition-[border-color,box-shadow]`, `transition-[transform,colors,box-shadow]`).
Prevents the P5 CSS-custom-property rendering bug where colours don't
resolve on first paint.

Codemod: `scripts/migrate-transition-all.mjs`.

## 3. a11y warnings — ✅ **SHIPPED 2026-04-22**

30 svelte-check warnings resolved; `pnpm check` now runs with
`--fail-on-warnings` so any regression blocks pre-push. Covers
a11y (missing keyboard handlers, missing labels), dead CSS selectors,
and Svelte 5 `$state` local-reference bugs.

## 4. i18n coverage — OPEN

65 / 78 modules still hardcode German in `.svelte` templates. The
translation infrastructure (`@mana/shared-i18n`, per-module locale
files for de / en / it / fr / es with ~3500 German strings) is fully
wired; what's missing is usage. See
[`i18n-migration-inventory.md`](i18n-migration-inventory.md) for the
priority list and per-module workflow. Run
`pnpm run audit:i18n-coverage` for live numbers.

Top offenders today: broadcast (26 hits), articles (24), events (23),
invoices (22), quiz + stretch (20 each), library (19), profile (17),
skilltree PARTIAL (15), calendar PARTIAL (14).

## 5. Phosphor icon bloat — OPEN

`@mana/shared-icons` contributes 466 KB of icon paths to the shared
bundle. See [`bundle-analysis.md`](bundle-analysis.md) §2. Biggest
offender: `app-registry/apps.ts` imports 69 icons statically for the
module-name → icon-component map — ~290 KB alone. Recommended fix:
lazy `getIconComponent(name)` helper backed by per-icon dynamic
imports.

Run `pnpm run audit:icon-usage` for the current inventory.

## 6. Cross-surface theme parity — OPEN

Not yet audited:

- **`apps/mana/apps/landing/`** (Astro) — does the landing page use
  the same theme tokens as the SvelteKit app, or a parallel system?
  Theme drift would mean Lume / Nature / Stone variants don't match
  between marketing and app.
- **`apps/memoro/apps/mobile/`** (Expo, RN) — the only remaining
  mobile surface. `@mana/shared-theme` targets React Native; is the
  token set aligned with the web `--color-*` palette?
- **`games/`** (arcade, voxelava, whopixels, worldream) — separate
  Vite/Svelte apps; unlikely to be aligned with the main theme but
  worth confirming.
