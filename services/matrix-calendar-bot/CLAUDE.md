# Matrix Calendar Bot - Claude Code Guidelines

## Overview

Matrix Calendar Bot provides calendar/event management via Matrix chat. It integrates with the Calendar backend for full CRUD operations, syncing events across Matrix, web, and mobile apps.

**Login Required**: Users must login (`!login email password`) to use the bot. All events are synchronized with the calendar-backend.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Calendar API (port 3014)
- **Auth**: Mana Core Auth (JWT)

## Commands

```bash
# Development
pnpm install
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types
```

## Project Structure

```
services/matrix-calendar-bot/
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help texts
│   └── bot/
│       ├── bot.module.ts
│       └── matrix.service.ts # Matrix client & command handlers
├── Dockerfile
└── package.json
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!help` | Show help message |
| `!login email pass` | Login (required before use) |
| `!logout` | Logout |
| `!heute` / `!today` | Show today's events |
| `!morgen` / `!tomorrow` | Show tomorrow's events |
| `!woche` / `!week` | Show this week's events |
| `!termine` | Show next 14 days |
| `!termin [...]` | Create new event |
| `!details [nr]` | Show event details |
| `!löschen [nr]` | Delete event |
| `!kalender` | Show calendars |
| `!status` | Bot status |
| `!pin` | Pin help to room |

## Natural Language Keywords

The bot also responds to natural language (German + English):
- "hilfe", "help" → Show help
- "was steht heute an", "termine heute" → Today's events
- "termine morgen" → Tomorrow's events
- "diese woche", "wochenübersicht" → Week events
- "zeige kalender" → Show calendars

## Event Input Syntax

```
!termin Meeting am 15.02. um 14:00
       │        │         └── Time (optional, defaults to 9:00)
       │        └── Date (DD.MM. or DD.MM.YYYY)
       └── Event title

!termin Zahnarzt morgen um 10:30
                │      └── Time
                └── Relative date (heute, morgen, übermorgen)

!termin Geburtstag am 20.03. ganztägig
                             └── All-day event flag
```

## Environment Variables

```env
# Server
PORT=3315

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#calendar-bot:mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Calendar Backend
CALENDAR_BACKEND_URL=http://localhost:3014

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001

# Redis (for session storage)
REDIS_URL=redis://localhost:6379

# Speech-to-Text (optional)
STT_URL=http://localhost:3020
```

## Docker

```bash
# Build locally
docker build -f services/matrix-calendar-bot/Dockerfile -t matrix-calendar-bot services/matrix-calendar-bot

# Run
docker run -p 3315:3315 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e CALENDAR_BACKEND_URL=http://calendar-backend:3014 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-calendar-bot-data:/app/data \
  matrix-calendar-bot
```

## Health Check

```bash
curl http://localhost:3315/health
```

## Getting a Matrix Access Token

```bash
# Login to get access token
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "calendar-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Authentication Flow

1. User sends `!login email password`
2. Bot authenticates via mana-core-auth
3. JWT token stored in Redis session
4. Token used for all Calendar API calls
5. Events sync with calendar-backend (PostgreSQL)

## Data Synchronization

All events are stored in the Calendar backend PostgreSQL database. Changes made via:
- Matrix bot
- Calendar web app
- Calendar mobile app

...are all synchronized automatically.
