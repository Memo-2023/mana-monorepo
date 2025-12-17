# Zitare App Team

## Module: zitare
**Path:** `apps/zitare`
**Description:** Daily inspiration app delivering curated quotes and wisdom. Features offline-first architecture with static content bundled in the app, and backend API for user-specific features like favorites and custom lists. Multi-lingual support (German/English).
**Tech Stack:** NestJS (backend), SvelteKit (web), Expo/React Native (mobile), Astro (landing)
**Platforms:** Backend, Web, Mobile, Landing

## Team Overview

This team manages the Zitare application, a content-focused inspirational quotes platform that prioritizes user experience and offline accessibility.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, content strategy, engagement metrics |
| Architect | `architect.md` | Hybrid architecture, offline-first design, content delivery |
| Senior Developer | `senior-dev.md` | Complex features, cross-platform patterns, code review |
| Developer | `developer.md` | Feature implementation, bug fixes, UI components |
| Security Engineer | `security.md` | Auth flows, user data protection, content integrity |
| QA Lead | `qa-lead.md` | Testing strategy, offline mode testing, content quality |

## Key Features
- Static quote library (1000+ quotes) bundled offline
- User favorites and custom lists (synced via backend)
- Multi-lingual content (German and English)
- Category-based browsing and search
- Author profiles with biographies
- Daily quote notifications
- Offline-first architecture

## Architecture
```
apps/zitare/
├── apps/
│   ├── backend/      # NestJS API (port 3007)
│   ├── web/          # SvelteKit frontend
│   ├── mobile/       # Expo React Native
│   └── landing/      # Astro marketing site
└── packages/
    ├── shared/       # Types, utils, configs
    ├── content/      # Static quote data
    └── web-ui/       # Shared Svelte components
```

## API Structure
- `GET /api/health` - Health check
- `GET/POST/DELETE /api/favorites` - User favorites
- `GET/POST/PUT/DELETE /api/lists` - Custom lists
- `POST /api/lists/:id/quotes` - Add quote to list
- `DELETE /api/lists/:id/quotes/:quoteId` - Remove quote from list

## Content Architecture
- **Static Content**: Quotes and authors bundled in `@zitare/content` package
- **Backend API**: User-specific data (favorites, lists) in PostgreSQL
- **Hybrid Model**: Works offline with full content, syncs favorites when online

## How to Use
```
"As the [Role] for zitare, help me with..."
"Read apps/zitare/.agent/team/ and help me understand..."
```
