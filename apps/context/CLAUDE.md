# Context — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/context/apps/backend/` (NestJS) and
`apps/context/apps/web/` directories have been removed. Active code now
lives in:

- **Backend compute routes**: [`apps/api/src/modules/context/routes.ts`](../api/src/modules/context/routes.ts) (AI text generation via mana-llm, server-side credit deduction)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/context/`](../mana/apps/web/src/lib/modules/context/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/context/`](../mana/apps/web/src/routes/(app)/context/)
- **Mobile app**: [`apps/context/apps/mobile/`](apps/mobile/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous "Context App" guide describing a NestJS backend with its
own spaces/documents/token tables was deleted in the audit cleanup of
2026-04-09 — it had been inaccurate since the consolidation. The
token-economy logic now lives in `mana-credits`. Pre-consolidation
reference is in git history.

> **Note:** The legacy `apps/context/pnpm-lock.yaml` (242 KB, separate
> workspace setup) and the broken `dev:web` / `dev:server` filter scripts
> in `apps/context/package.json` are tracked in audit items #2 and #26.
