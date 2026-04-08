# Planta — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/planta/apps/backend/` and `apps/planta/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/planta/routes.ts`](../api/src/modules/planta/routes.ts) (Gemini Vision plant analysis, S3 upload)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/planta/`](../mana/apps/web/src/lib/modules/planta/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/planta/`](../mana/apps/web/src/routes/(app)/planta/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Planta Project Guide" describing a per-product
backend with its own database, schema, and watering scheduler was deleted
in the audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. Pre-consolidation reference is in git history.

> **Note:** The orphaned `apps/planta/packages/shared/` package and the
> related sub-script entries in `apps/planta/package.json` referencing
> non-existent `@planta/server` / `@planta/web` filters are tracked as
> dead code in `docs/REFACTORING_AUDIT_2026_04.md` items #18/#29.
