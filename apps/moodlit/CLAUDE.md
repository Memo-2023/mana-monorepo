# Moodlit — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/moodlit/apps/server/` and `apps/moodlit/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/moodlit/routes.ts`](../api/src/modules/moodlit/routes.ts)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/moodlit/`](../mana/apps/web/src/lib/modules/moodlit/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/moodlit/`](../mana/apps/web/src/routes/(app)/moodlit/)
- **Landing page** (still standalone): [`apps/moodlit/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Moodlit" guide was deleted in the audit cleanup
of 2026-04-09 — it had been inaccurate since the consolidation.
Pre-consolidation reference is in git history.
