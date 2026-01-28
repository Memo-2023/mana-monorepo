# Matrix Clock Bot - Claude Code Guidelines

## Overview

Matrix Clock Bot provides time tracking functionality via Matrix chat. Users can create timers, set alarms, and manage world clocks through text commands or voice notes.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Clock API (port 3017)
- **STT**: mana-stt service (port 3020)

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
services/matrix-clock-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3317)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── clock/
│   │   ├── clock.module.ts
│   │   └── clock.service.ts  # Clock API client
│   └── transcription/
│       ├── transcription.module.ts
│       └── transcription.service.ts  # STT service client
├── Dockerfile
└── package.json
```

## Bot Commands

### Timer Commands

| Command | Description |
|---------|-------------|
| `!timer 25m` | Create & start 25-minute timer |
| `!timer 1h30m` | Create 1.5 hour timer |
| `!timer 25m Pomodoro` | Timer with label |
| `!stop` | Pause running timer |
| `!resume` | Resume paused timer |
| `!reset` | Reset timer to start |
| `!status` | Show current timer status |
| `!timers` | List all timers |

### Alarm Commands

| Command | Description |
|---------|-------------|
| `!alarm 07:30` | Set alarm for 7:30 |
| `!alarm 7 Uhr 30` | German time format |
| `!alarm 06:00 Aufstehen!` | Alarm with label |
| `!alarms` | List all alarms |

### World Clock Commands

| Command | Description |
|---------|-------------|
| `!zeit` / `!time` | Current time + world clocks |
| `!weltuhr Berlin` | Add world clock |
| `!weltuhren` | List world clocks |

### Natural Language & Voice

The bot understands natural language:
- "Timer 25 Minuten"
- "Wecker um 7 Uhr"
- "Stop"
- "Status"

Voice notes are transcribed and parsed as commands.

## Environment Variables

```env
# Server
PORT=3317

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#clock:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Clock Backend API
CLOCK_API_URL=http://localhost:3017/api/v1
CLOCK_API_TOKEN=

# Speech-to-Text
STT_URL=http://localhost:3020
```

## Clock API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/timers` | GET | List all timers |
| `/timers` | POST | Create timer |
| `/timers/:id/start` | POST | Start timer |
| `/timers/:id/pause` | POST | Pause timer |
| `/timers/:id/reset` | POST | Reset timer |
| `/alarms` | GET | List alarms |
| `/alarms` | POST | Create alarm |
| `/alarms/:id/toggle` | PATCH | Toggle alarm |
| `/world-clocks` | GET | List world clocks |
| `/world-clocks` | POST | Add world clock |
| `/timezones/search` | GET | Search timezones (public) |

## Docker

```bash
# Build
docker build -f services/matrix-clock-bot/Dockerfile -t matrix-clock-bot services/matrix-clock-bot

# Run
docker run -p 3317:3317 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e CLOCK_API_URL=http://clock-backend:3017/api/v1 \
  -e STT_URL=http://mana-stt:3020 \
  -v matrix-clock-bot-data:/app/data \
  matrix-clock-bot
```

## Health Check

```bash
curl http://localhost:3317/health
```

## Authentication

Currently uses a demo token (`CLOCK_API_TOKEN`) for development. Production should implement proper user authentication flow:

1. User sends `!login` command
2. Bot initiates OAuth/auth flow with mana-core-auth
3. User token stored per Matrix user ID
4. Token used for all Clock API calls
