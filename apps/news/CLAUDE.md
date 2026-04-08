# News Hub — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/news/apps/server/` and `apps/news/apps/web/` directories
have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/news/routes.ts`](../api/src/modules/news/routes.ts) (Mozilla Readability extraction, AI feed)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/news/`](../mana/apps/web/src/lib/modules/news/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/news/`](../mana/apps/web/src/routes/(app)/news/)
- **Landing page** (still standalone): [`apps/news/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "News Hub" guide was deleted in the audit cleanup
of 2026-04-09 — it had been inaccurate since the consolidation.
Pre-consolidation reference is in git history.
