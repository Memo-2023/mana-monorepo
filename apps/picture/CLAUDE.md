# Picture — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/picture/apps/backend/` and `apps/picture/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/picture/routes.ts`](../api/src/modules/picture/routes.ts) (Replicate / image-gen orchestration, server-side credit deduction)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/picture/`](../mana/apps/web/src/lib/modules/picture/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/picture/`](../mana/apps/web/src/routes/(app)/picture/)
- **Landing page** (still standalone): [`apps/picture/apps/landing/`](apps/landing/)
- **Mobile app**: [`apps/picture/apps/mobile/`](apps/mobile/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Picture App" guide describing a per-product
backend with `GenerateService`, `ReplicateService` etc. was deleted in
the audit cleanup of 2026-04-09 — it had been inaccurate since the
consolidation. The freemium credit logic now lives in `apps/api` and
talks to `mana-credits`. Pre-consolidation reference is in git history.
