# Times

Zeiterfassung & Timetracking - Dein Arbeitsrhythmus, messbar gemacht.

**Web App Port:** 5197

## Project Overview

Times is a professional time tracking app with timer, manual entry, projects, clients, reports, templates, and guild (team) integration. Built local-first for offline capability and instant UI.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| Data | @manacore/local-store (Dexie.js + mana-sync) |
| Auth | @manacore/shared-auth + AuthGate (guest mode supported) |
| Icons | @manacore/shared-icons (Phosphor) |
| PWA | @vite-pwa/sveltekit + Workbox |
| i18n | svelte-i18n (de, en) |
| Testing | Vitest |

## Development

```bash
# From monorepo root
pnpm dev:times:web      # Start web app on port 5197
pnpm dev:times:full     # Start with auth + sync server

# Tests
pnpm --filter @times/web test        # Run all tests
pnpm --filter @times/web test:unit   # Run in watch mode

# Type checking
pnpm --filter @times/web type-check
pnpm --filter @times/shared type-check
```

## Key Features

### Timer
- Start/stop with one click, live HH:MM:SS counter
- Persists in IndexedDB (survives page reload/crash)
- Auto-save every 10 seconds
- Compact indicator in navbar when running (visible on all pages)
- Quick Start from recent entries or templates

### Time Entries
- Manual entry with quick-duration buttons (15m, 30m, 1h, 1.5h, 2h, 4h)
- Inline-expand editing (click to expand, auto-save on change)
- Day grouping with totals
- Filter by week/month/all
- CSV export (semicolon-delimited, UTF-8 BOM for Excel)

### Projects
- Color-coded project cards with budget progress bars
- Client assignment with inherited billing rates
- Billable/non-billable toggle
- Archive/unarchive, inline CRUD

### Clients
- Billing rates (per hour/day) with currency selection
- Short codes for quick reference
- Project and hours rollup

### Reports
- Stats: total hours, billable hours, avg/day, entry count
- Billable vs non-billable breakdown bar
- Hours by project (horizontal bar chart)
- Hours by day (vertical bar chart, last 7 days)
- Week/month toggle
- CSV export

### Templates
- Save frequent entries as reusable templates
- One-click timer start from template
- Sorted by usage count

### Settings
- Working hours/day, working days/week
- Week start (Monday/Sunday)
- Rounding increment (0/1/5/6/10/15 min) and method (none/up/down/nearest)
- Default billing rate with currency (EUR/CHF/USD/GBP)
- Timer reminder and auto-stop configuration

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `s` | Start/Stop timer |
| `n` | New manual entry |
| `Escape` | Close modal / blur input |

## Data Collections

| Collection | Purpose | Key Indexes |
|------------|---------|-------------|
| clients | Customer management | order, isArchived, shortCode |
| projects | Project tracking | clientId, isArchived, isBillable, guildId |
| timeEntries | Core time records | projectId, date, isRunning, [date+projectId] |
| tags | Entry categorization | name, order |
| templates | Quick-start templates | usageCount, lastUsedAt |
| settings | App configuration | (single record) |

## Project Structure

```
apps/times/
├── apps/
│   └── web/                          # SvelteKit web client (port 5197)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/           # Login/register flow
│       │   │   │   └── login/
│       │   │   ├── (app)/            # Authenticated app
│       │   │   │   ├── +layout.svelte  # AuthGate, PillNav, TimerIndicator, contexts
│       │   │   │   ├── +page.svelte    # Timer home page
│       │   │   │   ├── entries/        # Time entry list
│       │   │   │   ├── projects/       # Project management
│       │   │   │   ├── clients/        # Client management
│       │   │   │   ├── reports/        # Dashboard & charts
│       │   │   │   ├── templates/      # Entry templates
│       │   │   │   ├── settings/       # App configuration
│       │   │   │   ├── mana/           # Credits & subscription
│       │   │   │   ├── feedback/       # Feedback form
│       │   │   │   ├── profile/        # User profile
│       │   │   │   ├── themes/         # Theme selection
│       │   │   │   └── help/           # Help & docs
│       │   │   ├── +layout.svelte      # Root layout (i18n, theme, auth init)
│       │   │   ├── +layout.ts          # SSR disabled
│       │   │   ├── +error.svelte       # Error page
│       │   │   ├── health/+server.ts   # Health check
│       │   │   └── offline/            # Offline fallback
│       │   └── lib/
│       │       ├── data/
│       │       │   ├── local-store.ts  # 6 collections + typed accessors
│       │       │   ├── queries.ts      # Live queries + pure helpers
│       │       │   ├── queries.test.ts # Unit tests
│       │       │   └── guest-seed.ts   # Demo data (2 clients, 3 projects, 5 entries)
│       │       ├── stores/
│       │       │   ├── auth.svelte.ts  # Mana auth factory
│       │       │   ├── timer.svelte.ts # Timer start/stop/resume/auto-save
│       │       │   ├── view.svelte.ts  # View mode, filters, sort
│       │       │   ├── theme.ts        # Theme store (ocean default)
│       │       │   ├── navigation.ts   # Nav collapse state
│       │       │   └── user-settings.svelte.ts
│       │       ├── components/
│       │       │   ├── TimerCard.svelte       # Main timer widget
│       │       │   ├── TimerIndicator.svelte  # Compact navbar indicator
│       │       │   ├── EntryItem.svelte       # Inline-expandable entry
│       │       │   ├── EntryList.svelte       # Day-grouped entry list
│       │       │   ├── EntryForm.svelte       # Manual entry modal
│       │       │   ├── QuickStart.svelte      # Recent entry pills
│       │       │   └── KeyboardShortcuts.svelte
│       │       ├── utils/
│       │       │   ├── export.ts       # CSV export
│       │       │   └── export.test.ts  # Export tests
│       │       ├── i18n/
│       │       │   ├── index.ts        # svelte-i18n setup
│       │       │   └── locales/        # de.json, en.json
│       │       └── version.ts
│       └── static/
├── packages/
│   └── shared/                        # @times/shared
│       └── src/
│           ├── types/index.ts          # All TypeScript types
│           ├── constants/index.ts      # Currencies, colors, defaults
│           └── index.ts
├── CLAUDE.md
└── package.json
```

## Architecture

### Timer Flow
```
User clicks Start → timerStore.start() → Insert timeEntry (isRunning=true) → IndexedDB
                                       → Start 1s tick interval (UI counter)
                                       → Start 10s auto-save interval

User clicks Stop  → timerStore.stop()  → Update timeEntry (isRunning=false, endTime, duration)
                                       → Stop intervals
                                       → Entry appears in today's list
```

### Data Flow (Local-First)
```
Guest:      App → IndexedDB (Dexie.js) → UI            (no sync)
Logged in:  App → IndexedDB → UI → SyncEngine → mana-sync → PostgreSQL
                                  ← WebSocket push ←
```

### Context Providers (set in app layout)
All data is provided via Svelte context from `(app)/+layout.svelte`:
- `clients` - Live query of all clients
- `projects` - Live query of all projects
- `timeEntries` - Live query of all time entries
- `tags` - Live query of all tags
- `templates` - Live query of all templates
- `settings` - Live query of settings (single record)

## Gilden Integration (Planned v2)

- Projects with `visibility: 'guild'` + `guildId` are shared with team
- Time entries inherit visibility from project
- Team dashboard: hours per member, budget tracking
- Manager vs member views
- Credit consumption from guild pool for AI/PDF features
