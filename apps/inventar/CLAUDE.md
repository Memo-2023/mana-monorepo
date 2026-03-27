# Inventar

Configurable inventory management app - track anything with custom schemas.

**Web App Port:** 5190

## Project Overview

Inventar is a schema-less inventory management system built with SvelteKit. Users can create collections with custom field definitions, organize items by location and category, and view them in list/grid/table views.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| State | Svelte 5 runes ($state, $derived) with localStorage persistence |
| Icons | @manacore/shared-icons (Phosphor) |
| PWA | @vite-pwa/sveltekit + Workbox |
| i18n | svelte-i18n (de, en) |

## Key Concepts

- **Collections**: Groups of items with a shared schema (custom field definitions)
- **Templates**: Predefined schemas for common item types (electronics, books, etc.)
- **Items**: Individual inventory entries with custom field values
- **Locations**: Hierarchical places (House > Room > Cabinet > Shelf)
- **Categories**: Flexible categorization with hierarchy
- **Views**: List, Grid, Table views with saved filters

## Development

```bash
# From monorepo root
pnpm dev:inventar:web    # Start web app on port 5190
```

## Project Structure

```
apps/inventar/
├── apps/
│   └── web/                      # SvelteKit web client
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/       # Login flow
│       │   │   └── (app)/        # Authenticated app
│       │   │       ├── collections/
│       │   │       ├── items/
│       │   │       ├── locations/
│       │   │       └── categories/
│       │   └── lib/
│       │       ├── stores/       # Svelte 5 rune stores
│       │       ├── components/   # UI components
│       │       ├── i18n/         # Translations
│       │       └── data/         # Templates, defaults
│       └── static/
└── packages/
    └── shared/                   # Shared types & constants
```
