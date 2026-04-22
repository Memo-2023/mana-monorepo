# Space-scoped data model (Modell β)

_Started 2026-04-22._
_Supersedes [`per-space-vs-user-global-tags.md`](./per-space-vs-user-global-tags.md) — the earlier "defer" recommendation was made under "ship fast" assumptions; this plan assumes pre-live + unlimited resources, i.e. we build the clean architecture now without legacy residues._

## Shipping log

| Phase | Purpose | Commit |
| --- | --- | --- |
| 2a | Crypto-registry prep (enabled:false for globalTags/tagGroups/workbenchScenes/aiMissions) | `766ad2ea8` |
| 2b | Dexie v34: userTagPresets table + compound indexes on globalTags/tagGroups | `07e35d79f` |
| 2d.1 | userTagPresets CRUD store + move into encryption registry | `35d9e023a` |
| 2d.2 | kontextDoc per-Space (store + queries + AI-runner resolver) | `8a82f3c54` |
| 2d.3 | SpaceType-aware default agent bootstrap | `a36e543e4` |
| 2d.4 | onActiveSpaceChanged subscriber + per-Space localStorage + scene filter | `3b85d7d3d` ⚠️ |
| 2d.5a | applyPresetToSpace + copyTagsBetweenSpaces helpers | `596e5a742` |
| 2d.5b | SpaceCreateDialog tag-source picker | `81a426af2` |
| 2d.6 | Settings → Tag-Presets management UI | `0f8fbb381` |
| 2e | Encryption flip (enabled:true on 4 tables) | `09e6a8b9d` |
| 2c | Creating-hook: stop stamping userId on data tables | `e9b9544ea` |
| 2e-followup | At-rest encrypt sweep (post-unlock, per-table sentinel) | `c413ab7dd` ⚠️ |

⚠️ **2d.4 + 2e-followup attribution note**: Two commits absorbed
Space-scoped work under unrelated titles due to parallel-session
lint-staged rollback races (see `feedback_git_workflow.md`):

- `3b85d7d3d chore(bundle): add bundle-size audit …` — contains the
  2d.4 payload (active-space handler API + per-Space workbench-scenes
  localStorage + scene spaceId filter + runAgentsBootstrap on Space
  change). The bundle-audit files are legit too; the Space-switch work
  is the second half of the diff.

- `c413ab7dd test(mana-research): fixture-based tests …` — contains
  the 2e-followup payload (at-rest encrypt sweep:
  `lib/data/crypto/at-rest-sweep.ts` + layout unlock wiring). The
  mana-research test files are legit too; the at-rest sweep is
  `apps/mana/apps/web/…` changes in the diff.

Both commits' code is correct and typechecks cleanly. Grep for
`runAtRestEncryptSweep` / `onActiveSpaceChanged` to find the actual
payload.

## Decision

Everything that the user creates — tags, tag-groups, workbench scenes,
AI agents, AI missions, kontextDoc — **lives in a Space.** Only
identity, authentication, session, profile, master-key material, and
per-device UI preferences stay at the user level.

Two crisp levels:

| Level | What lives here | Examples |
| --- | --- | --- |
| **User** | Identity · auth · MK key · cross-device profile · preferences that follow the user · **tag presets** (user-level templates for new Spaces) | `user`, `session`, `authKeys`, `profile`, `userSettings`, `userTagPresets` |
| **Space** | **Every** data record the user creates or interacts with | Tasks · events · notes · contacts · dreams · memoros · tags · tag-groups · scenes · agents · missions · **kontextDoc** · workbench layouts — everything |
| **Device** | Ephemeral UI state that's explicitly per-device | Active scene per Space · theme toggle · panel sizes · last-used module — all via localStorage |

"Device" isn't a data model — it's localStorage conventions. Listed
for completeness so nothing falls through the cracks.

### Why β, not γ (recursive Context)

- β has **two clear data levels** — Space (tenant) vs. Scene-as-filter
  (view inside that Space). Users always know where they are.
- γ (one recursive `Context` primitive with arbitrary nesting) is more
  flexible but mentally heavier — "am I in a Space or a sub-Space?" is
  a real question users would have to answer.
- β is a natural stepping stone if we ever want γ: a γ-Context is just
  a β-Space with children.

## No legacy residues

Explicit anti-patterns this plan rejects (so we don't drift back into
them):

1. **No `userId` audit column on data records.** Attribution lives in
   the Actor system (`__lastActor`, `__fieldActors` — added during the
   AI-Workbench rollout) on every record. A separate `userId` would be
   redundant. Members of a Space see each others' Actor attributions;
   that's the correct model for shared-Space collaboration.
2. **No "user-global tag" hybrid.** Tags *always* belong to a Space.
   Users who want a taxonomy to propagate across their Spaces create a
   **tag preset** at user level (see §5) and seed new Spaces from it.
3. **No single-ID `activeSceneId` in localStorage.** The active scene
   is per-Space-per-device; the key is
   `mana:workbench:activeSceneId:${spaceId}`.
4. **No plaintext-tag defer.** User-typed tag names (`Therapie`,
   `Finanzen-privat`) can leak personal categorization. Encrypt during
   the migration, not as a follow-up.
5. **No "one default agent everywhere" name collision.** Default-agent
   bootstrap uses a SpaceType-aware name (see §4).
6. **No user-level `kontextDoc` singleton.** The AI planner's auto-
   injected context is per-Space (a Family-Space doesn't want to see
   the user's Brand-Space bio).

## Scope

### In scope (become Space-scoped)

Confirmed by Phase 1 audit (see appendix at bottom of this doc):

- `globalTags` + `tagGroups` — add `spaceId`, drop `userId`, encrypt
  `name` + `icon`.
- `workbenchScenes` — add `spaceId`. Layout + `scopeTagIds` stay.
  Encrypt `title`.
- `aiAgents` — add `spaceId`. Bootstrap runs per Space.
- `aiMissions` — add `spaceId`. Follows agents.
- `kontextDoc` — reshape from user-level singleton to per-Space
  (one per Space, keyed `[spaceId, type: 'kontextDoc']`).
- `agentKontextDocs` (v22, per-agent context docs — added by audit)
  — add `spaceId` via agent FK lookup. Ordered: migrate `aiAgents`
  first, then backfill `agentKontextDocs.spaceId` from the parent.

### Also in scope: drop `userId` across all already-migrated tables

The Phase 1 audit found that **all 46 previously-migrated
space-scoped tables still carry `userId`** (redundant with Actor
attribution). To satisfy the "no table has both `userId` and
`spaceId`" invariant, Phase 2 drops `userId` from every data-record
table, not just the 7 newly-migrated ones. This is a ~53-table
sweep, mechanically identical per table, so the work scales cheaply.

### Stays user-level (identity / preferences)

- `user`, `session`, `authKeys`, MK key wrapping
- `profile` (bio, avatar, locale, timezone)
- `userSettings` — user-wide prefs (theme default, locale)
- `userTagPresets` — **new table** (see §5)
- Access-tier claim on the JWT

### Ephemeral, per-device (localStorage only)

- Active scene per Space:
  `mana:workbench:activeSceneId:${spaceId}`
- Active space hint:
  `mana:scope.activeSpaceId` (already exists)
- Theme toggle, panel sizes, last-used module, debug flags

### Already correctly Space-scoped

The ~46 module tables migrated in the Spaces-Foundation sprint.
Nothing to do.

### Junction tables — must be audited in Phase 1

All 19 tag junction tables (`taskLabels`, `eventTags`, `contactTags`,
…) are FK-only and inherit `spaceId` from their parent record. Phase 1
confirms that **every** junction row's parent actually carries
`spaceId` — any junction referencing a still-user-scoped table is a
migration bug. Full list generated via codebase audit, not assumed.

## Target schemas

### `globalTags`

```ts
interface LocalTag {
  id: string;
  spaceId: string;           // NEW — required, indexed
  name: string;              // encrypted (see Phase 2)
  color: string;
  icon?: string;             // encrypted
  groupId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  __fieldTimestamps?: Record<string, number>;
  __lastActor?: Actor;       // from AI-Workbench rollout
  __fieldActors?: Record<string, Actor>;
  // NO userId
}
```

Dexie indexes: `id, spaceId, [spaceId+name], [spaceId+sortOrder]`.

Crypto registry (`apps/mana/apps/web/src/lib/data/crypto/registry.ts`):

```ts
globalTags: {
  encrypted: ['name', 'icon'],
  plaintext: ['id', 'spaceId', 'color', 'groupId', 'sortOrder',
              'createdAt', 'updatedAt', 'deletedAt',
              '__fieldTimestamps', '__lastActor', '__fieldActors'],
}
```

### `tagGroups`

Same treatment. `spaceId` required, `name` encrypted.

### `workbenchScenes`

Already has `title`, layout, `scopeTagIds?`. Add `spaceId`. Encrypt
`title` (it's user-authored).

### `aiAgents`, `aiMissions`

`spaceId` required. Names/system-prompt/memory/mission-objective are
already encrypted (per AI-Workbench rollout). Nothing changes on the
crypto side except adding a `spaceId` plaintext column to the
registry entries.

### `kontextDoc`

Today a user-level singleton. New shape:

```ts
interface LocalKontextDoc {
  id: string;                // uuid, one per Space
  spaceId: string;           // required, unique in-space
  type: 'kontextDoc';        // discriminator, for the [spaceId+type] unique index
  content: string;           // encrypted (already is)
  updatedAt: string;
  __lastActor?: Actor;
  __fieldActors?: Record<string, Actor>;
}
```

Dexie indexes: `id, spaceId, [spaceId+type]`.

The AI runner's auto-injection logic switches from
`getUserKontextDoc()` to `getKontextDocForActiveSpace()`.

### `userTagPresets` (NEW — user-level)

```ts
interface LocalUserTagPreset {
  id: string;
  userId: string;            // explicit — this table is user-scoped
  name: string;              // "Mein Standard-Set", "Brand-Setup", …
  isDefault: boolean;        // at most one default per user
  tags: Array<{
    name: string;
    color: string;
    icon?: string;
    groupName?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

This is a **first-class template** for seeding new Spaces, not a live
link. Values are frozen snapshots of tag definitions. When creating a
new Space, the user picks a preset (or none); tags from the preset
are one-shot-copied into the new Space with fresh UUIDs.

Lives outside any Space in the Dexie DB. Synced cross-device per-
user. Encrypted same as `globalTags` (tag names inside are sensitive).

## Phases

### Phase 1 — Audit + schema finalisation (0.5 day)

- Enumerate every Dexie `store(...)` definition in
  `apps/mana/apps/web/src/lib/data/database.ts`. Cross-check against
  `packages/shared-types`.
- For every table, decide:
  - **Space-scoped** (majority — migrate)
  - **User-level** (only identity / profile / preferences /
    `userTagPresets`)
  - **Junction** (inherits from parent — verify parent has `spaceId`)
- Verify every junction row's parent is Space-scoped. Any junction
  still pointing at a user-global table is a bug to flag.
- Verify Actor columns (`__lastActor`, `__fieldActors`) are on every
  migration target — so we can confidently drop `userId`.
- Deliverable: concrete table list in an appendix to this doc,
  committed before Phase 2 runs. Any surprises get called out.

### Phase 2 — Dexie migration (1.5 days)

- Bump Dexie version. Write migration function that for each target
  table:
  1. Adds `spaceId = user.personalSpaceId` (signup hook guarantees
     it exists).
  2. **Drops `userId`** — attribution is the Actor system's job.
     (`__lastActor` is already populated for records created after
     the AI-Workbench rollout; pre-rollout rows get `__lastActor =
     { kind: 'user', principalId: userId, displayName: user.name }`
     during the migration — a one-time backfill, then `userId` is
     deleted).
  3. For `globalTags` / `tagGroups` / `workbenchScenes`: encrypt
     `name` / `title` / `icon` during migration. Register in
     crypto registry. Dev-mode drift check catches missed fields.
  4. For `kontextDoc`: reshape into `{ id, spaceId, type: 'kontextDoc',
     content, ... }`. Each user has exactly one pre-migration
     kontextDoc — it becomes the Personal-Space's kontextDoc. Other
     Spaces get no kontextDoc until the user writes one.
- Register new tables with `scopedForModule()`:
  `scopedForModule('tags', 'globalTags')`,
  `scopedForModule('workbench', 'workbenchScenes')`,
  `scopedForModule('ai', 'aiAgents')`,
  `scopedForModule('ai', 'aiMissions')`,
  `scopedForModule('ai', 'kontextDoc')`.
- Create the new `userTagPresets` table — user-level, encrypted
  `name` + inline tag names.
- `database.ts` creating hook: stamp `spaceId` from
  `getActiveSpaceId()`. Throw `ScopeNotReadyError` if unset — guards
  against races.
- Remove `userId` stamping for Space-scoped tables (the creating
  hook stops stamping it since the column is gone).
- Unit tests (fake-indexeddb): round-trip a tag through
  encrypt/write/read in two different Spaces, verify isolation.
  Round-trip a preset apply, verify tags land with correct spaceId +
  fresh ids.

### Phase 3 — Store APIs + runner integration (1 day)

- `packages/shared-stores/src/tags-local.svelte.ts`:
  - `useAllTags()` — unchanged surface; implicit Space filter from
    `scopedForModule()`. Returned tags have `name` already decrypted
    (crypto pipeline).
  - `tagMutations.createTag(input)` — no `spaceId` argument; hook
    stamps it. Refuses explicit cross-Space writes.
- `userTagPresets` store: `useTagPresets()`, `createPreset()`,
  `applyPresetToSpace(presetId, spaceId)` — the apply flow
  one-shot-copies preset entries into the target Space as fresh
  `globalTags` rows.
- `workbenchScenesStore`:
  - `useScenes()` → Space-filtered live query.
  - Per-Space default scene bootstrap (see Phase 4).
- AI agents store:
  - `bootstrapDefaultAgent(spaceId, spaceType)` — idempotent, keyed
    `[spaceId, kind: 'default']`. Name derived from `spaceType`:
    - `personal` → "Mana"
    - `family` → "Familien-Helfer"
    - `team` → "Team-Assistent"
    - `brand` → "Brand-Assistent"
    - `club` → "Verein-Helfer"
    - `practice` → "Praxis-Assistent"
  - Users rename freely after bootstrap.
- AI runner (`src/lib/data/ai/missions/runner.ts`):
  - Replace `getUserKontextDoc()` with
    `getKontextDocForActiveSpace()`. If none exists for the active
    Space, skip injection (not an error — users opt in by writing
    one).

### Phase 4 — Space-switch behavior (0.5 day)

`apps/mana/apps/web/src/lib/data/scope/active-space.svelte.ts`:

After `loadActiveSpace()` completes and sets `active = space`, fire
`onActiveSpaceChanged(space)`:

1. **Bootstrap singletons if missing** (idempotent):
   - Default agent for this Space's type (see §3).
   - Default scene "Übersicht" with empty layout.
2. **Restore per-device active scene** for this Space from
   `localStorage.getItem('mana:workbench:activeSceneId:' +
   space.id)`. If null or stale, fall back to the Space's default
   scene.
3. **No data reset** — all reactive queries already pivot via
   `scopedForModule()` on the new `activeSpaceId`. Module stores
   don't need custom reset logic.
4. **Per-device UI state is preserved** — theme, panel sizes,
   last-used module id don't change.

`workbenchScenesStore.setActiveScene(sceneId)` writes the per-Space
localStorage key, not the old single-key one.

### Phase 5 — Space creation + preset application (0.5 day)

`apps/mana/apps/web/src/lib/components/layout/SpaceCreateDialog.svelte`:

Add a "Tag-Set" section to the create dialog:

- Dropdown of the user's `userTagPresets` (if any), plus built-in
  options: "Leer" (default for Shared-Spaces) and "Aus Personal
  kopieren" (default for Solo-Spaces — a convenience shortcut that
  copies the Personal-Space's current tags as a one-shot).
- On submit: create Space → bootstrap default agent + default scene
  → if a preset / copy-from-Personal was chosen, one-shot-copy tags.

Admin-style entry in the user's Settings → "Tag-Presets" to
create/edit presets (CRUD for `userTagPresets`). Any existing Space's
tag set can be "exported as preset" from its TagManager UI.

### Phase 6 — Backend (mana-sync + Postgres + RLS) (1 day)

- PostgreSQL migration: add `space_id text not null` on sync tables
  for `globalTags`, `tag_groups`, `workbench_scenes`, `ai_agents`,
  `ai_missions`, `kontext_docs`. Drop `user_id` from the first
  four (keep only on the new `user_tag_presets` table, which
  remains user-scoped).
  - Two-step Postgres backfill: add nullable `space_id`, backfill
    via join (`update … set space_id = personal_space_of(user_id)`),
    then `set not null`, then drop `user_id`.
- RLS policies: membership-based for every Space-scoped table
  (matches existing 46-table pattern).
- `user_tag_presets`: RLS = `user_id = current_user_id()`.
- mana-sync config: register new Space-scoped tables in the
  collection→space-table mapping; register `user_tag_presets` in
  the user-scoped mapping.

### Phase 7 — Cleanup + docs (0.5 day)

- Delete the `// TODO: audit` encryption comment on `globalTags` —
  resolved.
- Update `apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md`:
  canonical rule is now "data records carry `spaceId`, not `userId`;
  attribution lives in Actor columns". Document
  `userTagPresets` as the only user-scoped data table.
- Add a section to `apps/mana/CLAUDE.md`:
  > Adding a new top-level table? It gets `spaceId`, not `userId`.
  > User-level is reserved for identity, auth, profile, and
  > explicit user-level templates (like `userTagPresets`).
  > Attribution on every record is via `__lastActor` / `__fieldActors`.
- Update memory files:
  - `feedback_cards_over_subroutes.md` — note that tags, scenes,
    agents, missions, kontextDoc are all Space-scoped.
  - Add `project_space_scoped_datamodel.md` with commit refs after
    shipping.
- Regenerate `validate:all` outputs — the three validation scripts
  (turbo recursion, pgSchema, crypto registry) should all stay green
  since Phase 2 wired the new tables in from the start.

### Phase 8 — Delete the deprecated plan (5 min)

`per-space-vs-user-global-tags.md` gets deleted in the same PR as
Phase 7. Git history preserves the deferred-decision reasoning for
future readers who dig; the current tree shouldn't confuse anyone.

## Edge cases & decisions (baked in)

**Member of another user's Shared-Space at migration time?** Existing
user-global tags/scenes/agents go into **your** Personal-Space. Shared
Spaces start empty from your side; other members' content is visible
via RLS once you join.

**Signup hook failed — no Personal-Space?** Phase 2 migration refuses
to run. Repair that user's state first, then retry.

**`kontextDoc` in non-Personal Spaces?** Absent by default. User
writes one explicitly if the planner should inject Space-specific
context. UI exposes "Space-Kontext bearbeiten" in each Space's
Settings.

**Default agent name collision across user's Spaces?** Names are
SpaceType-aware, so three Spaces give three different defaults. Users
can rename freely — the bootstrap only runs once per Space.

**What if a user deletes their only `userTagPreset`?** That's fine —
new-Space dialog falls back to "Leer" / "Aus Personal kopieren".
Presets are a convenience, not a dependency.

**Cross-device preset drift?** `userTagPresets` syncs via mana-sync
with user-level RLS. Same model as `profile`.

## Success criteria

Before merging:

- [ ] No table in the Dexie DB has both `userId` and `spaceId` columns
      (the canonical rule is one-or-the-other, based on the
      Space-scoped vs. user-level decision).
- [ ] `validate:all` green: turbo recursion · pgSchema · crypto
      registry · theme tokens · CSS utilities.
- [ ] Switching active Space in the UI flips: tag list · scene list ·
      agent list · mission list · kontextDoc — all at once, no stale
      state in any module.
- [ ] Creating a new Shared-Space starts with an empty tag list.
      Creating a new Solo-Space offers the preset picker with
      user-defined options + the "Aus Personal kopieren" shortcut.
- [ ] Active scene persists per-Space-per-device: switch Space A →
      scene X, switch to Space B → scene Y, switch back to A → scene
      X restored.
- [ ] AI runner in Family-Space injects the Family-Space
      `kontextDoc`, not Personal's.
- [ ] Default agents bootstrap with SpaceType-aware names — three
      Spaces of different types show three distinct default agents.
- [ ] Tag names are encrypted at rest (verified via direct Dexie
      inspection showing ciphertext for `name` / `icon`).
- [ ] Smoke: in Personal-Space, create tag "Urgent". Switch to a new
      Shared-Space. `useAllTags()` returns empty. Switch back.
      "Urgent" visible. Create preset from Personal. Create new
      Brand-Space with that preset. "Urgent" appears there (with a
      different `tag.id`, confirming it's a copy not a reference).

## Timeline

~4–5 focused days across all phases (up from 3–4 in the previous
draft; the extra day covers encryption wiring, `userTagPresets` CRUD,
and the `userId` → Actor attribution cleanup).

## Related

- [`spaces-foundation.md`](./spaces-foundation.md) — the Spaces
  primitive this plan extends.
- [`workbench-cards-migration.md`](./workbench-cards-migration.md) —
  the cards-vs-routes policy from the same strategic session.
- [`scene-scope-empty-state.md`](./scene-scope-empty-state.md) — UX
  for the scope-filter empty state; integrates naturally once scenes
  are per-Space.
- **Deprecated** by this doc:
  [`per-space-vs-user-global-tags.md`](./per-space-vs-user-global-tags.md)
  — delete in Phase 8.

---

## Appendix — Phase 1 audit results (2026-04-22)

Source: full audit of `apps/mana/apps/web/src/lib/data/database.ts`,
`crypto/registry.ts`, `crypto/plaintext-allowlist.ts`. Conclusion:
**no surprises that block Phase 2**, with the two scope adjustments
already folded into the In-scope section above.

### To-migrate (7 tables)

| Table | Current columns | Needs Actor? | Notes |
|---|---|---|---|
| `globalTags` | id, name, groupId, color, icon, sortOrder, **userId**, NO spaceId | ✗ — stamping needed | Add `spaceId`. Drop `userId`. Encrypt `name` + `icon`. |
| `tagGroups` | id, name, color, **userId**, NO spaceId | ✗ — stamping needed | Add `spaceId`. Drop `userId`. Encrypt `name`. |
| `workbenchScenes` | id, title, layout, scopeTagIds?, order, **userId**, NO spaceId | ✗ — stamping needed | Add `spaceId`. Drop `userId`. Encrypt `title`. |
| `aiAgents` | id, name, state, systemPrompt🔒, memory🔒, **userId**, NO spaceId | ✗ — stamping needed | Add `spaceId`. Drop `userId`. Name stays plaintext (display key). |
| `aiMissions` | id, state, createdAt, nextRunAt, **userId**, NO spaceId | ✗ — stamping needed | Add `spaceId`. Drop `userId`. |
| `kontextDoc` | id (singleton), content🔒 | ✗ — stamping needed | **Reshape**: `[spaceId, type: 'kontextDoc']` PK. Pre-migration singleton becomes Personal-Space's kontextDoc. Other Spaces start without one. |
| `agentKontextDocs` | id, agentId, content🔒, NO spaceId | ✗ — stamping needed | Added by audit. Backfill `spaceId` via parent-agent lookup. Not in original plan. |

Legend: 🔒 = already encrypted in crypto registry.

### Already space-scoped (46 tables) — userId cleanup sweep

All 46 tables migrated during the Spaces-Foundation sprint carry
**both** `spaceId` and `userId`. Phase 2 drops the redundant
`userId` — the migration helper runs over every table in this set
mechanically.

Sample (full list derived at implementation time from the Dexie
schema registry): `tasks`, `events`, `notes`, `contacts`,
`conversations`, `documents`, `dreams`, `memos`, `meditations`,
`images`, `files`, `skills`, `plants`, `songs`, `ccLocations`,
`places`, `presiDecks`, `cardDecks`, `articles` (v33), …

The creating-hook in `database.ts` is updated to stop stamping
`userId` on these tables (Phase 2). Attribution reads from
`__lastActor` everywhere.

### User-level (10 existing + 1 new) — NO change

| Table | Purpose |
|---|---|
| `userSettings` | user-wide UI defaults (theme, locale) |
| `userContext` | profile hub (about, interests, routine, goals, social) |
| `newsPreferences` | feed subscriptions + learned weights |
| `meditateSettings` | meditation prefs |
| `sleepSettings` | sleep-tracking prefs |
| `moodSettings` | mood-logging prefs |
| `timeSettings` | time-tracking prefs |
| `invoiceSettings` | sender profile (legal address, IBAN) |
| `broadcastSettings` | newsletter sender defaults |
| `wetterSettings` | weather prefs |
| `userTagPresets` *(new in Phase 2)* | user-level templates for Space-seeding |

`userContext` is **not** the same as `kontextDoc` — the former is
the user's profile hub (identity-level bio/interests), the latter
is the AI-planner-injected context (moves per-Space). They serve
different roles. No collision.

### Junction tables (19) — all parents space-scoped ✓

No dangling references. Every junction inherits `spaceId` from its
parent once parents are migrated.

`taskLabels` · `eventTags` · `contactTags` · `conversationTags` ·
`documentTags` · `imageTags` · `fileTags` · `photoMediaTags` ·
`memoTags` · `mealTags` · `plantTags` · `songTags` · `skillTags` ·
`ccLocationTags` · `placeTags` · `presiDeckTags` · `deckTags` ·
`articleTags` · `noteTags` · `timeBlockTags`

(`taskLabels` points at `globalTags` — after `globalTags` gets
`spaceId`, the junction's `[taskId+labelId]` pair is implicitly
within-Space via the parent task's spaceId.)

### Internal / infrastructure (10) — special handling

| Table | Handling |
|---|---|
| `_pendingChanges` | Add `spaceId` column from pending-change payload so sync routes know the partition. |
| `_syncMeta` | Infra-level; no spaceId. |
| `_activity` | Deprecated, superseded by `_events`. Leave read-only. |
| `_events` | Local-only domain event store. Event metadata already carries `appId` + `recordId`; no spaceId needed at event layer (materialized downstream). |
| `_eventsTombstones` | Sync tombstones; no spaceId (appId+collection+recordId sufficient). |
| `_memory`, `_nudgeOutcomes` | Companion-brain local memory; never synced. No spaceId. |
| `_byokKeys` | BYOK master-key storage. Device-local, encrypted. User-level by nature. |
| `_aiDebugLog` | Per-iteration LLM debug capture. Capped. **Never synced** (leaks decrypted content). No spaceId. |
| `_streakState` | Companion engagement tracker. Local-only. |
| `_serverIterationExecutions` | Idempotency marker for server-source AI iterations. Local-only. |

### Scope summary

- **To-migrate**: 7 tables (add `spaceId` + drop `userId` + encrypt as noted)
- **userId sweep**: 46 already-space-scoped tables (drop `userId` only)
- **User-level**: 10 existing + 1 new (`userTagPresets`) — no change to these
- **Junctions**: 19 — all parents space-scoped, no action needed
- **Internal/infra**: 10 — handled per table-type, mostly no action

**No blockers.** Phase 2 can proceed.
