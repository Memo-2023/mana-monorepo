# Telegram Todo Bot

Telegram Bot fuer Todo - Aufgabenverwaltung via Telegram.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **Scheduler**: @nestjs/schedule
- **API Client**: Calls Todo Backend (localhost:3018)

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
| `/start` | Willkommensnachricht |
| `/help` | Hilfe anzeigen |
| `/login` | Account verknuepfen |
| `/logout` | Account trennen |
| `/add [Text]` | Neue Aufgabe erstellen |
| `/inbox` | Inbox-Aufgaben anzeigen |
| `/today` | Heutige Aufgaben |
| `/list` | Alle offenen Aufgaben |
| `/done [Nr]` | Aufgabe als erledigt markieren |
| `/projects` | Projekte anzeigen |
| `/remind` | Taegliche Erinnerung an/aus |

## User Flow

```
1. /start                        → Willkommen
2. /login                        → Email eingeben
3. [Email eingeben]              → Passwort eingeben
4. [Passwort eingeben]           → Account verknuepft
5. /today                        → Heutige Aufgaben
6. /add Einkaufen                → Aufgabe erstellt
7. /done 1                       → Aufgabe erledigt
8. /remind                       → Taegliche Erinnerung aktivieren
```

## Architecture

Der Bot verwendet einen **API-Client Ansatz**:
- Bot hat eigene DB fuer Telegram User ↔ Todo User Mapping
- Ruft Todo Backend REST API auf fuer Task-Operationen
- Kein direkter DB-Zugriff auf Todo-Datenbank

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram  │────>│  Todo Bot       │────>│  Todo Backend   │
│   User      │     │  (port 3304)    │     │  (port 3018)    │
└─────────────┘     └─────────────────┘     └─────────────────┘
                           │                        │
                           │ Bot DB (user mapping)  │ Todo DB (tasks)
                           ▼                        ▼
                    ┌─────────────┐          ┌─────────────┐
                    │  todo_bot   │          │    todo     │
                    │  (PG DB)    │          │   (PG DB)   │
                    └─────────────┘          └─────────────┘
```

## Environment Variables

```env
# Server
PORT=3304

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather

# Database (Bot's own database)
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/todo_bot

# Todo Backend API
TODO_API_URL=http://localhost:3018

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Projekt-Struktur

```
services/telegram-todo-bot/
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── health.controller.ts      # Health endpoint
│   ├── config/
│   │   └── configuration.ts      # Config
│   ├── database/
│   │   ├── database.module.ts    # Drizzle connection
│   │   └── schema.ts             # DB schema (user mapping)
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── todo-client/
│   │   ├── todo-client.module.ts
│   │   ├── todo-client.service.ts # Todo API wrapper
│   │   └── types.ts              # TypeScript interfaces
│   ├── user/
│   │   ├── user.module.ts
│   │   └── user.service.ts       # Account linking, settings
│   └── scheduler/
│       ├── scheduler.module.ts
│       └── reminder.scheduler.ts # Cron fuer 08:00 Uhr
├── drizzle/                      # Migrations
├── drizzle.config.ts
├── package.json
└── .env.example
```

## Lokale Entwicklung

### 1. Bot bei Telegram erstellen

1. Oeffne @BotFather in Telegram
2. Sende `/newbot`
3. Waehle einen Namen (z.B. "Todo Bot")
4. Waehle einen Username (z.B. "mana_todo_bot")
5. Kopiere den Token

### 2. Umgebung vorbereiten

```bash
# Docker Services starten (PostgreSQL)
pnpm docker:up

# Datenbank erstellen und Schema pushen
pnpm dev:todo-bot:full
```

### 3. Bot starten

```bash
# Nur Bot starten (DB muss existieren)
pnpm dev:todo-bot
```

## Features

- **Account-Verknuepfung**: Login via Email/Passwort
- **Aufgaben erstellen**: Schnell neue Aufgaben anlegen
- **Aufgaben anzeigen**: Inbox, Today, alle offenen
- **Aufgaben erledigen**: Per Nummer abhaken
- **Projekte**: Projektliste anzeigen
- **Taegliche Erinnerung**: Automatisch um 08:00 Uhr

## Datenbank-Schema

```
telegram_users
├── id (UUID)
├── telegram_user_id (BIGINT, unique)
├── telegram_username (TEXT)
├── mana_user_id (TEXT)              # Verknuepfter Todo-User
├── access_token (TEXT)              # JWT fuer API-Calls
├── refresh_token (TEXT)
├── token_expires_at (TIMESTAMP)
├── daily_reminder_enabled (BOOLEAN)
├── daily_reminder_time (TEXT, default '08:00')
├── timezone (TEXT, default 'Europe/Berlin')
├── created_at, updated_at
```

## Health Check

```bash
curl http://localhost:3304/health
```

## MVP Features (Phase 1)

- `/start`, `/help`
- `/login`, `/logout` - Account-Verknuepfung
- `/add [text]` - Aufgabe in Inbox erstellen
- `/today` - Heutige Aufgaben
- `/inbox` - Inbox-Aufgaben
- `/list` - Alle offenen Aufgaben
- `/done [Nr]` - Abhaken
- `/projects` - Projektliste
- `/remind` - Taegliche Erinnerung

## Spaetere Features (Phase 2)

- `/add @projekt [text]` - Aufgabe in Projekt
- `/due [Nr] [Datum]` - Faelligkeitsdatum setzen
- `/priority [Nr] [hoch/mittel/niedrig]`
- Inline-Buttons fuer schnelle Aktionen
- OAuth-basiertes Login (statt Email/Passwort)
