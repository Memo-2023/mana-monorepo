# Contacts — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/contacts/apps/server/` and `apps/contacts/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/contacts/routes.ts`](../api/src/modules/contacts/routes.ts)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/contacts/`](../mana/apps/web/src/lib/modules/contacts/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/contacts/`](../mana/apps/web/src/routes/(app)/contacts/)
- **Landing page** (still standalone): [`apps/contacts/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Contacts Project Guide" was deleted in the
audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. Pre-consolidation reference is in git history.
