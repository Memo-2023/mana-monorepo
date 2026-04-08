# Chat — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/chat/apps/server/` and `apps/chat/apps/web/` directories
have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/chat/routes.ts`](../api/src/modules/chat/routes.ts)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/chat/`](../mana/apps/web/src/lib/modules/chat/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/chat/`](../mana/apps/web/src/routes/(app)/chat/)
- **Landing page** (still standalone): [`apps/chat/apps/landing/`](apps/landing/)
- **Mobile app**: [`apps/chat/apps/mobile/`](apps/mobile/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous standalone "Chat Project Guide" describing a per-product
backend was deleted in the audit cleanup of 2026-04-09 — it had been
inaccurate since the consolidation. Pre-consolidation reference is in
git history.
