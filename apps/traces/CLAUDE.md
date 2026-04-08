# Traces — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/traces/apps/server/` directory has been removed.
Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/traces/routes.ts`](../api/src/modules/traces/routes.ts) (location sync, AI city-guide pipeline, GPS-to-city detection)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/traces/`](../mana/apps/web/src/lib/modules/traces/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/traces/`](../mana/apps/web/src/routes/(app)/traces/)
- **Mobile app**: [`apps/traces/apps/mobile/`](apps/mobile/) (GPS tracking remains a native concern)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Traces" guide was deleted in the audit cleanup
of 2026-04-09 — it had been inaccurate since the consolidation. The
mobile-side AsyncStorage GPS pipeline still lives under `apps/traces/apps/mobile/`.
Pre-consolidation backend reference is in git history.
