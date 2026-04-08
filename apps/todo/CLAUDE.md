# Todo — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/todo/apps/backend/` and `apps/todo/apps/web/` directories
have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/todo/routes.ts`](../api/src/modules/todo/routes.ts)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/todo/`](../mana/apps/web/src/lib/modules/todo/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/todo/`](../mana/apps/web/src/routes/(app)/todo/)
- **Landing page** (still standalone): [`apps/todo/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Todo Project Guide" describing a per-product
backend with its own DB and reminder worker was deleted in the audit
cleanup of 2026-04-09 — it had been inaccurate since the consolidation.
The reminder worker logic referenced there was migrated to apps/api or
the relevant background-job home; check git history if you need the
original reference.
