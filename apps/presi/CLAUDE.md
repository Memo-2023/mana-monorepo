# Presi — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/presi/apps/backend/` (NestJS) and `apps/presi/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/presi/routes.ts`](../api/src/modules/presi/routes.ts) (public share-link lookups, share management)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/presi/`](../mana/apps/web/src/lib/modules/presi/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/presi/`](../mana/apps/web/src/routes/(app)/presi/)
- **Landing page** (still standalone): [`apps/presi/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous "Presi Project Guide" referenced a NestJS backend that was
fully replaced by the consolidated Hono routes in apps/api during the
NestJS → Hono sweep. Deleted in the audit cleanup of 2026-04-09.
Pre-consolidation reference is in git history.
