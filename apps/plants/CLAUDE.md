# Plants — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/plants/apps/backend/` and `apps/plants/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/plants/routes.ts`](../api/src/modules/plants/routes.ts) (Gemini Vision plant analysis, S3 upload)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/plants/`](../mana/apps/web/src/lib/modules/plants/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/plants/`](../mana/apps/web/src/routes/(app)/plants/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Plants Project Guide" describing a per-product
backend with its own database, schema, and watering scheduler was deleted
in the audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. Pre-consolidation reference is in git history.

> **Note:** The orphaned `apps/plants/packages/shared/` package was
> removed on 2026-04-09 — it had zero consumers across the repo. The
> remaining `apps/plants/package.json` is kept as a placeholder so the
> directory still surfaces in IDEs and as a doc anchor.
