# Clock Project Guide

## Übersicht

**Clock** ist eine vollständige Uhren-App mit Weltzeituhr, Wecker, Timer, Stoppuhr und Pomodoro. Die App synchronisiert Wecker und Timer zwischen Geräten über ein Backend.

| App | Port | URL |
|-----|------|-----|
| Backend | 3017 | http://localhost:3017 |
| Web App | 5186 | http://localhost:5186 |
| Landing Page | 4323 | http://localhost:4323 |

## Project Structure

```
apps/clock/
├── apps/
│   ├── backend/          # NestJS API server (@clock/backend)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/
│   │       │   ├── database.module.ts
│   │       │   ├── connection.ts
│   │       │   ├── schema/
│   │       │   │   ├── alarms.schema.ts
│   │       │   │   ├── timers.schema.ts
│   │       │   │   ├── world-clocks.schema.ts
│   │       │   │   └── presets.schema.ts
│   │       │   └── seed.ts
│   │       ├── alarm/
│   │       ├── timer/
│   │       ├── world-clock/
│   │       ├── preset/
│   │       └── health/
│   │
│   ├── web/              # SvelteKit web app (@clock/web)
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api/
│   │       │   ├── stores/
│   │       │   ├── components/
│   │       │   └── i18n/
│   │       └── routes/
│   │           ├── +layout.svelte
│   │           ├── +page.svelte          # Dashboard
│   │           ├── alarms/
│   │           ├── timers/
│   │           ├── stopwatch/
│   │           ├── pomodoro/
│   │           ├── world-clock/
│   │           ├── settings/
│   │           ├── feedback/
│   │           └── (auth)/
│   │
│   └── landing/          # Astro landing page (@clock/landing)
│
├── packages/
│   └── shared/           # Shared types & constants (@clock/shared)
│
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# Alle Apps starten
pnpm clock:dev                    # Run all clock apps

# Einzelne Apps starten
pnpm dev:clock:backend            # Start backend server (port 3017)
pnpm dev:clock:web                # Start web app (port 5186)
pnpm dev:clock:landing            # Start landing page (port 4323)
pnpm dev:clock:app                # Start web + backend together

# Datenbank
pnpm clock:db:push                # Push schema to database
pnpm clock:db:studio              # Open Drizzle Studio
pnpm clock:db:seed                # Seed initial data

# Deploy
pnpm deploy:landing:clock         # Deploy landing to Cloudflare Pages
```

### Backend (apps/clock/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
pnpm db:seed                     # Seed initial data
```

### Web App (apps/clock/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/clock/apps/landing)

```bash
pnpm dev                         # Start dev server (port 4323)
pnpm build                       # Build for production
pnpm preview                     # Preview build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes), Tailwind CSS 4 |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |
| **i18n** | svelte-i18n (DE, EN, FR, ES, IT) |

## Features

### 1. Weltzeituhr
- Zeitzonen-Übersicht mit mehreren Städten
- Zeitdifferenz zum lokalen Standort
- Tag/Nacht-Indikator
- Drag & Drop Sortierung

### 2. Wecker
- Erstelle/Bearbeite/Lösche Wecker
- Wiederholende Wecker (Wochentage wählen)
- Snooze-Funktion (konfigurierbar)
- Verschiedene Alarm-Sounds
- Cross-Device Sync

### 3. Timer
- Multiple Timer gleichzeitig
- Timer-Presets (Quick Select)
- Cross-Device Sync für aktive Timer
- Start/Pause/Reset Kontrollen

### 4. Stoppuhr
- Präzise Zeitmessung
- Rundenzeiten mit Best/Worst Markierung
- Lokal-only (kein Sync nötig)

### 5. Pomodoro
- Arbeit/Pause Zyklen
- Anpassbare Intervalle
- Preset-Auswahl (Klassisch, Kurzer Fokus, Tiefe Arbeit)
- Push-Benachrichtigungen

## API Endpoints

### Health
```
GET    /api/v1/health              # Health check
```

### Alarms
```
GET    /api/v1/alarms              # List all alarms
POST   /api/v1/alarms              # Create alarm
GET    /api/v1/alarms/:id          # Get alarm
PUT    /api/v1/alarms/:id          # Update alarm
DELETE /api/v1/alarms/:id          # Delete alarm
PATCH  /api/v1/alarms/:id/toggle   # Toggle enabled
```

### Timers
```
GET    /api/v1/timers              # List all timers
POST   /api/v1/timers              # Create timer
GET    /api/v1/timers/:id          # Get timer
PUT    /api/v1/timers/:id          # Update timer
DELETE /api/v1/timers/:id          # Delete timer
POST   /api/v1/timers/:id/start    # Start timer
POST   /api/v1/timers/:id/pause    # Pause timer
POST   /api/v1/timers/:id/reset    # Reset timer
```

### World Clocks
```
GET    /api/v1/world-clocks        # List world clocks
POST   /api/v1/world-clocks        # Add city
DELETE /api/v1/world-clocks/:id    # Remove city
PUT    /api/v1/world-clocks/reorder # Reorder cities
GET    /api/v1/timezones/search    # Search timezones
```

### Presets
```
GET    /api/v1/presets             # List presets
POST   /api/v1/presets             # Create preset
PUT    /api/v1/presets/:id         # Update preset
DELETE /api/v1/presets/:id         # Delete preset
```

## Database Schema

### alarms
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `label` | VARCHAR(255) | Alarm name |
| `time` | TIME | Alarm time (HH:MM:SS) |
| `enabled` | BOOLEAN | Active flag |
| `repeat_days` | INT[] | [0-6] für Wochentage |
| `snooze_minutes` | INTEGER | Snooze duration |
| `sound` | VARCHAR(100) | Sound identifier |
| `vibrate` | BOOLEAN | Vibration enabled |

### timers
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `label` | VARCHAR(255) | Timer name |
| `duration_seconds` | INTEGER | Total duration |
| `remaining_seconds` | INTEGER | Time left |
| `status` | VARCHAR(20) | idle/running/paused/finished |
| `sound` | VARCHAR(100) | Sound identifier |

### world_clocks
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `timezone` | VARCHAR(100) | IANA timezone |
| `city_name` | VARCHAR(255) | Display name |
| `sort_order` | INTEGER | Display order |

### presets
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `type` | VARCHAR(20) | timer/pomodoro |
| `name` | VARCHAR(255) | Preset name |
| `duration_seconds` | INTEGER | Duration |
| `settings` | JSONB | Type-specific settings |

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3017
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/clock
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5186,http://localhost:8081
DEV_BYPASS_AUTH=true
DEV_USER_ID=your-test-user-id
```

### Web (.env)
```env
PUBLIC_BACKEND_URL=http://localhost:3017
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Web App Stores (Svelte 5 Runes)

```typescript
// auth.svelte.ts - Authentication
authStore.isAuthenticated
authStore.user
authStore.signIn(email, password)
authStore.signOut()
authStore.getAccessToken()

// alarms.svelte.ts - Alarms
alarmsStore.alarms
alarmsStore.nextAlarm
alarmsStore.fetchAlarms()
alarmsStore.createAlarm(input)
alarmsStore.toggleAlarm(id)

// timers.svelte.ts - Timers
timersStore.timers
timersStore.activeTimers
timersStore.startTimer(id)
timersStore.pauseTimer(id)
timersStore.resetTimer(id)

// stopwatch.svelte.ts - Stopwatch (local only)
stopwatchStore.isRunning
stopwatchStore.elapsedTime
stopwatchStore.laps
stopwatchStore.start()
stopwatchStore.lap()
stopwatchStore.reset()

// pomodoro.svelte.ts - Pomodoro (local only)
pomodoroStore.phase
pomodoroStore.remainingTime
pomodoroStore.completedSessions
pomodoroStore.start()
pomodoroStore.skip()
pomodoroStore.loadPreset(preset)

// world-clocks.svelte.ts - World Clocks
worldClocksStore.worldClocks
worldClocksStore.addWorldClock(input)
worldClocksStore.removeWorldClock(id)
worldClocksStore.reorderWorldClocks(ids)
```

## Quick Start

### 1. Datenbank erstellen

```bash
# PostgreSQL Container muss laufen
docker compose -f docker-compose.dev.yml up -d postgres

# Datenbank erstellen
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE clock;"

# Schema pushen
pnpm clock:db:push
```

### 2. Apps starten

```bash
# Backend + Web zusammen
pnpm dev:clock:app

# Oder einzeln:
pnpm dev:clock:backend  # Terminal 1
pnpm dev:clock:web      # Terminal 2
pnpm dev:clock:landing  # Terminal 3 (optional)
```

### 3. URLs öffnen

- Web App: http://localhost:5186
- Landing: http://localhost:4323
- API Health: http://localhost:3017/api/v1/health

## Testing API (mit curl)

```bash
# Health Check
curl http://localhost:3017/api/v1/health

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Wecker abrufen
curl http://localhost:3017/api/v1/alarms \
  -H "Authorization: Bearer $TOKEN"

# Neuen Wecker erstellen
curl -X POST http://localhost:3017/api/v1/alarms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"time": "07:00:00", "label": "Aufwachen"}'

# Timer erstellen und starten
TIMER_ID=$(curl -s -X POST http://localhost:3017/api/v1/timers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"durationSeconds": 300, "label": "5 Minuten"}' | jq -r '.id')

curl -X POST http://localhost:3017/api/v1/timers/$TIMER_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

## Important Notes

1. **Authentication**: Nutzt Mana Core Auth (JWT im Authorization Header)
2. **Database**: PostgreSQL mit Drizzle ORM (Port 5432)
3. **Port**: Backend läuft auf Port 3017, Web auf 5186, Landing auf 4323
4. **i18n**: 5 Sprachen unterstützt (DE, EN, FR, ES, IT)
5. **Theme**: Amber/Orange (#f59e0b) als Primärfarbe
6. **Local Features**: Stoppuhr und Pomodoro laufen lokal ohne Backend-Sync
