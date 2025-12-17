# Clock App Team

## Module: clock
**Path:** `apps/clock`
**Description:** Comprehensive clock application featuring world clock, alarms, timers, stopwatch, and pomodoro timer. Synchronizes alarms and timers across devices with stylish clock face widgets and life clock visualizations.
**Tech Stack:** NestJS (backend), SvelteKit (web), Astro (landing)
**Platforms:** Backend, Web, Landing

## Team Overview

This team manages the Clock application, a multi-feature time management tool that combines functionality with aesthetics through customizable clock faces and time tracking features.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, feature prioritization, UX decisions |
| Architect | `architect.md` | System design, sync architecture, time handling |
| Senior Developer | `senior-dev.md` | Complex features, real-time sync, patterns |
| Developer | `developer.md` | Feature implementation, bug fixes |
| Security Engineer | `security.md` | Auth flows, data privacy, user-scoped queries |
| QA Lead | `qa-lead.md` | Testing strategy, time-based testing, quality gates |

## Key Features
- World Clock: Multi-timezone display with day/night indicators
- Alarms: Repeating alarms with cross-device sync
- Timers: Multiple concurrent timers with presets
- Stopwatch: Lap tracking with best/worst analysis
- Pomodoro: Customizable work/break cycles
- Clock Faces: 20+ stylish widget designs
- Life Clock: Visualize life progress and time tracking

## Architecture
```
apps/clock/
├── apps/
│   ├── backend/    # NestJS API (port 3017)
│   ├── web/        # SvelteKit frontend
│   └── landing/    # Astro marketing site
└── packages/
    └── shared/     # Shared TypeScript types
```

## API Structure
- `GET/POST /api/v1/alarms` - Alarm CRUD operations
- `GET/POST /api/v1/timers` - Timer management and control
- `GET/POST /api/v1/world-clocks` - World clock CRUD
- `GET/POST /api/v1/presets` - Timer/Pomodoro presets
- `GET /api/v1/timezones/search` - Timezone search

## How to Use
```
"As the [Role] for clock, help me with..."
"Read apps/clock/.agent/team/ and help me understand..."
```
