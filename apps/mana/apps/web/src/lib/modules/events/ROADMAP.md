# Events module — roadmap

Phase 1 (local-first scaffold + public RSVP backend) and the first
chunk of Phase 2 (bring list) are shipped. This file tracks what's
left and rough effort estimates so anyone picking the module up next
has a clear queue.

## Shipped

- **Phase 1a** — local-first event creation with guest list, RSVP
  status, plus-ones, calendar integration via TimeBlocks.
  Commit: `30022e82e`.
- **Phase 1b** — `services/mana-events` Hono+Bun service with
  authenticated host endpoints, public RSVP flow, server-issued
  share tokens, public `/rsvp/[token]` SvelteKit page (DE/EN i18n),
  RSVP polling in DetailView. Commit: `216746721`.
- **Tech debt** — self-heal snapshot drift, tombstone retry queue,
  polling cleanup, single-strike error recovery (`836c9692c`,
  `640242500`), rate-bucket FK cascade (`e7585fb87`).
- **E2E** — Playwright config + 6 specs covering both the local-first
  host flow and the public RSVP page (`3a4c6654b`).
- **Server tests** — 50 bun:test integration tests against real
  Postgres, including the bring-list endpoints (`897256c98` + new
  items.test.ts in `6a60e22a3`).
- **i18n** — public RSVP page in DE/EN/IT/FR/ES + helper extraction
  (`3eabbc5e5`).
- **Phase 2 #11** — bring list ("wer bringt was?") with public claim
  flow, end-to-end (`6a60e22a3`).

## Open — Phase 2 features

These are user-facing features that build on the Phase 1 backbone.
Estimates assume one focused session, no surprises.

### Quick wins

- [ ] **iCal export** _(1–2h)_
      Render an `.ics` for any published event so the share-link page
      exposes "Add to calendar". Reuse `apps/mana/apps/web/src/lib/data/time-blocks/ical-export.ts`
      (already used by the calendar module). Server can serve it from a
      public `GET /api/v1/rsvp/:token/ical` route.

- [ ] **Pro-Gast-Tokens** _(half day)_
      Per-guest share links so the host can see exactly who opened which
      invitation. Schema change: add a `guest_invitations` table on the
      server keyed by `(token, guestToken)`. Public route becomes
      `/rsvp/[token]/[guestToken]`. RSVP submission auto-pre-fills the
      name. Backwards-compatible with the existing token-only links.

### Medium

- [ ] **Recurring events** _(1 day)_
      Reuse the calendar module's rrule.js logic
      (`apps/mana/apps/web/src/lib/data/time-blocks/recurrence.ts`).
      Each recurring instance is its own published snapshot or a
      parent + child relationship — design call to make.

- [ ] **WebSocket push instead of 30s polling** _(1 day)_
      Replace `PublicRsvpList`'s `setInterval(fetchRsvps, 30_000)` with
      a WS subscription. mana-sync already speaks WS to clients —
      cheapest path is to publish events RSVPs into the existing sync
      channel (appId='events') and let the client see updates via the
      normal sync stream.

### Big

- [ ] **Email invitations via mana-notify** _(1–2 days)_
      Replace the "share link" UX with a real "send invites to N
      guests" flow. Needs a mana-notify integration:
  1. Host clicks "Email einladen" in DetailView.
  2. Client POSTs `/api/v1/events/:id/invitations/send`.
  3. mana-events calls mana-notify with a templated email
     containing the share link (or per-guest token).
  4. Track sent/opened state on `event_invitations`.
     Pre-req: get familiar with mana-notify API + template system.

- [ ] **RSVP reminders before the event** _(2–3h, gated by email)_
      Cron-style sweeper in mana-events that fires `T-24h` and `T-2h`
      reminders to guests with `rsvp_status='pending'`. Reuses the
      same notify pipeline as invitations.

- [ ] **Capacity waitlist** _(half day)_
      Once `capacity` is reached, new "yes" RSVPs land on a waitlist
      queue instead of attending. Free slot opens up → bump the head
      of the queue + send a notification.

## Open — tech debt / polish

- [ ] **`requiredTier: 'founder'` is dead config** _(repo-wide)_
      All in-development apps have this set, but tier gating isn't
      wired in mana web (`grep -rn requiredTier src/` → 0 hits). Either
      wire it up across all apps or remove it consistently. Not
      events-specific — needs a separate refactor session.

- [ ] **Sweep `_eventsTombstones` periodically** _(15min)_
      Today the queue only drains on ListView mount. If a host never
      opens the events list after a failed unpublish, the tombstone
      sits forever. Add a `setTimeout(drainTombstones, 5min)` on app
      boot.

- [ ] **`getRsvps` polling backoff** _(20min)_
      After 5+ consecutive failures the polling should slow down (e.g.
      exponential backoff capped at 5min) to be a good citizen when
      the events server is down. Currently always 30s.

- [ ] **Public RSVP claim — name prompt UX** _(30min)_
      `window.prompt()` is jarring and styled by the OS. Replace with
      an inline modal or pre-fill from the RSVP form's name field if
      it's already filled in.

- [ ] **Bring-list reorder** _(45min)_
      Today items are added with auto-incrementing `order` but you
      can't drag-reorder them. Use the existing dnd setup (other
      modules use `@mana/shared-ui/dnd`).

- [ ] **More tests for the host store** _(1h)_
      `eventsStore` and `eventItemsStore` have zero unit tests. The
      fire-and-forget snapshot sync is hard to verify without them.
      Use `fake-indexeddb` (already a devDep) + a fetch mock.

- [ ] **Server: rate-limit per IP, not just per token** _(1h)_
      Today the cap is per `(token, hour)`. A single attacker with a
      scraper can hit any number of distinct tokens at full speed.
      Add an IP-keyed bucket as an additional gate.

- [ ] **`mana-events` healthcheck reports schema version** _(15min)_
      `/health` only returns `{status:'ok'}`. Add `schemaVersion: 'N'`
      so deployments can detect drift before traffic flows.

## Done-but-undocumented

These are working but lack a top-level note pointer; if someone
starts a doc rewrite, they should pull from these spots:

- Public RSVP token format and lifetime: `services/mana-events/src/routes/events.ts` `generateToken()`.
- Rate-limit bucket layout: `services/mana-events/src/db/schema/events.ts` `rsvpRateBuckets`.
- Tombstone retry behaviour: `apps/mana/apps/web/src/lib/modules/events/tombstones.ts`.
- Self-heal snapshot policy: `apps/mana/apps/web/src/lib/modules/events/views/DetailView.svelte`
  (`lastHealedId` effect).
