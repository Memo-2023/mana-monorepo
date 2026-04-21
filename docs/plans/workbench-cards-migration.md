# Workbench cards over subroutes — migration plan

_Started 2026-04-21._

## Why

User preference (2026-04-21):
> *"wir wollen möglichst alles als cards darstellen statt unterrouten"*

The unified Mana app has a workbench that lets users compose scenes
from draggable cards. Every module already registers itself as a card
via `registerApp()` in `apps/mana/apps/web/src/lib/app-registry/apps.ts`
so the list/detail view shows up when the user drops the app into a
scene.

Secondary surfaces — admin panels, per-module settings, filtered
lists (archive/favorites), preference editors — were historically
built as dedicated subroutes (`/admin/users`, `/broadcasts/settings`,
`/news/preferences`, …). That forces a URL round-trip and fragments
the UX: you can't have "members" and "broadcast settings" side-by-side
in the same scene without flipping tabs.

**Convention going forward:** secondary surfaces ship as workbench
cards first. If a subroute already exists and should stay navigable by
URL, we keep the route as a thin wrapper that renders the same
ListView the workbench uses.

## Pattern

For every surface being migrated:

```
apps/mana/apps/web/src/
├── lib/modules/{id}/
│   └── ListView.svelte              # self-contained pane
├── lib/app-registry/apps.ts         # registerApp({ id, views: { list } })
└── routes/(app)/{path}/+page.svelte # thin wrapper: `<ListView />`
```

Rules of thumb:

- **Pane chrome:** ListView wraps its own content in a `.pane`
  container with `max-width: 720px` (or similar) and theme tokens
  (`hsl(var(--color-foreground))`, `hsl(var(--color-card))`,
  `hsl(var(--color-border))`). No `<PageHeader>` — the workbench
  provides scene chrome, and the route wrapper works without one.
- **No MANA_APPS entry** for power-user cards (admin/settings).
  MANA_APPS is the app-drawer; admin panels shouldn't appear there.
  Only add a MANA_APPS entry when the surface is user-facing
  (e.g. `spaces`).
- **Admin-role guard inline** for admin cards: the workbench doesn't
  run the `/admin/+layout.svelte` guard, so each admin ListView
  checks `authStore.user?.role === 'admin'` and renders a fallback
  `Admin-only` gate-screen for non-admins.
- **Wrap existing form components** where the subroute was already
  thin (e.g. `/broadcasts/settings` delegated to `SettingsForm`); the
  ListView just wraps that component + a small bar heading.
- **Route wrapper is 10 lines:**
  ```svelte
  <script lang="ts">
    import ListView from '$lib/modules/{id}/ListView.svelte';
  </script>
  <ListView />
  ```

## Out of scope (stay as routes)

- Detail pages with `[id]` parameters — the URL is the entity
  identifier (`notes/[id]`, `contacts/[id]`, `events/[id]`,
  `admin/user-data/[userId]`, `broadcasts/[id]/edit`, …).
- Deeply nested flows — `citycorners/cities/[slug]/locations/[id]`
  etc. Every level as a card would explode the registry and break
  deep-linking.
- Auth-critical pages needing SSR redirects — login/register/recovery.

## Shipped batches

### Batch 1 — Spaces (commit `88eca8a75`, 2026-04-21)

| Card id  | Route              | Module folder        |
| -------- | ------------------ | -------------------- |
| `spaces` | `/spaces` (new canonical) + `/spaces/members` (legacy alias) | `lib/modules/spaces/` |

Also: `APP_ICONS.spaces` + MANA_APPS entry + `SpaceSwitcher` link
updated to `/spaces`.

### Batch 2 — Admin + Module Settings (commit `92fe23d46`, 2026-04-21)

Admin cards (role-gated inline):

| Card id             | Route                  | Source                              |
| ------------------- | ---------------------- | ----------------------------------- |
| `admin-users`       | `/admin/users`         | extracted from route                |
| `admin-system`      | `/admin/system`        | extracted from route                |
| `admin-user-data`   | `/admin/user-data`     | extracted from route                |
| _(existing)_        | `/admin/complexity`    | route now wraps `complexity` module |

Module settings cards:

| Card id              | Route                   | Source                                    |
| -------------------- | ----------------------- | ----------------------------------------- |
| `broadcast-settings` | `/broadcasts/settings`  | wraps `broadcast/components/SettingsForm` |
| `invoices-settings`  | `/invoices/settings`    | wraps `invoices/components/SenderProfileForm` |
| `uload-settings`     | `/uload/settings`       | extracted from route                      |
| `news-preferences`   | `/news/preferences`     | extracted from route                      |

## Backlog

### High-value next batch (archive/filtered-list surfaces)

All of these are single-view pages inside existing modules — the
content is self-contained and benefits from being scene-composable
next to the module's main ListView.

- `chat/archive`, `chat/templates`
- `memoro/archive`, `memoro/tags`
- `picture/archive`, `picture/board`
- `storage/favorites`, `storage/trash`, `storage/search`
- `photos/favorites`, `photos/albums`, `photos/upload`
- `quotes/categories`, `quotes/favorites`, `quotes/lists`
- `news/saved`, `news/sources`, `news/add`
- `meditate/history`, `food/history`, `food/goals`, `food/add`
- `plants/tags`, `plants/add`
- `moodlit/moods`, `moodlit/sequences`
- `cards/decks`, `cards/explore`, `cards/progress`
- `music/library`, `music/playlists`, `music/projects`
- `inventory/categories`, `inventory/locations`, `inventory/search`,
  `inventory/collections`
- `skilltree/achievements`, `skilltree/tree`
- `calendar/calendars`
- `uload/tags`, `uload/links`, `uload/analytics/[id]` _(detail — skip)_
- `times/clients`, `times/projects`, `times/reports`,
  `times/templates`, `times/entries`, `times/clock`
- `agents/templates`
- `timeline/analytics`
- `research-lab/keys`

### Second-tier (settings-style, likely worth migrating)

- `todo/settings` (367 lines — non-trivial, worth a separate batch)

### Admin-adjacent (not yet migrated)

- `organizations`, `teams` — technically post-Spaces these routes are
  dead ends (users are told to use Spaces instead). Either migrate
  to cards or delete.
- `gifts`, `gifts/redeem` — probably keep as routes (shareable)
- `feedback`, `observatory`, `llm-test`, `tags` — already registered
  as cards or thin enough to leave.

## Open questions

- Should the `/admin/+layout.svelte` nav tabs be removed once every
  sub-page is a card? Cards make the sidebar nav redundant, but the
  admin role guard still lives in the layout so removing it means
  moving that guard somewhere else. _Decision deferred until the
  full admin batch is shipped._
- Do we want a convention for registering _sibling_ views of the
  same module (e.g. `chat-archive` alongside `chat`)? Current pattern
  uses separate ids. Works, but clutters the registry.
