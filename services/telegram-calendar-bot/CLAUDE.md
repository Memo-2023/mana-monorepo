# Telegram Calendar Bot

Telegram Bot für die Calendar-App mit Termin-Abfragen, Quick-Add und Erinnerungen.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **Scheduling**: @nestjs/schedule
- **Date Handling**: date-fns, date-fns-tz

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## Telegram Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe & Account verknüpfen |
| `/help` | Verfügbare Befehle anzeigen |
| `/today` | Heutige Termine |
| `/tomorrow` | Morgige Termine |
| `/week` | Wochenübersicht |
| `/next [n]` | Nächste n Termine (default: 5) |
| `/add [text]` | Termin hinzufügen |
| `/calendars` | Kalender-Übersicht |
| `/remind` | Erinnerungseinstellungen |
| `/status` | Verbindungsstatus prüfen |
| `/link` | ManaCore Account verknüpfen |
| `/unlink` | Account-Verknüpfung trennen |

## Environment Variables

```env
# Server
PORT=3303
NODE_ENV=development
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token from @BotFather
TELEGRAM_ALLOWED_USERS=123,456      # Optional: Comma-separated user IDs

# Calendar Backend API
CALENDAR_API_URL=http://localhost:3016
MANA_CORE_AUTH_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/calendar_bot

# Reminder Settings
REMINDER_CHECK_INTERVAL=60000       # Check every minute (ms)
MORNING_BRIEFING_ENABLED=true
MORNING_BRIEFING_TIME=07:00
MORNING_BRIEFING_TIMEZONE=Europe/Berlin
```

## Projekt-Struktur

```
services/telegram-calendar-bot/
├── src/
│   ├── main.ts                     # Entry point
│   ├── app.module.ts               # Root module
│   ├── health.controller.ts        # Health endpoint
│   ├── config/
│   │   └── configuration.ts        # Config & commands
│   ├── database/
│   │   ├── database.module.ts      # Drizzle connection
│   │   └── schema.ts               # DB schema
│   ├── bot/
│   │   ├── bot.module.ts
│   │   ├── bot.update.ts           # Command handlers
│   │   └── formatters.ts           # Message formatters
│   ├── calendar/
│   │   ├── calendar.module.ts
│   │   └── calendar.client.ts      # Calendar API client
│   ├── user/
│   │   ├── user.module.ts
│   │   └── user.service.ts         # User management
│   └── reminder/
│       ├── reminder.module.ts
│       ├── reminder.service.ts     # Sent reminders tracking
│       └── reminder.scheduler.ts   # Cron jobs
├── drizzle/                        # Migrations
├── drizzle.config.ts
├── package.json
└── Dockerfile
```

## Datenbank-Schema

### telegram_users

Verknüpfung zwischen Telegram und ManaCore Accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `telegram_user_id` | BIGINT | Telegram user ID (unique) |
| `telegram_username` | TEXT | Telegram username |
| `telegram_first_name` | TEXT | Telegram first name |
| `mana_user_id` | TEXT | ManaCore user ID |
| `access_token` | TEXT | JWT access token |
| `refresh_token` | TEXT | JWT refresh token |
| `token_expires_at` | TIMESTAMP | Token expiration |
| `settings` | JSONB | User settings |
| `is_active` | BOOLEAN | Active status |
| `linked_at` | TIMESTAMP | Link timestamp |
| `last_active_at` | TIMESTAMP | Last activity |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

### reminder_settings

User-spezifische Erinnerungseinstellungen.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `telegram_user_id` | BIGINT | FK to telegram_users |
| `default_reminder_minutes` | INTEGER | Default reminder time (15) |
| `morning_briefing_enabled` | BOOLEAN | Enable daily briefing |
| `morning_briefing_time` | TIME | Briefing time (07:00) |
| `timezone` | TEXT | User timezone |
| `notify_event_reminders` | BOOLEAN | Enable reminders |
| `notify_event_changes` | BOOLEAN | Enable change notifications |
| `notify_shared_calendars` | BOOLEAN | Enable share notifications |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

### sent_reminders

Log of sent reminders to avoid duplicates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `telegram_user_id` | BIGINT | FK to telegram_users |
| `event_id` | TEXT | Calendar event ID |
| `event_instance_date` | TIMESTAMP | For recurring events |
| `reminder_type` | TEXT | 'before_event' or 'morning_briefing' |
| `minutes_before` | INTEGER | Minutes before event |
| `sent_at` | TIMESTAMP | Send timestamp |
| `message_id` | INTEGER | Telegram message ID |

## Lokale Entwicklung

### 1. Bot bei Telegram erstellen

1. Öffne @BotFather in Telegram
2. Sende `/newbot`
3. Wähle einen Namen (z.B. "ManaCore Calendar")
4. Wähle einen Username (z.B. "manacore_calendar_bot")
5. Kopiere den Token

### 2. Umgebung vorbereiten

```bash
# Docker Services starten (PostgreSQL)
pnpm docker:up

# Datenbank erstellen
psql -h localhost -U manacore -d postgres -c "CREATE DATABASE calendar_bot;"

# In das Service-Verzeichnis wechseln
cd services/telegram-calendar-bot

# .env erstellen
cp .env.example .env
# Token und URLs eintragen

# Schema pushen
pnpm db:push
```

### 3. Bot starten

```bash
pnpm start:dev
```

### 4. Calendar Backend starten

Der Bot benötigt das Calendar Backend:

```bash
# In einem anderen Terminal
pnpm dev:calendar:backend
```

## Features

### Termin-Abfragen

- **Heute/Morgen/Woche**: Schnellübersicht der anstehenden Termine
- **Nächste N**: Flexible Anzahl der nächsten Termine
- **Kalender-Filter**: Termine nach Kalender filtern (TODO)

### Erinnerungen

- **Event-Reminder**: X Minuten vor einem Termin
- **Morgen-Briefing**: Tägliche Zusammenfassung am Morgen
- **Konfigurierbar**: Pro User anpassbar

### Account-Verknüpfung

- Telegram-User wird mit ManaCore-Account verknüpft
- JWT-Token wird gespeichert für API-Zugriffe
- Automatische Token-Refresh (TODO)

## Scheduled Jobs

| Job | Schedule | Beschreibung |
|-----|----------|--------------|
| `checkReminders` | Jede Minute | Prüft anstehende Events und sendet Erinnerungen |
| `sendMorningBriefings` | Jede Stunde | Sendet Morgen-Briefing zur konfigurierten Zeit |
| `cleanupOldReminders` | Täglich 03:00 | Löscht alte sent_reminders Einträge |

## Health Check

```bash
curl http://localhost:3303/health
```

Antwort:
```json
{
  "status": "ok",
  "service": "telegram-calendar-bot",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "environment": "development"
}
```

## Deployment

### Docker

```yaml
# docker-compose.yml
telegram-calendar-bot:
  build:
    context: .
    dockerfile: services/telegram-calendar-bot/Dockerfile
  restart: always
  environment:
    PORT: 3303
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_CALENDAR_BOT_TOKEN}
    CALENDAR_API_URL: http://calendar-backend:3016
    DATABASE_URL: ${CALENDAR_BOT_DATABASE_URL}
  ports:
    - "3303:3303"
```

### Nativ

```bash
cd services/telegram-calendar-bot
pnpm install
pnpm build
pnpm start:prod
```

## Roadmap

- [ ] NLP für natürliche Spracheingabe ("/add Meeting morgen 14 Uhr")
- [ ] OAuth-Flow für Account-Verknüpfung
- [ ] Token-Refresh Mechanismus
- [ ] Inline Keyboards für Interaktionen
- [ ] Kalender-Filter bei Abfragen
- [ ] Event-Erstellung mit allen Feldern
- [ ] Recurring Event Support
- [ ] Telegram Mini App Integration
