# Calendar App Team

## Module: calendar
**Path:** `apps/calendar`
**Description:** Full-featured calendar application for personal and shared time management. Supports multiple calendars, recurring events, CalDAV/iCal sync, reminders, and calendar sharing with permission controls.
**Tech Stack:** NestJS (backend), SvelteKit (web), Expo/React Native (mobile), Astro (landing)
**Platforms:** Backend, Web, Mobile (planned), Landing

## Team Overview

This team manages the Calendar application, a comprehensive time management solution with advanced features like recurring events (RFC 5545 RRULE), external calendar synchronization, and collaborative sharing.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, feature prioritization, calendar UX |
| Architect | `architect.md` | System design, recurrence logic, sync architecture |
| Senior Developer | `senior-dev.md` | Complex features, RRULE implementation, code review |
| Developer | `developer.md` | Feature implementation, bug fixes, CRUD operations |
| Security Engineer | `security.md` | Auth flows, sharing permissions, data privacy |
| QA Lead | `qa-lead.md` | Testing strategy, edge cases, timezone handling |

## Key Features
- Multi-calendar management with color coding
- Full event CRUD with recurring events (RFC 5545 RRULE)
- Multiple calendar views (day, week, month, agenda, year planned)
- Calendar sharing with granular permissions (read/write/admin)
- CalDAV/iCal bidirectional sync with external calendars
- Smart reminders (push notifications and email)
- Event tagging and organization
- Network view for related events
- Multi-language support (DE, EN, FR, ES, IT)
- Timezone handling with date-fns

## Architecture
```
apps/calendar/
├── apps/
│   ├── backend/    # NestJS API (port 3014)
│   ├── web/        # SvelteKit frontend (port 5179)
│   ├── mobile/     # Expo React Native (planned)
│   └── landing/    # Astro marketing site (port 4322)
└── packages/
    └── shared/     # Shared TypeScript types
```

## API Structure
- `GET/POST /api/v1/calendars` - Calendar CRUD
- `GET/POST /api/v1/events` - Event management with date range queries
- `GET/POST /api/v1/events/:eventId/reminders` - Reminder management
- `GET/POST /api/v1/calendars/:id/shares` - Calendar sharing
- `GET/POST /api/v1/sync/external` - External calendar sync
- `POST /api/v1/sync/caldav/discover` - CalDAV discovery
- `GET /api/v1/calendars/:id/export.ics` - iCal export

## Database Schema
- **calendars**: User calendars with settings (color, timezone, visibility)
- **events**: Calendar events with recurrence rules, location, metadata
- **reminders**: Event reminders with notification preferences
- **calendar_shares**: Sharing permissions and invitations
- **external_calendars**: CalDAV/iCal sync configuration
- **event_tags**: Custom event categorization
- **event_tag_groups**: Organized tag groups

## How to Use
```
"As the [Role] for calendar, help me with..."
"Read apps/calendar/.agent/team/ and help me understand..."
```
