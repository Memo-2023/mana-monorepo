# Telegram Contacts Bot

Telegram Bot für die Contacts-App mit Kontaktsuche, Quick-Add und Geburtstags-Erinnerungen.

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
| `/search [Name]` | Kontakt suchen |
| `/favorites` | Favoriten-Kontakte |
| `/recent` | Zuletzt hinzugefügt |
| `/birthdays` | Anstehende Geburtstage |
| `/tags` | Alle Tags anzeigen |
| `/tag [Name]` | Kontakte mit Tag |
| `/stats` | Kontakt-Statistiken |
| `/add [Name]` | Neuen Kontakt hinzufügen |
| `/status` | Verbindungsstatus |
| `/link` | ManaCore Account verknüpfen |
| `/unlink` | Verknüpfung trennen |

## Environment Variables

```env
# Server
PORT=3304
NODE_ENV=development
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token from @BotFather
TELEGRAM_ALLOWED_USERS=123,456      # Optional: Comma-separated user IDs

# Contacts Backend API
CONTACTS_API_URL=http://localhost:3015
MANA_CORE_AUTH_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/contacts_bot

# Birthday Reminder Settings
BIRTHDAY_CHECK_ENABLED=true
BIRTHDAY_CHECK_TIME=08:00
BIRTHDAY_CHECK_TIMEZONE=Europe/Berlin
BIRTHDAY_DAYS_AHEAD=7
```

## Projekt-Struktur

```
services/telegram-contacts-bot/
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
│   ├── contacts/
│   │   ├── contacts.module.ts
│   │   └── contacts.client.ts      # Contacts API client
│   └── user/
│       ├── user.module.ts
│       └── user.service.ts         # User management
├── drizzle/                        # Migrations
├── drizzle.config.ts
├── package.json
└── Dockerfile
```

## Features

### Kontakt-Suche
- Suche nach Name, Email, Telefon, Firma
- Einfach Text senden = automatische Suche
- Detailansicht bei einzelnem Treffer

### Favoriten & Tags
- Favoriten-Kontakte schnell abrufen
- Nach Tags filtern
- Alle Tags auflisten

### Geburtstage
- Anstehende Geburtstage anzeigen
- Konfigurierbare Vorlaufzeit
- Alter wird berechnet

### Quick-Add
- Schnell neuen Kontakt erstellen
- Automatische Erkennung von Name/Telefon/Email
- Beispiel: `/add Max Mustermann 0171-1234567`

### Statistiken
- Gesamtzahl Kontakte
- Favoriten-Anzahl
- Kontakte mit Geburtstag
- Anzahl Tags

## API Endpoints (Contacts Backend)

Der Bot kommuniziert mit dem Contacts Backend:

| Endpoint | Verwendung |
|----------|------------|
| `GET /api/v1/contacts?search=` | Kontaktsuche |
| `GET /api/v1/contacts?favorite=true` | Favoriten |
| `GET /api/v1/contacts` | Alle Kontakte |
| `GET /api/v1/contacts/:id` | Kontakt-Details |
| `POST /api/v1/contacts` | Kontakt erstellen |
| `GET /api/v1/tags` | Alle Tags |

## Health Check

```bash
curl http://localhost:3304/health
```

## Lokale Entwicklung

```bash
# Docker starten (PostgreSQL)
pnpm docker:up

# Datenbank erstellen
psql -h localhost -U manacore -c "CREATE DATABASE contacts_bot;"

# In Bot-Verzeichnis
cd services/telegram-contacts-bot

# .env erstellen
cp .env.example .env
# Token eintragen

# Schema pushen
pnpm db:push

# Bot starten
pnpm start:dev
```

## Deployment

### Docker

```yaml
telegram-contacts-bot:
  build:
    context: .
    dockerfile: services/telegram-contacts-bot/Dockerfile
  restart: always
  environment:
    PORT: 3304
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_CONTACTS_BOT_TOKEN}
    CONTACTS_API_URL: http://contacts-backend:3015
    DATABASE_URL: ${CONTACTS_BOT_DATABASE_URL}
  ports:
    - "3304:3304"
```

### macOS (launchd)

```bash
# Service-Datei unter ~/Library/LaunchAgents/com.manacore.telegram-contacts-bot.plist
launchctl load ~/Library/LaunchAgents/com.manacore.telegram-contacts-bot.plist
```

## Roadmap

- [ ] Geburtstags-Erinnerungen via Scheduler
- [ ] Kontakt bearbeiten via Telegram
- [ ] Notizen zu Kontakt hinzufügen
- [ ] Aktivitäten loggen (Anruf, Meeting, etc.)
- [ ] vCard Export
- [ ] Inline Keyboards für Interaktionen
