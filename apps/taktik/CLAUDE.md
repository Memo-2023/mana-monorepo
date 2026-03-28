# Taktik

Zeiterfassung & Timetracking - Dein Arbeitsrhythmus, messbar gemacht.

**Web App Port:** 5197

## Project Overview

Taktik is a professional time tracking app with timer, manual entry, projects, clients, reports, and guild (team) integration. Built local-first for offline capability and instant UI.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| Data | @manacore/local-store (Dexie.js + mana-sync) |
| Icons | @manacore/shared-icons (Phosphor) |
| PWA | @vite-pwa/sveltekit + Workbox |
| i18n | svelte-i18n (de, en) |

## Key Concepts

- **Timer**: Start/stop time tracking with live counter, persists in IndexedDB
- **Time Entries**: Core entity with duration, project, client, tags, billable flag
- **Projects**: Client projects or internal, with budgets and billing rates
- **Clients**: Customer management with billing rates and short codes
- **Templates**: Saved entry patterns for quick start
- **Reports**: Charts and statistics (ActivityHeatmap, DonutChart, TrendLineChart)
- **Gilden**: Team time tracking with shared projects and visibility controls

## Development

```bash
# From monorepo root
pnpm dev:taktik:web    # Start web app on port 5197
pnpm dev:taktik:full   # Start with auth + sync server
```

## Data Collections

| Collection | Purpose |
|------------|---------|
| clients | Customer/client management |
| projects | Project tracking with budgets |
| timeEntries | Core time entry records |
| tags | Entry categorization |
| templates | Quick-start entry templates |
| settings | App configuration |

## Project Structure

```
apps/taktik/
├── apps/
│   └── web/                      # SvelteKit web client
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/       # Login flow
│       │   │   └── (app)/        # Authenticated app
│       │   │       ├── entries/
│       │   │       ├── projects/
│       │   │       ├── clients/
│       │   │       ├── reports/
│       │   │       └── settings/
│       │   └── lib/
│       │       ├── stores/       # Svelte 5 rune stores
│       │       ├── components/   # UI components
│       │       ├── i18n/         # Translations (de, en)
│       │       └── data/         # Local-store, queries, guest seed
│       └── static/
└── packages/
    └── shared/                   # Shared types & constants
```
