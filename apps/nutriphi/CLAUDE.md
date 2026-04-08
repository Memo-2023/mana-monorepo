# NutriPhi — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/nutriphi/apps/backend/` and `apps/nutriphi/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/nutriphi/routes.ts`](../api/src/modules/nutriphi/routes.ts) (Gemini meal-photo analysis + text analysis + recommendations)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/nutriphi/`](../mana/apps/web/src/lib/modules/nutriphi/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/nutriphi/`](../mana/apps/web/src/routes/(app)/nutriphi/)
- **Landing page** (still standalone): [`apps/nutriphi/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "NutriPhi Project Guide" was deleted in the
audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. Pre-consolidation reference is in git history.
