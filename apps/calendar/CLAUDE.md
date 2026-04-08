# Calendar — consolidated into the unified Mana app

This product was migrated into the unified Mana monorepo. The legacy
per-product `apps/calendar/apps/server/` and `apps/calendar/apps/web/`
directories have been removed. Active code now lives in:

- **Backend compute routes**: [`apps/api/src/modules/calendar/routes.ts`](../api/src/modules/calendar/routes.ts)
- **Frontend module** (local-first): [`apps/mana/apps/web/src/lib/modules/calendar/`](../mana/apps/web/src/lib/modules/calendar/)
- **Web route**: [`apps/mana/apps/web/src/routes/(app)/calendar/`](../mana/apps/web/src/routes/(app)/calendar/)
- **Landing page** (still standalone): [`apps/calendar/apps/landing/`](apps/landing/)

For monorepo-wide patterns (auth, sync, encryption, services), see the
[root `CLAUDE.md`](../../CLAUDE.md) and [`apps/mana/CLAUDE.md`](../mana/CLAUDE.md).

The previous 660-line "Calendar Project Guide" that described a per-product
Hono backend with its own Drizzle schemas, RRULE service, CalDAV sync,
etc. has been deleted — it had been inaccurate since the consolidation
of early 2026. Pre-consolidation reference is in git history.
