# Food — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/food/apps/backend/` and `apps/food/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/food/routes.ts`](../api/src/modules/food/routes.ts) (Gemini meal-photo analysis + text analysis + recommendations)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/food/`](../mana/apps/web/src/lib/modules/food/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/food/`](../mana/apps/web/src/routes/(app)/food/)
- **Landing page** (still standalone): [`apps/food/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Food Project Guide" was deleted in the
audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. Pre-consolidation reference is in git history.
