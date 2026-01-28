# Telegram Zitare Bot

Telegram Bot fuer Zitare - deutsche Inspirationszitate.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **Scheduler**: @nestjs/schedule

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
| `/quote` | Zufaelliges Zitat |
| `/zitat` | Alias fuer /quote |
| `/search [Begriff]` | Zitate suchen |
| `/author [Name]` | Zitate eines Autors |
| `/favorite` | Aktuelles Zitat speichern |
| `/favorites` | Favoriten anzeigen |
| `/removefav [Nr]` | Favorit entfernen |
| `/daily` | Taegliches Zitat an/aus |

## User Flow

```
1. /start                        → Willkommen
2. /quote                        → Zufaelliges Zitat
3. /favorite                     → Zitat zu Favoriten
4. /favorites                    → Liste der Favoriten
5. /daily                        → Taegliches Zitat aktivieren
```

## Environment Variables

```env
# Server
PORT=3303

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/zitare_bot
```

## Projekt-Struktur

```
services/telegram-zitare-bot/
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── health.controller.ts      # Health endpoint
│   ├── config/
│   │   └── configuration.ts      # Config
│   ├── database/
│   │   ├── database.module.ts    # Drizzle connection
│   │   └── schema.ts             # DB schema
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── quotes/
│   │   ├── quotes.module.ts
│   │   ├── quotes.service.ts     # Zitat-Logik
│   │   ├── types.ts              # TypeScript Interfaces
│   │   └── data/
│   │       ├── quotes.json       # Deutsche Zitate
│   │       └── authors.json      # Autoren
│   ├── user/
│   │   ├── user.module.ts
│   │   └── user.service.ts       # Favoriten, Daily
│   └── scheduler/
│       ├── scheduler.module.ts
│       └── daily.scheduler.ts    # Cron fuer 08:00 Uhr
├── drizzle/                      # Migrations
├── drizzle.config.ts
├── package.json
└── .env.example
```

## Lokale Entwicklung

### 1. Bot bei Telegram erstellen

1. Oeffne @BotFather in Telegram
2. Sende `/newbot`
3. Waehle einen Namen (z.B. "Zitare Bot")
4. Waehle einen Username (z.B. "zitare_inspiration_bot")
5. Kopiere den Token

### 2. Umgebung vorbereiten

```bash
# Docker Services starten (PostgreSQL)
pnpm docker:up

# Datenbank erstellen und Schema pushen
pnpm dev:zitare-bot:full
```

### 3. Bot starten

```bash
# Nur Bot starten (DB muss existieren)
pnpm dev:zitare-bot
```

## Features

- **Zitat-Suche**: Nach Begriff oder Autor suchen
- **Favoriten**: Lieblingszitate speichern
- **Taegliches Zitat**: Automatisch um 08:00 Uhr
- **40+ deutsche Zitate**: Von Einstein bis Goethe

## Datenbank-Schema

```
telegram_users
├── id (UUID)
├── telegram_user_id (BIGINT, unique)
├── telegram_username (TEXT)
├── daily_enabled (BOOLEAN)
├── daily_time (TEXT, default '08:00')
├── timezone (TEXT, default 'Europe/Berlin')
├── created_at, updated_at

user_favorites
├── id (UUID)
├── telegram_user_id (BIGINT)
├── quote_id (TEXT)
├── created_at
├── UNIQUE(telegram_user_id, quote_id)
```

## Health Check

```bash
curl http://localhost:3303/health
```
