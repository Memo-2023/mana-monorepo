# Calendar Project Guide

## Übersicht

**Kalender** ist eine vollständige Kalender-Anwendung für persönliches und geteiltes Zeitmanagement. Die App unterstützt mehrere Kalender, wiederkehrende Termine, CalDAV/iCal-Synchronisation und Erinnerungen.

| App | Port | URL |
|-----|------|-----|
| Backend | 3014 | http://localhost:3014 |
| Web App | 5179 | http://localhost:5179 |
| Landing Page | 4322 | http://localhost:4322 |
| Mobile | 8081 | Expo Go |

## Project Structure

```
apps/calendar/
├── apps/
│   ├── backend/      # NestJS API server (@calendar/backend)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/           # Drizzle schemas + migrations
│   │       │   ├── schema/
│   │       │   │   ├── calendars.schema.ts
│   │       │   │   ├── events.schema.ts
│   │       │   │   ├── reminders.schema.ts
│   │       │   │   ├── calendar-shares.schema.ts
│   │       │   │   └── external-calendars.schema.ts
│   │       │   └── db.ts
│   │       ├── calendar/     # Calendar CRUD
│   │       ├── event/        # Event CRUD + queries
│   │       ├── reminder/     # Reminders + notifications
│   │       ├── sync/         # CalDAV/iCal sync
│   │       ├── share/        # Calendar sharing
│   │       └── health/
│   │
│   ├── web/          # SvelteKit web application (@calendar/web)
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api/          # API clients
│   │       │   │   ├── client.ts
│   │       │   │   ├── calendars.ts
│   │       │   │   ├── events.ts
│   │       │   │   ├── reminders.ts
│   │       │   │   └── shares.ts
│   │       │   ├── stores/       # Svelte 5 runes stores
│   │       │   │   ├── auth.svelte.ts
│   │       │   │   ├── view.svelte.ts
│   │       │   │   ├── calendars.svelte.ts
│   │       │   │   ├── events.svelte.ts
│   │       │   │   ├── theme.ts
│   │       │   │   ├── navigation.ts
│   │       │   │   └── toast.ts
│   │       │   ├── components/
│   │       │   │   ├── calendar/
│   │       │   │   │   ├── CalendarHeader.svelte
│   │       │   │   │   ├── WeekView.svelte
│   │       │   │   │   ├── DayView.svelte
│   │       │   │   │   ├── MonthView.svelte
│   │       │   │   │   ├── MiniCalendar.svelte
│   │       │   │   │   └── CalendarSidebar.svelte
│   │       │   │   └── event/
│   │       │   │       └── EventForm.svelte
│   │       │   └── i18n/         # Internationalization (5 Sprachen)
│   │       └── routes/
│   │           ├── +layout.svelte
│   │           ├── +page.svelte          # Hauptkalender (Wochenansicht)
│   │           ├── agenda/+page.svelte   # Agenda-Ansicht
│   │           ├── event/
│   │           │   ├── new/+page.svelte  # Neuer Termin
│   │           │   └── [id]/+page.svelte # Termin bearbeiten
│   │           ├── calendars/+page.svelte
│   │           ├── settings/+page.svelte
│   │           ├── feedback/+page.svelte
│   │           └── (auth)/
│   │               ├── login/+page.svelte
│   │               ├── register/+page.svelte
│   │               └── forgot-password/+page.svelte
│   │
│   ├── landing/      # Astro marketing landing page (@calendar/landing)
│   │   └── src/
│   │       ├── pages/index.astro
│   │       ├── layouts/Layout.astro
│   │       └── components/
│   │           ├── Hero.astro
│   │           ├── Features.astro
│   │           ├── CTA.astro
│   │           └── Footer.astro
│   │
│   └── mobile/       # Expo/React Native mobile app (@calendar/mobile) [TODO]
│
├── packages/
│   ├── shared/       # Shared types, utils, constants (@calendar/shared)
│   │   └── src/
│   │       ├── types/
│   │       │   ├── calendar.ts
│   │       │   ├── event.ts
│   │       │   ├── reminder.ts
│   │       │   └── share.ts
│   │       └── index.ts
│   └── web-ui/       # Shared Svelte components (@calendar/web-ui) [TODO]
│
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# Alle Apps starten
pnpm calendar:dev                 # Run all calendar apps

# Einzelne Apps starten
pnpm dev:calendar:backend         # Start backend server (port 3014)
pnpm dev:calendar:web             # Start web app (port 5179)
pnpm dev:calendar:landing         # Start landing page (port 4322)
pnpm dev:calendar:mobile          # Start mobile app [TODO]
pnpm dev:calendar:app             # Start web + backend together

# Datenbank
pnpm calendar:db:push             # Push schema to database
pnpm calendar:db:studio           # Open Drizzle Studio
pnpm calendar:db:seed             # Seed initial data
```

### Backend (apps/calendar/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
pnpm db:seed                     # Seed initial data
```

### Web App (apps/calendar/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/calendar/apps/landing)

```bash
pnpm dev                         # Start dev server (port 4322)
pnpm build                       # Build for production
pnpm preview                     # Preview build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Mobile** | React Native 0.81 + Expo SDK 54, NativeWind [TODO] |
| **Auth** | Mana Core Auth (JWT) |
| **i18n** | svelte-i18n (DE, EN, FR, ES, IT) |
| **Dates** | date-fns |
| **Sync** | ical.js, tsdav (CalDAV) |

## Architecture

### Core Features

1. **Persönliche Kalender** - Erstelle und verwalte mehrere farbcodierte Kalender
2. **Termine** - Vollständiges CRUD mit Wiederholungsunterstützung (RFC 5545 RRULE)
3. **Geteilte Kalender** - Teile Kalender mit Lese-/Schreib-/Admin-Berechtigungen
4. **CalDAV/iCal Sync** - Bi-direktionale Synchronisation mit Google, Apple, etc.
5. **Erinnerungen** - Push-Benachrichtigungen und E-Mail-Erinnerungen

### Kalender-Ansichten

| Ansicht | Route | Beschreibung |
|---------|-------|--------------|
| **Woche** | `/` (default) | 7-Tage-Raster mit Stunden |
| **Tag** | Click auf Tag | 24-Stunden-Timeline |
| **Monat** | Header-Switch | Traditionelles Kalenderraster |
| **Agenda** | `/agenda` | Chronologische Terminliste |
| **Jahr** | [TODO] | Kompakte 12-Monats-Übersicht |

### Web App Stores (Svelte 5 Runes)

```typescript
// auth.svelte.ts - Authentifizierung
authStore.isAuthenticated  // boolean
authStore.user             // User | null
authStore.signIn(email, password)
authStore.signOut()
authStore.getAccessToken()

// view.svelte.ts - Kalender-Ansicht
viewStore.currentDate      // Date
viewStore.viewType         // 'day' | 'week' | 'month' | 'year' | 'agenda'
viewStore.setDate(date)
viewStore.setViewType(type)
viewStore.goToToday()
viewStore.navigate(direction) // 'prev' | 'next'

// calendars.svelte.ts - Kalender-Verwaltung
calendarsStore.calendars   // Calendar[]
calendarsStore.loading     // boolean
calendarsStore.fetchCalendars()
calendarsStore.createCalendar(data)
calendarsStore.updateCalendar(id, data)
calendarsStore.deleteCalendar(id)
calendarsStore.getColor(calendarId)

// events.svelte.ts - Termine
eventsStore.events         // Event[]
eventsStore.loading        // boolean
eventsStore.fetchEvents(start, end)
eventsStore.getEventsForDay(date)
eventsStore.getEventsForWeek(date)
eventsStore.createEvent(data)
eventsStore.updateEvent(id, data)
eventsStore.deleteEvent(id)
```

### Backend API Endpoints

#### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |

#### Calendars

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/calendars` | GET | List user's calendars |
| `/api/v1/calendars` | POST | Create calendar |
| `/api/v1/calendars/:id` | GET | Get calendar details |
| `/api/v1/calendars/:id` | PUT | Update calendar |
| `/api/v1/calendars/:id` | DELETE | Delete calendar |

#### Events

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/events` | GET | Query events (date range) |
| `/api/v1/events` | POST | Create event |
| `/api/v1/events/:id` | GET | Get event details |
| `/api/v1/events/:id` | PUT | Update event |
| `/api/v1/events/:id` | DELETE | Delete event |
| `/api/v1/events/calendar/:calendarId` | GET | Get events by calendar |

#### Reminders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/events/:eventId/reminders` | GET | List event reminders |
| `/api/v1/events/:eventId/reminders` | POST | Add reminder |
| `/api/v1/reminders/:id` | DELETE | Remove reminder |

#### Sharing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/calendars/:id/shares` | GET | List calendar shares |
| `/api/v1/calendars/:id/shares` | POST | Share calendar |
| `/api/v1/shares/:shareId/accept` | POST | Accept invitation |
| `/api/v1/shares/:shareId/decline` | POST | Decline invitation |

#### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sync/external` | GET | List external calendars |
| `/api/v1/sync/external` | POST | Connect external calendar |
| `/api/v1/sync/external/:id` | DELETE | Disconnect external |
| `/api/v1/sync/external/:id/sync` | POST | Trigger manual sync |
| `/api/v1/sync/caldav/discover` | POST | Discover CalDAV calendars |
| `/api/v1/calendars/:id/export.ics` | GET | Export calendar as iCal |

### Database Schema

#### calendars

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | VARCHAR(255) | Calendar name |
| `description` | TEXT | Optional description |
| `color` | VARCHAR(7) | Hex color code (#3B82F6) |
| `is_default` | BOOLEAN | Default calendar flag |
| `is_visible` | BOOLEAN | Visibility in UI |
| `timezone` | VARCHAR(100) | Default timezone |
| `settings` | JSONB | CalendarSettings object |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

#### events

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `calendar_id` | UUID | FK to calendars |
| `user_id` | UUID | Owner |
| `title` | VARCHAR(500) | Event title |
| `description` | TEXT | Event description |
| `location` | VARCHAR(500) | Location |
| `start_time` | TIMESTAMP | Start datetime |
| `end_time` | TIMESTAMP | End datetime |
| `is_all_day` | BOOLEAN | All-day flag |
| `timezone` | VARCHAR(100) | Event timezone |
| `recurrence_rule` | VARCHAR(500) | RFC 5545 RRULE |
| `recurrence_end_date` | TIMESTAMP | End of recurrence |
| `recurrence_exceptions` | JSONB | Exception dates |
| `parent_event_id` | UUID | Parent for instances |
| `color` | VARCHAR(7) | Override color |
| `status` | VARCHAR(20) | confirmed/tentative/cancelled |
| `external_id` | VARCHAR(255) | External calendar ID |
| `metadata` | JSONB | Attendees, URL, etc. |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

#### calendar_shares

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `calendar_id` | UUID | FK to calendars |
| `shared_with_user_id` | UUID | Target user (optional) |
| `shared_with_email` | VARCHAR(255) | Email for invite |
| `permission` | VARCHAR(20) | read/write/admin |
| `share_token` | VARCHAR(64) | For link sharing |
| `share_url` | VARCHAR(500) | Public share URL |
| `status` | VARCHAR(20) | pending/accepted/declined |
| `invited_by` | UUID | Inviter user ID |
| `accepted_at` | TIMESTAMP | Accept timestamp |
| `expires_at` | TIMESTAMP | Expiration date |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

#### reminders

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | FK to events |
| `user_id` | UUID | Owner |
| `minutes_before` | INTEGER | Reminder offset |
| `reminder_time` | TIMESTAMP | Calculated time |
| `notify_push` | BOOLEAN | Push notification |
| `notify_email` | BOOLEAN | Email notification |
| `status` | VARCHAR(20) | pending/sent/failed |
| `sent_at` | TIMESTAMP | Send timestamp |
| `event_instance_date` | TIMESTAMP | For recurring events |
| `created_at` | TIMESTAMP | Creation time |

#### external_calendars

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | VARCHAR(255) | Display name |
| `provider` | VARCHAR(50) | google/apple/caldav/ical_url |
| `calendar_url` | TEXT | CalDAV or iCal URL |
| `username` | VARCHAR(255) | CalDAV username |
| `encrypted_password` | TEXT | Encrypted password |
| `access_token` | TEXT | OAuth token |
| `refresh_token` | TEXT | OAuth refresh token |
| `token_expires_at` | TIMESTAMP | Token expiration |
| `sync_enabled` | BOOLEAN | Sync toggle |
| `sync_direction` | VARCHAR(20) | both/import/export |
| `sync_interval` | INTEGER | Minutes between syncs |
| `last_sync_at` | TIMESTAMP | Last sync time |
| `last_sync_error` | TEXT | Error message |
| `color` | VARCHAR(7) | Display color |
| `is_visible` | BOOLEAN | Visibility in UI |
| `provider_data` | JSONB | Provider-specific data |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

### Recurrence (RFC 5545 RRULE)

Beispiele für wiederkehrende Termine:

```
FREQ=DAILY                           # Täglich
FREQ=WEEKLY;BYDAY=MO,WE,FR           # Mo, Mi, Fr
FREQ=WEEKLY;INTERVAL=2;BYDAY=TU      # Jeden 2. Dienstag
FREQ=MONTHLY;BYMONTHDAY=15           # Am 15. jeden Monats
FREQ=MONTHLY;BYDAY=2MO               # Am 2. Montag jeden Monats
FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25 # Jährlich am 25.12.
FREQ=DAILY;COUNT=10                  # Täglich, 10 mal
FREQ=WEEKLY;UNTIL=20241231T235959Z   # Wöchentlich bis Ende 2024
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3014
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/calendar
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5179,http://localhost:8081

# Notifications (optional)
EXPO_ACCESS_TOKEN=your-expo-access-token
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=calendar@mana.how
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3014
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

### Mobile (.env)

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3014
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Packages

### @calendar/shared

**Types:**
- `Calendar` - Kalender-Entity
- `CalendarSettings` - Kalender-Einstellungen (JSONB)
- `CalendarViewType` - 'day' | 'week' | 'month' | 'year' | 'agenda'
- `Event` - Termin-Entity
- `EventStatus` - 'confirmed' | 'tentative' | 'cancelled'
- `Reminder` - Erinnerung-Entity
- `ReminderStatus` - 'pending' | 'sent' | 'failed'
- `CalendarShare` - Freigabe-Entity
- `SharePermission` - 'read' | 'write' | 'admin'
- `ExternalCalendar` - Externe Kalender-Entity

**Constants:**
- `DEFAULT_CALENDAR_COLORS` - 8 vordefinierte Farben
- `DEFAULT_TIMEZONES` - Häufige Zeitzonen

## Code Style Guidelines

- **TypeScript**: Strict typing mit Interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS mit CSS-Variablen
- **Formatting**: Prettier mit Projekt-Config
- **i18n**: Alle UI-Texte in Locale-Dateien

### Svelte 5 Runes Beispiel

```svelte
<script lang="ts">
  import { viewStore } from '$lib/stores/view.svelte';

  // Reaktiver State
  let loading = $state(false);

  // Abgeleiteter Wert
  let formattedDate = $derived(
    format(viewStore.currentDate, 'MMMM yyyy', { locale: de })
  );

  // Side Effect
  $effect(() => {
    console.log('Date changed:', viewStore.currentDate);
  });
</script>
```

## Quick Start

### 1. Datenbank erstellen

```bash
# PostgreSQL Container muss laufen
docker compose -f docker-compose.dev.yml up -d postgres

# Datenbank erstellen
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE calendar;"

# Schema pushen
pnpm calendar:db:push
```

### 2. Apps starten

```bash
# Backend + Web zusammen
pnpm dev:calendar:app

# Oder einzeln:
pnpm dev:calendar:backend  # Terminal 1
pnpm dev:calendar:web      # Terminal 2
pnpm dev:calendar:landing  # Terminal 3 (optional)
```

### 3. URLs öffnen

- Web App: http://localhost:5179
- Landing: http://localhost:4322
- API Health: http://localhost:3014/api/v1/health

## Testing API (mit curl)

```bash
# Health Check
curl http://localhost:3014/api/v1/health

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Kalender abrufen
curl http://localhost:3014/api/v1/calendars \
  -H "Authorization: Bearer $TOKEN"

# Neuen Kalender erstellen
curl -X POST http://localhost:3014/api/v1/calendars \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Arbeit", "color": "#3B82F6"}'

# Termine abrufen (Datumsbereich)
curl "http://localhost:3014/api/v1/events?start=2024-12-01&end=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Neuen Termin erstellen
curl -X POST http://localhost:3014/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarId": "calendar-uuid",
    "title": "Meeting",
    "startTime": "2024-12-15T10:00:00Z",
    "endTime": "2024-12-15T11:00:00Z"
  }'
```

## Production Readiness

**Status: Production-Ready (2026-03-24)**

### Checklist

| Category | Status | Details |
|----------|--------|---------|
| **Error Handling** | ✅ | Global `+error.svelte` with i18n (5 languages), error tracking via GlitchTip |
| **Offline Support** | ✅ | Offline page with shared `OfflinePage` component |
| **PWA** | ✅ | Service worker, manifest, icons, apple-touch-icon, shortcuts |
| **Security Headers** | ✅ | CSP, X-Frame-Options, HSTS via `setSecurityHeaders()` |
| **Loading States** | ✅ | Skeleton loaders: CalendarView, EventDetail, Agenda, AppLoading |
| **i18n** | ✅ | 5 languages (DE/EN/FR/ES/IT), all pages including settings fully localized |
| **Meta/SEO** | ✅ | OG tags, meta description in root layout |
| **Accessibility** | ✅ | Focus trapping in all modals, ARIA roles, keyboard navigation |
| **Rate Limiting** | ✅ | ThrottlerGuard global (100 req/min) |
| **API Validation** | ✅ | DTOs with class-validator, whitelist + forbidNonWhitelisted |
| **Auth** | ✅ | JWT via mana-core-auth, guards on all controllers |
| **Toast System** | ✅ | All toast messages localized via svelte-i18n |
| **Docker** | ✅ | Multi-stage build, health checks, entrypoint script |
| **Tests** | ✅ | 13 unit tests, 7 E2E test suites (Playwright) |
| **Error Tracking** | ✅ | GlitchTip integration (client + server) |
| **Metrics** | ✅ | Prometheus via MetricsModule |
| **Context Menu** | ✅ | Shared ContextMenu on WeekView + AgendaView events |

### E2E Test Suites

```bash
pnpm --filter @calendar/web test:e2e
```

| Suite | Coverage |
|-------|----------|
| `auth.spec.ts` | Login, redirect, invalid credentials |
| `calendar-views.spec.ts` | Week/month/agenda views, navigation |
| `events.spec.ts` | Event CRUD |
| `calendars.spec.ts` | Calendar management |
| `settings.spec.ts` | Settings page |
| `week-view-interactions.spec.ts` | Drag-to-create, time indicator |
| `error-page.spec.ts` | 404 error page |

## Roadmap / TODO

- [ ] Mobile App (Expo)
- [ ] Year View
- [ ] CalDAV Sync Implementation
- [ ] Push Notifications
- [ ] E-Mail Reminders
- [ ] Event Attendees
- [ ] Calendar Import/Export
- [ ] Dark/Light Theme in Landing

## Important Notes

1. **Authentication**: Nutzt Mana Core Auth (JWT im Authorization Header)
2. **Database**: PostgreSQL mit Drizzle ORM (Port 5432)
3. **Port**: Backend läuft auf Port 3014
4. **Recurrence**: Verwendet RFC 5545 RRULE Format
5. **i18n**: 5 Sprachen unterstützt (DE, EN, FR, ES, IT)
6. **Theme**: Ocean-Theme (Blautöne) als Standard
