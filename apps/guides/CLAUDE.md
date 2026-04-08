# Guides — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/guides/apps/server/` and `apps/guides/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/guides/routes.ts`](../api/src/modules/guides/routes.ts) (URL/text/AI import, structured guide generation via mana-search + mana-llm)
- **Frontend module** (mostly static content): [`apps/mana/apps/web/src/lib/modules/guides/`](../mana/apps/web/src/lib/modules/guides/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/guides/`](../mana/apps/web/src/routes/(app)/guides/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Guides" guide was deleted in the audit cleanup
of 2026-04-09 — it had been inaccurate since the consolidation.
Pre-consolidation reference is in git history.

> **Note:** Guides is one of the few modules that doesn't own a Dexie
> collection (the catalogue is hardcoded in `index.ts`); only `tags` are
> stored. See `apps/mana/CLAUDE.md` for the standard module pattern this
> intentionally diverges from.
