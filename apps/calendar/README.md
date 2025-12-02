# Kalender

> Smart Calendar Management - Organisiere deine Zeit intelligent

Eine vollständige Kalender-Anwendung mit persönlichen und geteilten Kalendern, wiederkehrenden Terminen, CalDAV/iCal-Synchronisation und Erinnerungen.

## Features

- **Mehrere Kalender** - Verwalte verschiedene Kalender für Arbeit, Privates, Familie
- **Kalenderansichten** - Tag, Woche, Monat, Agenda
- **Wiederkehrende Termine** - Flexible Wiederholungsregeln (RFC 5545)
- **Kalender teilen** - Mit Familie, Freunden oder Kollegen
- **CalDAV/iCal Sync** - Google Calendar, Apple, Outlook
- **Smarte Erinnerungen** - Push & E-Mail Benachrichtigungen
- **Multi-Sprache** - Deutsch, English, Français, Español, Italiano

## Quick Start

```bash
# 1. PostgreSQL starten (falls nicht läuft)
docker compose -f docker-compose.dev.yml up -d postgres

# 2. Datenbank erstellen
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE calendar;"

# 3. Schema pushen
pnpm calendar:db:push

# 4. Backend + Web starten
pnpm dev:calendar:app
```

## Apps

| App | Port | Beschreibung |
|-----|------|--------------|
| [Backend](apps/backend) | 3014 | NestJS REST API |
| [Web](apps/web) | 5179 | SvelteKit Web-App |
| [Landing](apps/landing) | 4322 | Astro Marketing-Seite |
| Mobile | - | Expo App (TODO) |

## Tech Stack

- **Backend**: NestJS, Drizzle ORM, PostgreSQL
- **Web**: SvelteKit, Svelte 5, Tailwind CSS
- **Landing**: Astro, Tailwind CSS
- **Auth**: Mana Core Auth (JWT)

## Dokumentation

Siehe [CLAUDE.md](CLAUDE.md) für die vollständige technische Dokumentation.

## Entwicklung

```bash
# Einzelne Apps starten
pnpm dev:calendar:backend    # Backend
pnpm dev:calendar:web        # Web-App
pnpm dev:calendar:landing    # Landing Page

# Datenbank
pnpm calendar:db:push        # Schema pushen
pnpm calendar:db:studio      # Drizzle Studio öffnen
```

## API Endpunkte

| Modul | Endpunkt | Beschreibung |
|-------|----------|--------------|
| Health | `GET /api/v1/health` | Health Check |
| Calendars | `GET/POST /api/v1/calendars` | Kalender CRUD |
| Events | `GET/POST /api/v1/events` | Termine CRUD |
| Reminders | `POST /api/v1/events/:id/reminders` | Erinnerungen |
| Shares | `POST /api/v1/calendars/:id/shares` | Freigaben |
| Sync | `POST /api/v1/sync/caldav/discover` | CalDAV |

## Lizenz

Proprietär - Manacore
