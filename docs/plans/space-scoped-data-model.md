# Space-scoped data model (Modell β)

_Started 2026-04-22._
_Supersedes [`per-space-vs-user-global-tags.md`](./per-space-vs-user-global-tags.md) — the earlier "defer" recommendation was made under "ship as fast as possible" assumptions; this plan assumes pre-live + unlimited resources._

## Decision

Everything that the user creates — tags, tag-groups, workbench scenes,
AI agents, AI missions — **lives in a Space.** Only identity and
per-device preferences stay at the user level.

Two crisp levels:

| Level | What lives here | Examples |
| --- | --- | --- |
| **User** | Identity, auth, session, profile, master-key, per-device UI preferences | `user`, `session`, `profile`, `authKeys`, `userSettings.*` |
| **Space** | **Every** data record the user creates | Tasks, events, notes, contacts, dreams, memoros, tags, tag-groups, scenes, agents, missions, workbench layouts — everything |

A "Space" is the tenancy boundary. Personal-Space is automatic and
always exists for every user — most users spend most of their time
there. Shared Spaces (Family, Team, Brand, Club, Practice) have
explicit membership; their data is only visible to members via RLS.

## Why β, not γ (recursive Context)

- β has **two clear levels** — Space (tenant) vs. View (filter inside
  that Space). Users always know where they are.
- γ (one recursive `Context` primitive with arbitrary nesting) is more
  flexible but mentally heavier — "am I in a Space or a sub-Space?" is
  a real question users would have to answer.
- β is a natural stepping stone if we ever want γ: a γ-Context is just
  a β-Space with children.

## Scope of this migration

### In scope (become Space-scoped)

Currently user-global or ambiguously-scoped:

- `globalTags` — central tag store. No `spaceId` today.
- `tagGroups` — sibling of `globalTags`.
- `workbenchScenes` — scenes hold `scopeTagIds` + layout; currently
  user-global in the shared scene store.
- `aiAgents` — default "Mana" agent is bootstrapped per user at first
  login.
- `aiMissions` — reference an agent + inputs; implicitly follow
  wherever agents live.
- Any other top-level table that today carries `userId` but not
  `spaceId` (verify during Phase 1 — see "Audit step" below).

### Stays user-level

- `user`, `session`, `authKeys`, MK key wrapping
- `profile` (bio, avatar, locale, timezone) — identity-level
- Per-device UI preferences (active scene id, theme toggle, last-used
  layout) — these are device-local anyway, stored in localStorage
- Access-tier claim (`tier` on the JWT) — follows the user, gates
  whole apps

### Already correctly Space-scoped (no change)

All entity tables that came through the Spaces-Foundation migration
(~46 tables per the Spaces memory): tasks, events, notes, contacts,
dreams, memoros, meditations, …

### Junction tables (implicit)

All 19 tag junction tables (`taskLabels`, `eventTags`, `contactTags`,
…) stay plaintext FK-only. They inherit the parent record's `spaceId`
transitively — a `taskLabels` row pointing to task T is only visible
to members of T's Space. Nothing to change on the junction side.

## Target data model

### `globalTags` + `tagGroups`

```ts
interface LocalTag {
  id: string;
  spaceId: string;        // NEW — required, indexed
  name: string;
  color: string;
  icon?: string;
  groupId?: string;
  sortOrder: number;
  // userId dropped — implied by space membership
  // (createdBy audit column can stay if we want attribution)
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  __fieldTimestamps?: Record<string, number>;
}
```

Dexie indexes: `id, spaceId, [spaceId+name], [spaceId+sortOrder]`.

### `workbenchScenes`

Already has layout + `scopeTagIds?`; add required `spaceId`. A scene
belongs to exactly one Space.

### `aiAgents` + `aiMissions`

Same pattern — `spaceId` required.

### Database hooks

`apps/mana/apps/web/src/lib/data/database.ts`:

- **Creating hook** today stamps `userId` from `currentUser` store.
  Change to stamp both `userId` (still useful for attribution /
  audit) **and** `spaceId` from `getActiveSpaceId()`. Throw a clear
  error if no active Space is loaded — guards against races.
- **Sync engine** (`sync.ts`) already groups by `appId`; add `spaceId`
  to the outgoing payload so the backend can RLS-enforce without
  trusting the client.

## Phases

### Phase 1 — Audit + schema design (0.5 day)

- Grep `apps/mana/apps/web/src/lib/data/database.ts` for every
  `.store(...)` definition; cross-check against
  `packages/shared-types` to list every table that carries `userId`
  but not `spaceId`. Output a complete "tables to migrate" list —
  the five above are the obvious ones, but there may be others
  (audit `_pendingChanges`? `_activity`? `kontextDoc`?).
- For each table, decide: Space-scoped (majority) or user-level
  (rare — only identity/device-pref). Document decisions in a table.
- Design Dexie v{next}: new columns + indexes + migration function.
- Design matching Postgres migration for `mana_sync`: add `space_id`
  columns, RLS policies that match the 46 already-migrated tables.

Deliverable: updated target schema section of this doc, ready to
cut.

### Phase 2 — Dexie migration (1 day)

- Bump Dexie version. Add migration function that:
  1. For every row in each target table, set `spaceId =
     user.personalSpaceId` (we know it exists — signup hook
     guarantees).
  2. Leave `userId` alone (kept for audit).
- Register new tables with `scopedForModule()` — e.g.
  `scopedForModule('tags', 'globalTags')`. This kicks in the
  active-Space filter at read time automatically.
- `database.ts` creating hook: stamp `spaceId` alongside `userId`.
- Unit tests (fake-indexeddb): round-trip a tag through
  encrypt/write/read in two different Spaces, verify isolation.

### Phase 3 — Store APIs (1 day)

- `packages/shared-stores/src/tags-local.svelte.ts`:
  - `useAllTags()` — already a `liveQuery`; after Phase 2's
    `scopedForModule()`, it's implicitly filtered to the active
    Space. No API change.
  - `tagMutations.createTag()` — no longer needs (or accepts) a
    `spaceId` argument; the hook stamps it. If someone *explicitly*
    passes one, throw (would mean cross-Space write).
  - `getTagById(id)` — still works; the caller is already in a Space
    context.
- `workbenchScenesStore` — `setActiveScene()` stays same; deleting
  a scene deletes its layout + scopeTagIds together.
- AI agents store — `bootstrapDefaultAgent` runs per-Space, not
  per-user. Key off `spaceId + kind: 'default'` for idempotency.
- Missions store — unchanged semantically, just inherits `spaceId`
  from hook.

### Phase 4 — Space-switch behavior (0.5 day)

`apps/mana/apps/web/src/lib/data/scope/active-space.svelte.ts`:

After `loadActiveSpace()` completes and sets `active = space`, trigger
side-effects:

1. **Reset active scene:** look up the new Space's default scene and
   call `workbenchScenesStore.setActiveScene(defaultSceneId)`. If no
   default exists yet (new Space, no scenes), create one via the
   Space-bootstrap flow below.
2. **Bootstrap missing singletons:** if the new Space has no default
   agent, create a "Mana" agent. If no scenes, create a default
   "Übersicht" scene. These bootstraps run idempotently (key on
   `[spaceId, kind]`).
3. **Keep per-device state:** theme, last-used module, panel sizes
   don't reset — they're UI prefs, not data.

Implemented as a new `onActiveSpaceChanged()` hook in
`active-space.svelte.ts`, invoked at the end of `loadActiveSpace()`.

### Phase 5 — Space-creation seeding (0.5 day)

`apps/mana/apps/web/src/lib/components/layout/SpaceCreateDialog.svelte`:

Add an optional "Tags aus Personal kopieren" checkbox (default: on
for new Solo-Spaces, off for Shared-Spaces).

Mechanism: after the new Space is created and activated, if checked,
one-shot copy:

```ts
async function copyTagsFromPersonal(personalSpaceId: string, newSpaceId: string) {
  const personalTags = await db.table('globalTags')
    .where('spaceId').equals(personalSpaceId).toArray();
  const groupIdMap: Record<string, string> = {};
  const personalGroups = await db.table('tagGroups')
    .where('spaceId').equals(personalSpaceId).toArray();
  for (const g of personalGroups) {
    const newId = crypto.randomUUID();
    groupIdMap[g.id] = newId;
    await db.table('tagGroups').add({ ...g, id: newId, spaceId: newSpaceId });
  }
  for (const t of personalTags) {
    await db.table('globalTags').add({
      ...t, id: crypto.randomUUID(), spaceId: newSpaceId,
      groupId: t.groupId ? groupIdMap[t.groupId] : undefined,
    });
  }
}
```

One-shot **copy**, not a live link. Users can then diverge the tag
set per Space without cross-contamination.

### Phase 6 — Backend (mana-sync + RLS) (1 day)

- PostgreSQL migration: add `space_id text not null` on the
  corresponding sync tables. Default fill: the user's Personal-Space
  id (we can't know this server-side without a lookup; might need a
  two-step migration — add nullable, backfill via join, then `not
  null`).
- RLS policy: a row is visible iff the requesting session is a
  member of `space_id`. Matches the existing policy already used for
  the 46 migrated tables.
- mana-sync config: register the new tables in the
  collection→space-table mapping.

### Phase 7 — Cleanup + docs (0.5 day)

- Delete dead comments in `tags-local.svelte.ts` about user-global
  semantics.
- Update `apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md`:
  new canonical rule — "every data table carries `spaceId`".
- Add a short section to `apps/mana/CLAUDE.md`: "Adding a new
  top-level table? It gets `spaceId`. User-level is reserved for
  identity + device-prefs."
- Update memory files:
  - `feedback_cards_over_subroutes.md` — note that tags, scenes,
    agents are all Space-scoped now
  - Add a new `project_space_scoped_datamodel.md` entry with
    commit refs after shipping

### Phase 8 — Delete the old decision doc (5 min)

`per-space-vs-user-global-tags.md` gets superseded. Either delete it
or leave it with a single-line banner pointing here. **Prefer delete**
— stale plans confuse future readers.

## Edge cases & decisions

### What if a user is member of *another* user's Shared-Space when migration runs?

They are — the Spaces-Foundation already supports multi-member. Their
existing user-global tags should stay in their own Personal-Space.
Don't migrate them into shared spaces. The Phase 2 migration keys off
"this row has `userId = X`, so `spaceId = personalSpaceOf(X)`".

### What if the signup hook failed and a user has no Personal-Space?

`loadActiveSpace()` already handles this as a fatal error state
("No accessible space found — signup hook may not have run"). Phase 2
migration refuses to run until that's repaired.

### Should the user's Personal-Space be specially marked as "the real default"?

Yes — it already is (`SpaceType = 'personal'`, auto-created on
signup, one per user, can't be deleted). No schema change needed.

### What happens to a user's default agent "Mana"?

In Phase 3, the bootstrap hook runs per-Space. Existing `Mana` agent
in each user's Personal-Space migrates automatically (it gets
`spaceId = personalSpaceId` in Phase 2). Shared Spaces get their own
fresh `Mana` agent on first use by any member.

Policy memory is per-agent-per-Space. A user's agents across multiple
Spaces are independent — that's a feature, not a bug (agent in
brand-Space doesn't know user's personal notes).

### Tag-preset at user level — do we want this?

Deferred. The one-shot "copy from Personal" in Phase 5 covers the
common case. A dedicated "Tag Preset" record at user level can be
added later if users ask for it.

### What about the `// TODO: audit` on `globalTags` encryption?

Worth a separate sweep. With Space-scoped tags + RLS, the case for
encrypting tag names weakens (server already filters per-member).
But the current plaintext sync is still a leak surface (e.g. if the
Postgres backup leaks, tag names are visible). Park this as a
follow-up: "audit encryption of now-Space-scoped metadata tables
(tags, tagGroups, scene titles, agent names)".

## Success criteria

Before merging:

- [ ] Every data table in `database.ts` either carries `spaceId` or
      is on the explicit "user-level, by design" list, documented in
      `DATA_LAYER_AUDIT.md`.
- [ ] Switching active Space in the UI flips the visible tag list,
      scene list, agent list, mission list — all at once, no stale
      state.
- [ ] Creating a new Shared-Space (type `team` or `family`) starts
      with an empty tag list. Creating a new Solo-Space (type `brand`
      or `club` where the user is the only member) offers the
      "copy from Personal" toggle.
- [ ] `pnpm validate:all` is green (turbo invariants + pgSchema +
      crypto registry + theme tokens).
- [ ] Smoketest: in Personal-Space, create tag "Urgent". Switch to a
      new Shared-Space. `useAllTags()` returns an empty list. Switch
      back. "Urgent" is visible again.

## Timeline

~3–4 focused days across all phases. Biggest risk is Phase 6
(backend migration) because it touches production-shaped schemas —
even though we're pre-live, getting the Postgres migration right the
first time saves a re-migration later.

## Related

- [`spaces-foundation.md`](./spaces-foundation.md) — the primitive
  this plan extends.
- [`workbench-cards-migration.md`](./workbench-cards-migration.md) —
  the workbench-cards policy derived from the same session.
- [`scene-scope-empty-state.md`](./scene-scope-empty-state.md) — UX
  for the scope-filter empty state; integrates naturally once scenes
  are per-Space.
- **Deprecated** by this doc:
  [`per-space-vs-user-global-tags.md`](./per-space-vs-user-global-tags.md)
  — kept for historical context; delete in Phase 8.
