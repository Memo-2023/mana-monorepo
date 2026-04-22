# docs/optimizable — Known Improvements Register

Per-topic tracking docs for known-but-unshipped improvements. Run
`pnpm run audit:*` for live metrics on any item marked "OPEN" below.

## 🔴 Release blockers

### Tier-patch revert

MANA_APPS were patched to `guest` tier locally on 2026-04-10 for pre-release
testing. **Must revert before production release.** Production tiers
are in commit `7df515434` but the working copy may still override.

Context: memory entry `project_tier_patch_resolved.md`
(`/Users/till/.claude/projects/.../memory/`). Check
`packages/shared-branding/src/mana-apps.ts` and revert any
`requiredTier: 'guest'` patches before cutting a release.

## 🟠 Tracked open debt

Each topic has its own tracker. Status as of 2026-04-22.

| Topic | Tracker | Status |
|---|---|---|
| Frontend theming | [frontend-consistency-improvements.md](frontend-consistency-improvements.md) | Theming migration SHIPPED (ListViews, transition-all, a11y). i18n + icon bloat + cross-surface parity still OPEN. |
| i18n coverage | [i18n-migration-inventory.md](i18n-migration-inventory.md) | 65 / 78 modules hardcode German. Per-module work. |
| Test health | [test-health.md](test-health.md) | 34 / 653 tests failing (spaces-foundation WIP). 66 / 78 modules without any tests. |
| Manual test backlog | [manual-test-backlog.md](manual-test-backlog.md) | Code-complete features still waiting on a human click-through before release. |
| Bundle size | [bundle-analysis.md](bundle-analysis.md) | /invoices split SHIPPED (-516 KB). Icons + layout OPEN. |
| Foundation services | [foundation-layer-improvements.md](foundation-layer-improvements.md) | Contacts/Todo/Calendar architecture notes. |
| AI Workbench audit | [ai-workbench-audit-2026-04-16.md](ai-workbench-audit-2026-04-16.md) | Point-in-time audit snapshot. |

## 🟡 Small open items (no dedicated tracker yet)

### Module-structure consistency audit

Not every module has a DetailView. Some have master-detail (todo,
notes, calendar), some are single-surface (calc, moodlit), some have
standalone routes (presi/deck/[id]). An audit of which modules
implement the full module-config pattern (ListView + DetailView +
components/ + queries.ts + stores/) vs which are partial would give a
sense of how strict the module SSoT actually is.

**Suggested artefact:** `docs/optimizable/module-structure.md` +
`scripts/audit-module-structure.mjs` listing which collections are
defined vs missing per module.

### Plan-inventory hygiene

`docs/plans/` holds ~40 `.md` files. Some shipped (spaces-foundation,
news-research, library M1), some are in-flight (library M2–M8, AI
Workbench follow-ups, space-scoped data model Modell β), some are
stale. No single "which plans are alive / dead / shipped" index.

**Suggested artefact:** one-liner status table in `docs/plans/README.md`
(SHIPPED / IN-FLIGHT / DRAFT / STALE with date).

### Memory-hygiene post-release

After the release (tier-patch revert + go-live), several memory
entries become historical:

- `project_tier_patch_resolved.md` — switch from "ACTIVE AGAIN for
  testing" to "resolved". Or delete once the risk is gone.
- `project_spaces_foundation.md` — mark "SHIPPED 2026-04-20" as
  post-release state.
- `project_news_research_module.md` / `project_library_module.md` /
  `project_ai_workbench_rollout.md` — prune if follow-ups are no
  longer relevant.

No automation needed; a single post-release memory pass clears it.

### Cross-surface theme parity

See [frontend-consistency-improvements.md §6](frontend-consistency-improvements.md#6-cross-surface-theme-parity--open)
for the landing / mobile / games audit.

## How to find live numbers

```bash
pnpm run audit:all               # port-drift + i18n + test-coverage (summary)
pnpm run audit:bundle            # bundle size + content hints
pnpm run audit:icon-usage        # Phosphor icon inventory
pnpm run audit:i18n-coverage     # per-module hardcoded-string scan
pnpm run audit:port-drift        # CLAUDE.md ↔ code port drift
pnpm run audit:test-coverage     # file-level test presence
```

`validate:all` (pre-push gate) is the complementary set — things that
would fail a push, not just report. See `package.json` scripts.

## Historical context

Frontend-consistency tracker (this directory's original content) has
been substantially completed: the 21 Tailwind ListViews, `transition-all`,
a11y, neutral-palette, and theme-token migrations all shipped on
2026-04-22. What remains is the next layer — i18n, icons, bundle,
cross-surface — documented above.
