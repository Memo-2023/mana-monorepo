# Storage — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/storage/apps/backend/` and `apps/storage/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/storage/routes.ts`](../api/src/modules/storage/routes.ts) (S3/MinIO upload, presigned URLs, download)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/storage/`](../mana/apps/web/src/lib/modules/storage/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/storage/`](../mana/apps/web/src/routes/(app)/storage/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous "Storage Project Guide" describing a per-product NestJS-style
backend with `FilesController`, `FoldersController`, share/version logic,
etc. was deleted in the audit cleanup of 2026-04-09 — it had been
inaccurate since the consolidation. The current consolidated implementation
is much smaller (uses `mana-sync` for metadata CRUD). The audio-player
visualizer logic referenced in the old guide lives directly in the
storage module under `apps/mana/apps/web/src/lib/modules/storage/`.
Pre-consolidation reference is in git history.

> **Note:** The orphaned `apps/storage/packages/shared/` package and the
> `dev: turbo run dev` recursive script in `apps/storage/package.json`
> were addressed in audit items #2 and #18/#29.
