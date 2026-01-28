# Matrix Calendar Bot - Claude Code Guidelines

## Overview

Matrix Calendar Bot provides a GDPR-compliant calendar/event management interface via Matrix chat. It uses the Matrix protocol for messaging, allowing self-hosting all data on the Mac Mini server.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Storage**: Local JSON file (per-user events)

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
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   └── calendar/
│       ├── calendar.module.ts
│       └── calendar.service.ts # Event storage & management
├── Dockerfile
└── package.json
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!help` | Show help message |
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

# Calendar API (optional, for future integration)
CALENDAR_API_URL=http://localhost:3016/api/v1
```

## Docker

```bash
# Build locally
docker build -f services/matrix-calendar-bot/Dockerfile -t matrix-calendar-bot services/matrix-calendar-bot

# Run
docker run -p 3315:3315 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
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

## Data Storage

Events are stored in a local JSON file (`/app/data/calendar-data.json`) with per-user isolation.

Structure:
```json
{
  "events": [
    {
      "id": "unique-id",
      "title": "Event title",
      "description": null,
      "location": null,
      "startTime": "2024-02-15T14:00:00.000Z",
      "endTime": "2024-02-15T15:00:00.000Z",
      "isAllDay": false,
      "calendarId": "cal-id",
      "calendarName": "Mein Kalender",
      "createdAt": "2024-01-27T10:00:00Z",
      "userId": "@user:mana.how"
    }
  ],
  "calendars": [
    {
      "id": "cal-id",
      "name": "Mein Kalender",
      "color": "#3B82F6",
      "userId": "@user:mana.how"
    }
  ]
}
```

## GDPR Compliance

- All event data stored locally on Mac Mini
- No third-party data processing
- Full control over data retention
- Per-user data isolation via Matrix user IDs
- Can delete all user data on request
