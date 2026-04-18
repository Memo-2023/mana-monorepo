# Scene-Scope Empty State

**Status:** proposed
**Scope:** UX + data-layer
**Owner:** till
**Created:** 2026-04-18

## Problem

Each workbench scene can be filtered by `scopeTagIds` (set via the
`TagSelector` in `SceneHeader`). When a scope is active, the module
queries (`useAllTasks`, `useAllNotes`, `useAllContacts`,
`useAllEvents`) silently drop records that don't match. Users then see
an ordinary empty state — *"Keine Aufgaben"*, *"Keine Treffer"* — with
no hint that

1. the scope filter is the reason the list is empty, or
2. there's a single click to clear the scope and see everything.

Effect: users on a narrowly-scoped scene experience their own data as
missing and often reload or re-type filters they already cleared.

## Goals

- User understands that the scope is the reason the list is empty.
- Clearing the scope is one click from the empty list.
- No perf regression: scope filtering is already batched, and the
  solution must not add a second unbatched pass.
- No cross-module coupling: modules stay owners of their own empty
  state copy and affordance.

## Non-goals

- Visualizing the per-module count of hidden records in a badge. A
  rough "scope is active" signal is enough for v1.
- Changing the filter semantics (untagged-is-global, etc.).
- Onboarding around scopes — that belongs on its own plan.

## Current state

Today the filter is applied inside each module's `queries.ts`:

```ts
const scoped = filterBySceneScopeBatch(decrypted, (t) => t.id, tagMap);
return scoped.map(toTask);
```

`scene-scope.svelte.ts` holds the active `scopeTagIds` in a reactive
`$state`. `SceneHeader.svelte` renders a `TagSelector` that edits the
active scene's scope and shows the selected tags.

Modules wired today: `todo`, `notes`, `calendar`, `contacts`. Others
(events, journal, dreams, habits…) will join as they add tag
associations.

## Design

### Phase 1 — scope-aware empty state (recommended starting point)

Each module's ListView already renders an empty-state message when the
filtered list is empty. Extend that single element to branch on the
reactive `getSceneScopeTagIds()`:

```svelte
{#if filtered.length === 0}
  {#if hasActiveScope}
    <ScopeEmptyState onClearScope={() => clearSceneScope()} />
  {:else}
    <p class="empty">Keine Aufgaben</p>
  {/if}
{/if}
```

- `ScopeEmptyState` is a small shared component rendering a muted icon,
  one line ("Aktive Bereichsfilter verbergen alles.") and a pill button
  "Bereich zurücksetzen".
- `clearSceneScope()` on the scene-scope store calls
  `workbenchScenesStore.setSceneScopeTags(activeSceneId, undefined)`.
- `hasActiveScope` is a small helper `$derived(getSceneScopeTagIds())`
  that returns boolean.

Cost: one shared component, one helper, ~10 lines per ListView. No
changes to `queries.ts` or the filter primitives.

### Phase 2 (optional) — per-module hidden count

For modules where the hidden count is user-meaningful, fatten the hook
return to include an unfiltered count:

```ts
export function useAllTasks(): { value: Task[]; hiddenByScope: number }
```

Requires the query to compute the count before applying the filter and
expose it through `useLiveQueryWithDefault`. Skip unless Phase 1
doesn't resolve the UX complaint.

### Phase 3 (optional) — scope indicator badge

Add a small always-on chip in the PillNav or scene tab when the current
scene has an active scope, even when the user isn't on an empty list.
Out of scope for the immediate fix but a natural extension.

## Implementation steps (Phase 1)

1. **Shared component** — `src/lib/components/workbench/ScopeEmptyState.svelte`
   - Takes `onClearScope: () => void` and an optional `moduleLabel` prop.
   - Matches the existing `.empty` styling.
2. **Helper on the scene-scope store**:
   - `export function hasActiveSceneScope(): boolean` — reactive.
   - `export function clearSceneScope(): void` — calls
     `workbenchScenesStore.setSceneScopeTags(activeSceneId, undefined)`,
     no-op when there's no active scene.
3. **ListView edits** — four files, identical pattern:
   - `todo/ListView.svelte`
   - `notes/ListView.svelte`
   - `calendar/ListView.svelte`
   - `contacts/ListView.svelte`
4. **Tests**:
   - Unit test `hasActiveSceneScope` + `clearSceneScope` in
     `stores/scene-scope.test.ts`.
   - No integration tests — the visual branch is trivial.
5. **Docs**: mention the pattern in `apps/mana/CLAUDE.md` under
   *Scene Scope*, so new modules wire the empty state when they adopt
   `filterBySceneScopeBatch`.

## Tradeoffs

- **Simplicity vs precision.** Phase 1 doesn't tell users *which
  records* are hidden, just that the scope is the reason. Most users
  only need that signal. Phase 2 is a follow-up if user feedback
  demands the exact count.
- **Coupling.** The shared component makes each ListView depend on
  the scene-scope store for its empty branch. That's already implicit
  (the filter is applied in each `queries.ts`), so it's not new
  surface — just made visible.
- **Mixed empty causes.** If the user has zero records *and* an
  active scope, we still show the scope empty state. That's arguably
  correct (clearing the scope does something useful — reveals the
  zero-state onboarding CTA the module would otherwise show). If it
  becomes confusing we can differentiate with a pre-scope count.

## Rollout

Ship Phase 1 behind the existing scope wiring. No migration, no
feature flag — users who never touched scope see no change; users who
did see a friendlier empty state the next time they land on it. Each
additional module that adopts scope filtering picks up the empty state
by including the shared component at the same time.

## Open questions

- Should the ScopeEmptyState show the current scope tag names ("Nur
  ›Deep Work‹") or stay abstract? Names would be more informative but
  require a tag lookup inside the component.
- Phase 2 hook change is a breaking API change for all callers. Is it
  worth it, or can we keep the value-only return and expose a separate
  `useScopeHiddenCount(appId)` instead?
