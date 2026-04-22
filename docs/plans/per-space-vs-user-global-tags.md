# Per-Space vs. user-global tags — decision doc

_Started 2026-04-22. **Status: decision deferred** — wait for one of the
"trigger signals" below before acting._

## The question

Should the central tag system (`@mana/shared-stores → globalTags`) stay
**user-global** (one tag namespace shared across all of the user's
Spaces — current state) or move to **per-Space** (each Space has its
own tag namespace)?

This shows up as integration debt between two features:

- **Spaces** (hard multi-tenancy boundary — every module table carries
  `spaceId`, filtered at the Dexie layer)
- **Scene-Scope** (soft view filter — `WorkbenchScene.scopeTagIds`
  references global tag ids, applied in-memory after Dexie)

When a user switches Space, the active scene's `scopeTagIds` keeps
pointing at user-global tag ids whose *conceptual meaning* might belong
to the previous Space (e.g. a `Q2-Launch` tag from Brand-Space leaking
into Family-Space).

## Current state (2026-04-22)

- **Central store**: `packages/shared-stores/src/tags-local.svelte.ts`
  — Dexie tables `globalTags` (`id, name, color, icon?, groupId?,
  userId?, sortOrder`) + `tagGroups`. **No `spaceId` column.**
- **Junction tables** (19 of them — `taskLabels`, `eventTags`,
  `contactTags`, `memoTags`, `imageTags`, `plantTags`, `memoroTags`,
  `uloadTags`, …) — all plaintext, FK-only schema (`id, entityId,
  tagId, …`). None carry `spaceId` directly, but the parent record
  (task, event, contact, …) does — so junction rows are implicitly
  Space-scoped via the parent.
- **Sync**: `appId: 'tags'` (backend collection `globalTags` → `tags`).
  Synced across all of the user's devices.
- **Encryption**: `globalTags` is plaintext with a `// TODO: audit`
  comment. Junction tables are plaintext by design.
- **Deletion semantics**: no cascade — when a tag is deleted,
  junction rows stay orphaned. Scene-scope filter silently drops dead
  tag ids (`filterByScopeTagMap` yields only matches).
- **Consumers**: 68 imports across 20+ modules. Every module that has
  tags uses this shared store.
- **Guest-mode seed**: 4 default tags (Arbeit, Persönlich, Familie,
  Wichtig) auto-created on first load.

## Options

### A — Status quo (user-global tags)

Tags are one global namespace per user. Scene-scope keeps referencing
global tag ids.

**Pros**
- Zero migration cost. No schema change, no backfill, no UI rewrite.
- Simpler mental model for users who have only one *active* Space most
  of the time (Personal + the occasional brand or family).
- Tags follow the user across Spaces — a `Urgent` tag means the same
  everywhere.

**Cons**
- Tag-list pollution as Spaces accumulate: a Team-Space tag
  `Sprint-42` appears in the user's Personal tag list forever, even
  though it's meaningless there.
- Scene-Scope mismatch (the original motivation for this doc): a
  scene built in Space A with `scopeTagIds` referencing a Space-A
  concept stays "active" in Space B's view, silently filtering on
  irrelevant ids.
- No natural home for **shared-space tags**: in a Team/Family space,
  members can't have a common `Sprint-42` tag — each member creates
  their own, junction rows diverge.
- `globalTags` is synced user-global, not space-scoped — if shared
  Spaces ever want RLS-filtered tag reads, the current schema doesn't
  support it.

### B — Fully per-Space tags

Every tag belongs to exactly one Space. `globalTags` gets a required
`spaceId` column; `useAllTags()` becomes `useAllTagsForActiveSpace()`.
No way to have a truly cross-Space tag.

**Pros**
- Conceptually clean and consistent with Spaces as hard tenancy.
- Shared-Space tags work natively — members see the same tag set.
- Scene-Scope problem disappears: scenes + tags both live in one
  Space.
- Tag-list clutter reduced: each Space's list only shows its own
  tags.

**Cons**
- Big migration: existing tags all need a `spaceId`. Simplest path is
  to assign them to the user's Personal Space, but that *loses* the
  "these tags follow me everywhere" property users may expect.
- User friction: creating `Urgent` in Brand-Space doesn't make it
  available in Family-Space. Users may have to re-create common tags
  in every Space.
- Every one of the 20+ consumer modules needs to swap the import
  from `useAllTags` → `useAllTagsForActiveSpace` (or the shared store
  becomes space-aware internally — same effect).
- Risk of tag-id collisions: two Spaces could legitimately have a
  tag called `Urgent` with the same display name but different ids.
  Junction tables referencing the wrong one becomes possible if the
  UI doesn't scope correctly.

### C — Hybrid (`spaceId` nullable; `null` = user-global)

Tags get a nullable `spaceId`. A tag with `spaceId = null` is
user-global (shown in all Spaces); a tag with a Space id is scoped to
that Space. UI lets the user pick where a new tag lives.

**Pros**
- Best of both — `Urgent` can stay user-global; `Sprint-42` can be
  Team-Space-scoped.
- Migration is boring: existing tags get `spaceId = null`, nothing
  else changes for current users.
- Natural home for shared-Space tags without breaking solo users.

**Cons**
- Two-tier mental model. UI has to expose "scope" as a tag property.
- Queries become "WHERE spaceId IS NULL OR spaceId = :active" — not
  hard, but every consumer needs the right query.
- Doesn't solve the Scene-Scope mismatch cleanly: a scene referencing
  a user-global tag id still "works" everywhere (good?); a scene
  referencing a Space-scoped tag id will silently dead-end in other
  Spaces (arguably fine — it should just show the empty state).

## Recommendation

**Defer. Stay on A for now.** None of the current-state signals justify
the migration cost yet.

The tags feature was designed when Mana was single-tenant; Spaces is a
younger feature and real multi-Space usage is still thin. We have
exactly **one** user (kontakt@memoro.ai) and the shared-Space feature
has just shipped. Until we see real evidence of the problem, we
shouldn't pay migration + ongoing UI-complexity costs for a speculative
fix.

Pick option **C (hybrid)** if/when we migrate. It's the minimum
viable upgrade — preserves the follow-me-everywhere property for
existing tags, adds space-scoping for shared collaboration, and the
schema change (one nullable column + an index) is small.

## Trigger signals — when to revisit

Open this doc again when **any** of the following happens:

1. **First shared-Space with 2+ active members** creates tags.
   Shared-Space tagging is the clearest use case for B/C; until it
   exists, the pain is theoretical.
2. **User reports tag-list clutter** — e.g. says "my Personal tag list
   is full of brand stuff I don't care about anymore".
3. **A module feature breaks because of scope mismatch** — e.g. a
   scene's `scopeTagIds` points at a tag that makes no sense in the
   current Space and causes a confusing empty-state.
4. **More than 50 tags total** on a single user (the list becomes
   hard to browse; per-Space splitting helps).
5. **Security/compliance requirement** — e.g. a Team-Space needs tag
   names to be invisible to non-members. Current plaintext sync
   already leaks tag names across devices; per-Space would be the
   natural place to wire RLS.

Also revisit if **encryption is added** to `globalTags` (the `// TODO:
audit`) — at-rest encryption is an easier lift on a space-scoped
table (RLS + space key) than on a user-global one.

## If we migrate (C — hybrid): work breakdown

_Don't do this now. Reference for the future._

**Phase 1 — schema + backfill** (~0.5 day)
- Dexie: add `spaceId?: string | null` to `LocalTag` and
  `LocalTagGroup`. Bump Dexie version. Add index `'[spaceId+name]'`
  for fast dedup-within-space.
- Migration: existing rows get `spaceId = null`.
- `packages/shared-types`: update `Tag` + `TagGroup` types.
- `packages/mana-sync` + Postgres: add `space_id text null` on the
  `tags` / `tag_groups` tables; update RLS so non-null `space_id`
  enforces Space membership, null is user-global.

**Phase 2 — store + API** (~1 day)
- `tags-local.svelte.ts`: `useAllTags()` returns
  `tags.filter(t => t.spaceId === null || t.spaceId === activeSpaceId)`.
  Add `useSpaceTags()` / `useGlobalTags()` if needed.
- `tagMutations.createTag()` takes an optional `spaceId` (defaults to
  active space; `null` for user-global).
- Dev-mode invariant check: `spaceId` on a tag must match the Space a
  referencing junction row belongs to (or be `null`).

**Phase 3 — UI** (~1 day)
- TagSelector: show current-space tags + user-global tags in two
  groups.
- "Create tag" dialog: toggle "also show in other Spaces?" → `spaceId
  = null` if on.
- Admin tools: bulk-move tag from user-global → Space (or vice
  versa).

**Phase 4 — scene-scope integration** (~0.5 day)
- On Space switch (see
  [docs/plans/workbench-cards-migration.md §A-B](./workbench-cards-migration.md)),
  if the active scene's `scopeTagIds` contains tags whose `spaceId`
  doesn't match, show a subdued notice in `ScopeEmptyState`:
  *"Dieser Bereichsfilter nutzt Tags aus einem anderen Space."*
- Consider adding a one-click "scope zurücksetzen" in that case.

**Phase 5 — docs + memory** (~0.25 day)
- Update `DATA_LAYER_AUDIT.md` with the new tag schema.
- Update `feedback_cards_over_subroutes.md` to note that per-Space
  tags are now the rule.
- Add a CLAUDE.md note about `spaceId = null` semantics.

## Related

- [`workbench-cards-migration.md`](./workbench-cards-migration.md) —
  Spaces vs. Scene-Scope integration work; sibling to this doc.
- [`spaces-foundation.md`](./spaces-foundation.md) — the shipped
  Spaces primitive this doc builds on.
- Memory: `feedback_cards_over_subroutes.md` — the cards-vs-routes
  policy came out of the same session that surfaced this tag-scoping
  question.
