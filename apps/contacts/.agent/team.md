# Contacts App Team

## Module: contacts
**Path:** `apps/contacts`
**Description:** Contact management application with Google Contacts integration, import/export capabilities, tags, notes, activities, and photo storage. Features duplicate detection, network visualization, and team/organization sharing.
**Tech Stack:** NestJS (backend), SvelteKit (web), Expo/React Native (mobile), PostgreSQL, MinIO/S3
**Platforms:** Backend, Web, Mobile, Landing

## Team Overview

This team manages the Contacts application, a comprehensive contact management solution with advanced features like duplicate detection, network visualization, and organization-wide sharing capabilities.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, feature prioritization, product vision |
| Architect | `architect.md` | System design, API structure, data modeling |
| Senior Developer | `senior-dev.md` | Complex features, code review, patterns |
| Developer | `developer.md` | Feature implementation, bug fixes |
| Security Engineer | `security.md` | Auth flows, OAuth security, data privacy |
| QA Lead | `qa-lead.md` | Testing strategy, quality gates, E2E tests |

## Key Features
- Full contact CRUD with rich profiles (name, email, phone, address, company, etc.)
- Google Contacts OAuth integration (import/sync)
- vCard and CSV import/export
- Tags and notes for contact organization
- Activity log (calls, emails, meetings)
- Contact photo storage (MinIO/S3)
- Duplicate detection and merging
- Network visualization (contact relationships)
- Team/organization sharing
- Favorites and archive

## Architecture
```
apps/contacts/
├── apps/
│   ├── backend/    # NestJS API (port 3015)
│   ├── web/        # SvelteKit frontend (port 5184)
│   ├── mobile/     # Expo React Native (planned)
│   └── landing/    # Astro marketing site
└── packages/
    └── shared/     # Shared TypeScript types
```

## API Structure
- `POST/GET /api/v1/contacts` - Contact CRUD
- `POST /api/v1/contacts/:id/favorite` - Toggle favorite
- `POST /api/v1/contacts/:id/archive` - Toggle archive
- `POST /api/v1/contacts/:id/photo` - Upload photo
- `GET/POST /api/v1/tags` - Tag management
- `GET/POST /api/v1/contacts/:id/notes` - Notes
- `GET/POST /api/v1/contacts/:id/activities` - Activity log
- `POST /api/v1/import/preview` - Import preview (vCard/CSV)
- `POST /api/v1/import/execute` - Execute import
- `GET /api/v1/google/auth-url` - Google OAuth
- `POST /api/v1/google/import` - Import from Google
- `GET/POST /api/v1/export` - Export contacts
- `GET /api/v1/duplicates` - Find duplicates
- `GET /api/v1/network` - Network graph data

## How to Use
```
"As the [Role] for contacts, help me with..."
"Read apps/contacts/.agent/team/ and help me understand..."
```
