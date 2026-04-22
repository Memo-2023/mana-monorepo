# Workbench cards over subroutes — migration plan

_Started 2026-04-21. Scope revised 2026-04-22 after the first batch landed._

## Why

User preference (2026-04-21):
> *"wir wollen möglichst alles als cards darstellen statt unterrouten"*

The unified Mana app has a workbench that lets users compose scenes
from draggable cards. Every module already registers itself as a card
via `registerApp()` in `apps/mana/apps/web/src/lib/app-registry/apps.ts`
so the list/detail view shows up when the user drops the app into a
scene.

After the first pass (Batch 1 + 2, 9 new cards) the scene-picker got
noticeably cluttered. User feedback 2026-04-22:

> *"finde das doch nicht so gut mit einzelnen Karten für alles —
> dadurch haben wir sehr viele pages in der workbench"*

The revised principle is sharper than "everything as a card":

**Cards are for daily workflows.** Config and power-user panels are
either a) fused into a single tabbed card per domain, or b) stay as
routes opened from the parent module's ⚙ button.

## Decision matrix

| Surface type | Example | Ship as |
| --- | --- | --- |
| Operative daily view | `spaces` (member list), `todo`, `calendar` | Single-view card |
| Multi-surface power-user domain | `admin` (overview / users / system / user-data) | One card with internal tabs |
| Per-module configuration | `broadcasts/settings`, `news/preferences` | Route, opened from module via ⚙ |
| Entity detail | `notes/[id]`, `admin/user-data/[userId]` | Route (URL = entity id) |
| Deeply nested flow | `citycorners/cities/[slug]/…` | Route tree |
| Auth-critical | `/login`, `/register` | Route with SSR redirect |

## Patterns

### Single-view card

```
apps/mana/apps/web/src/
├── lib/modules/{id}/ListView.svelte        # self-contained pane
├── lib/app-registry/apps.ts                # registerApp({ id, views: { list } })
└── routes/(app)/{path}/+page.svelte        # thin wrapper: <ListView />
```

Use when the module has **one primary surface** users interact with
daily (e.g. `spaces` member list).

### Tabbed card (fused domain)

```
lib/modules/admin/
├── ListView.svelte                         # tab container + role guard
└── tabs/
    ├── OverviewTab.svelte
    ├── UsersTab.svelte
    ├── SystemTab.svelte
    └── UserDataTab.svelte
```

`ListView` takes an `initialTab` prop so route wrappers can deep-link
to a tab (`/admin/users` → `<ListView initialTab="users" />`). One role
guard at the container level, one card id in the registry.

Use when a domain has **several sibling surfaces** that belong
together conceptually and would otherwise each need their own card.

### Route-only (config / settings)

```
routes/(app)/{module}/settings/+page.svelte  # self-contained page
```

Opened from the parent module's ⚙ button. No card, no registry entry.

Use for **one-time configuration** surfaces that the user touches once
and forgets. Cards are for things you come back to.

## Rules of thumb

- **Pane chrome:** card ListViews wrap their own content in a `.pane`
  container with `max-width: 720px` (or similar) + theme tokens
  (`hsl(var(--color-foreground))`, `hsl(var(--color-card))`,
  `hsl(var(--color-border))`). No `<PageHeader>` — the workbench
  provides scene chrome; the route wrapper works without one.
- **Role guards at the container level** for tabbed domain cards — one
  gate-screen, not one per tab.
- **No MANA_APPS entry** for power-user cards (admin). MANA_APPS is
  the app-drawer; admin panels shouldn't appear there. Only add a
  MANA_APPS entry when the surface is user-facing (e.g. `spaces`).
- **Route wrapper is short:**
  ```svelte
  <script lang="ts">
    import ListView from '$lib/modules/{id}/ListView.svelte';
  </script>
  <ListView />
  ```
  or, for tabbed-card deep-links:
  ```svelte
  <ListView initialTab="users" />
  ```

## Shipped

### Batch 1 — Spaces card (commit `88eca8a75`, 2026-04-21)

| Card id  | Route                                                        | Module               |
| -------- | ------------------------------------------------------------ | -------------------- |
| `spaces` | `/spaces` (canonical) + `/spaces/members` (legacy alias)     | `lib/modules/spaces/` |

Also: `APP_ICONS.spaces` + MANA_APPS entry + `SpaceSwitcher` link
updated to `/spaces`. Daily-workflow surface (managing Space members)
— classic single-view card.

### Batch 2 — Admin panels + module settings (commit `92fe23d46`, 2026-04-21) — SUPERSEDED

Created 4 admin sub-cards + 4 settings cards. See superseding commits
below.

### Batch 3 — Admin cleanup (commit `5bf3ea8cb`, 2026-04-21)

`/admin/+layout.svelte` shrunk to auth-guard only — nav tabs + overview
duplication removed since each `/admin/*` was a thin wrapper.

### Batch 4 — Revise scope (2026-04-22)

Two superseding commits in response to scene-picker clutter:

**commit `3e65637fc`** — revert settings cards to routes:

- Delete `lib/modules/{broadcast-settings, invoices-settings,
  uload-settings, news-preferences}/`
- Restore each settings route's original content
- Remove 4 registerApp entries

**commit `43b4570e6`** — fuse admin cards into one tabbed card:

- New `lib/modules/admin/tabs/{Overview, Users, System, UserData}Tab.svelte`
- `admin/ListView.svelte` becomes a tab container with role guard +
  `initialTab` prop
- `/admin/users`, `/admin/system`, `/admin/user-data` routes pass the
  right `initialTab`
- Delete `lib/modules/admin-{users, system, user-data}/`
- Remove 3 registerApp entries
- Complexity stays its own card (iframe, pre-existed separately)

Net: the scene-picker gained 1 card (`spaces`) for this whole migration.

## Backlog — revised

The original backlog proposed 35+ individual sub-page cards. Per the
new decision matrix, most of those are better off as **routes** (rare
config) or **tabs within the module's existing card** (archives /
filtered lists) rather than as new cards.

### To migrate into the module's existing card as tabs

Examples where a module has multiple daily-use surfaces that would
benefit from fusion:

- `times`: `clients`, `projects`, `reports`, `templates`, `entries`,
  `clock` — natural candidate, many sibling surfaces
- `news`: list vs. `saved` vs. `sources` — could be tabs
- `storage`: `files`, `favorites`, `search`, `trash` — tab view
- `quotes`: feed vs. `categories` vs. `favorites` vs. `lists`
- `cards`: list vs. `decks` vs. `explore` vs. `progress`
- `inventory`: `collections`, `categories`, `locations`, `search`
- `music`: library / playlists / projects
- `citycorners`: map / favorites (the detail routes stay)
- `skilltree`: tree / achievements

### To leave as routes (config or rare-use)

- `broadcasts/settings`, `invoices/settings`, `uload/settings`,
  `news/preferences`, `todo/settings` (shipped as routes again)
- `agents/templates`, `calendar/calendars`, `chat/templates`
- `news/add`, `plants/add`, `food/add`, `photos/upload`
- `research-lab/keys`, `memoro/tags`, `plants/tags`, `uload/tags`
- `timeline/analytics` (probably a tab of `timeline` eventually)
- `gifts`, `gifts/redeem/[code]` (shareable URLs, keep as routes)
- `organizations`, `teams` (post-Spaces these routes are dead ends —
  either redirect to `/spaces` or delete)

### Open questions

- Do we want a convention for per-module tab wiring? The admin card
  established `initialTab` prop + `tabs/*Tab.svelte` subfolder.
  Formalising this in a helper or documenting it in the module
  pattern would make future tab fusions consistent.
- Should the tabbed admin card also pick up `complexity` as a 5th
  tab? It's the only admin-adjacent surface still living outside the
  fused card. Iframe height constraints argued against it for now.
