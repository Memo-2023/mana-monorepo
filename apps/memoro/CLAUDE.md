# Memoro

AI-powered voice recording + memo management. Memoro is a **hybrid**: its
frontend was consolidated into the unified Mana web app, but its backend
was kept as standalone services (Hono + Supabase) because of the
audio-processing pipeline and the legacy Supabase Storage bucket layout.

## Where things live

| Surface | Path | Notes |
|---------|------|-------|
| **Web frontend** (local-first, in unified Mana app) | [`apps/mana/apps/web/src/lib/modules/memoro/`](../mana/apps/web/src/lib/modules/memoro/) | Same module pattern as every other module — Dexie collections, Svelte 5 stores, runes UI. Reachable via `/memoro` route in mana.how. |
| **Native mobile app** | [`apps/memoro/apps/mobile/`](apps/mobile/) | React Native + Expo SDK 55. Talks directly to `memoro-server` (NOT to mana.how). Build via EAS, see `apps/mobile/eas.json`. |
| **Backend compute** | [`apps/memoro/apps/server/`](apps/server/) (`@memoro/server`) | Hono + Bun. Handles memo CRUD, transcription callbacks, spaces, invites, credits, settings, cleanup, meetings. **Still uses Supabase** for some legacy state. Deployed as `memoro-server` container. |
| **Audio processing** | [`apps/memoro/apps/audio-server/`](apps/audio-server/) | Separate Hono+Bun service for audio uploads + transcoding. Deployed as `memoro-audio-server` container. |
| **Landing page** | [`apps/memoro/apps/landing/`](apps/landing/) | Astro static landing → Cloudflare Pages |

## Why memoro is not (yet) in `apps/api`

Most consolidated products migrated their compute routes into
`apps/api/src/modules/{name}/`. Memoro stayed standalone because:

1. **Audio pipeline.** The audio-server runs background transcoding/
   upload jobs that don't fit the request-response shape of `apps/api`.
2. **Legacy Supabase coupling.** Memo and storage records still live
   in Supabase tables (`storage.objects`, RLS policies on `memos`).
   Migrating to mana_platform was descoped in the consolidation sprint.
3. **Three deploy targets.** `memoro-server`, `memoro-audio-server`,
   and the mobile app all need to coordinate. Easier to evolve as one
   unit while migration is in flight.

A future cleanup item is to either fold the routes into `apps/api`
(once Supabase is gone) or document this exception explicitly in the
root architecture overview.

## Production deployment

Both backends are part of `docker-compose.macmini.yml`:

```
memoro-server         (apps/memoro/apps/server)         — main backend
memoro-audio-server   (apps/memoro/apps/audio-server)   — audio worker
```

The mobile app builds via EAS — not part of the monorepo CI.

## Known issues / cleanup items

- **`@mana/notify-client` is imported by `apps/memoro/apps/server/src/lib/notify.ts:6` but NOT declared as a dependency** in `apps/memoro/apps/server/package.json`. Currently works via hoisted node_modules but should either be added as a workspace dep or replaced with a direct call to `mana-notify`. Tracked in `docs/REFACTORING_AUDIT_2026_04.md` items #29.
- **`apps/memoro/apps/server` still pulls `@supabase/supabase-js`** — not a bug, but flagged as a dependency to remove once Supabase migration completes.
- **No `apps/memoro/apps/web`** — was removed during the consolidation. The old SvelteKit "companion web app" lives now under `apps/mana/apps/web/src/lib/modules/memoro/`.

## For monorepo-wide patterns

See [root `CLAUDE.md`](../../CLAUDE.md) for the overall architecture and
[`apps/mana/CLAUDE.md`](../mana/CLAUDE.md) for the unified web app's
module pattern (which the memoro frontend follows).

The previous 459-line "Memoro repository overview" describing memoro as
a standalone monorepo with `mana-middleware` and a bespoke auth bridge
was deleted in the audit cleanup of 2026-04-09. It pre-dated the
integration into the Mana monorepo and described an architecture that
no longer exists. Pre-consolidation reference is in git history.
