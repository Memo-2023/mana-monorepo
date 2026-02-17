# Matrix Mana Bot (Gateway)

Unified Matrix bot that combines all features in one. Users can interact with a single bot for AI chat, todos, calendar, timers, and more.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     matrix-mana-bot                              │
│                        (Gateway)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Matrix Service                         │   │
│  │  • Handles Matrix connection                              │   │
│  │  • Receives messages                                      │   │
│  │  • Sends replies                                          │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Command Router                           │   │
│  │  • Parses !commands and natural language                  │   │
│  │  • Routes to appropriate handler                          │   │
│  │  • Falls back to AI chat                                  │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         ▼                  ▼                  ▼                 │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │ AI Handler │    │Todo Handler│    │Cal Handler │ ...        │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘            │
│        │                 │                 │                    │
│        └─────────────────┴─────────────────┘                    │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              @manacore/bot-services                       │   │
│  │  (Shared Business Logic - no Matrix code)                 │   │
│  │                                                           │   │
│  │  • TodoService    • CalendarService                       │   │
│  │  • AiService      • ClockService                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Features

| Category | Commands | Description |
|----------|----------|-------------|
| **AI Chat** | Just type, `!model`, `!models`, `!all`, `!clear` | Local LLM via Ollama |
| **Todos** | `!todo`, `!list`, `!today`, `!done`, `!delete` | Task management |
| **Calendar** | `!cal`, `!week`, `!event`, `!calendars` | Event scheduling |
| **Timers** | `!timer`, `!timers`, `!stop`, `!alarm`, `!alarms` | Time management |
| **Smart** | `!summary`, `!ai-todo` | Cross-feature AI features |
| **Voice** | Send voice note | Speech-to-text via Whisper |
| **Morning** | `!morning`, `!morning-on/off`, `!morning-time` | Daily morning summary |

## Commands

### AI & Chat

```
# Just type a message - AI responds
Was ist TypeScript?

# Switch model
!model gemma3:4b

# List available models
!models

# Compare all models
!all Erkläre Docker

# Clear chat history
!clear
```

### Todos

```
# Create task
!todo Einkaufen gehen

# With priority (1-4, 1 = highest)
!todo Wichtig !p1

# With date
!todo Meeting @morgen
!todo Report @heute

# With project
!todo Feature implementieren #arbeit

# List all
!list

# Today's tasks
!today

# Complete task
!done 1

# Delete task
!delete 1
```

### Calendar

```
# Today's events
!cal

# This week
!week

# Create event
!event Meeting morgen 14:30
!event Geburtstag heute ganztägig
```

### Timers & Alarms

```
# Start timer
!timer 25m Pomodoro
!timer 1h30m Meeting

# List active timers
!timers

# Stop timer
!stop

# Set alarm
!alarm 14:30 Meeting
!alarm 7:00 Aufstehen

# List alarms
!alarms

# World clock
!time
!time tokyo
```

### Voice Input

```
# Send a voice note in Matrix - bot transcribes and responds
🎤 "Was steht heute an?"
→ Bot shows: 🎤 *"Was steht heute an?"*
→ Bot responds with today's events and tasks

# Voice commands work naturally
🎤 "Neue Aufgabe: Einkaufen gehen"
🎤 "Timer 25 Minuten"
🎤 "Was sind meine Termine diese Woche?"
```

### Smart Features (Cross-Feature)

```
# AI-powered daily summary
!summary

# AI extracts todos from text
!ai-todo Im Meeting besprochen: Website redesign, API Docs aktualisieren
```

### Morning Summary

```
# Get morning summary now
!morning

# Enable/disable automatic daily delivery
!morning-on
!morning-off

# Set delivery time (HH:MM)
!morning-time 07:30

# Set weather location
!morning-location Berlin

# Set timezone
!morning-timezone Europe/Berlin

# Set format (compact/detailed)
!morning-format detailed

# Show current settings
!morning-settings

# Show help
!morning-help
```

The morning summary includes:
- Weather forecast (Open-Meteo API)
- Today's calendar events
- Today's tasks + overdue tasks
- Birthdays (from Contacts)
- Plants needing water (from Planta)

## Development

### Prerequisites

- Node.js 20+
- pnpm
- Running Matrix homeserver (Synapse)
- Bot account with access token
- Ollama (for AI features)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Start in development mode
pnpm start:dev

# Or build and run
pnpm build && pnpm start:prod
```

### Get Matrix Access Token

```bash
# Register bot user (if not exists)
docker exec -it synapse register_new_matrix_user \
  -u mana-bot \
  -p your_password \
  -a \
  -c /data/homeserver.yaml \
  http://localhost:8008

# Login to get access token
curl -X POST "http://localhost:8008/_matrix/client/r0/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "mana-bot", "password": "your_password"}'
```

### Project Structure

```
src/
├── main.ts                    # Entry point
├── app.module.ts              # Root module
├── config/
│   └── configuration.ts       # Config & help texts
├── health/
│   └── health.controller.ts   # Health endpoint
├── bot/
│   ├── bot.module.ts
│   ├── matrix.service.ts      # Matrix connection
│   └── command-router.service.ts  # Command routing
├── voice/
│   ├── voice.module.ts
│   └── voice.service.ts       # STT/TTS integration
├── handlers/
│   ├── handlers.module.ts
│   ├── ai.handler.ts          # AI/Ollama commands
│   ├── todo.handler.ts        # Todo commands
│   ├── calendar.handler.ts    # Calendar commands
│   ├── clock.handler.ts       # Timer/alarm commands
│   ├── help.handler.ts        # Help & status
│   ├── voice.handler.ts       # Voice commands
│   └── morning.handler.ts     # Morning summary commands
├── scheduler/
│   ├── scheduler.module.ts    # @nestjs/schedule integration
│   └── morning-summary.scheduler.ts  # Cron job for morning delivery
└── orchestration/
    ├── orchestration.module.ts
    └── orchestration.service.ts  # Cross-feature logic
```

### Adding New Commands

1. Add route in `command-router.service.ts`:

```typescript
{
  patterns: ['!mycommand'],
  handler: (ctx, args) => this.myHandler.doSomething(ctx, args),
  description: 'My new command',
}
```

2. Create handler in `handlers/my.handler.ts`:

```typescript
@Injectable()
export class MyHandler {
  constructor(private myService: MyService) {}

  async doSomething(ctx: CommandContext, args: string): Promise<string> {
    // Use service from @manacore/bot-services
    const result = await this.myService.doThing(ctx.userId, args);
    return `Result: ${result}`;
  }
}
```

3. Register in `handlers.module.ts`

## Docker

### Build

```bash
docker build -t matrix-mana-bot .
```

### Run

```bash
docker run -d \
  --name matrix-mana-bot \
  -p 3310:3310 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e OLLAMA_URL=http://ollama:11434 \
  -v ./data:/app/data \
  matrix-mana-bot
```

### Docker Compose

See `docker-compose.macmini.yml` in the monorepo root.

## Relationship to Other Bots

This Gateway bot can run **alongside** the standalone bots:

| Bot | Purpose | When to Use |
|-----|---------|-------------|
| **matrix-mana-bot** (this) | All features in one | General users |
| **matrix-todo-bot** | Todo only | Dedicated todo room |
| **matrix-ollama-bot** | AI only | Dedicated AI room |
| **matrix-clock-bot** | Timers only | Time tracking room |

All bots share the same `@manacore/bot-services` package, so data is consistent.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3310 | HTTP port |
| `MATRIX_HOMESERVER_URL` | Yes | - | Matrix server URL |
| `MATRIX_ACCESS_TOKEN` | Yes | - | Bot access token |
| `MATRIX_STORAGE_PATH` | No | ./data/... | Sync state storage |
| `MATRIX_ALLOWED_ROOMS` | No | - | Restrict to rooms |
| `OLLAMA_URL` | No | localhost:11434 | Ollama API |
| `OLLAMA_MODEL` | No | gemma3:4b | Default LLM |
| `CLOCK_API_URL` | No | localhost:3017 | Clock backend |
| `TODO_STORAGE_PATH` | No | ./data/todos.json | Todo storage |
| `TODO_API_URL` | No | localhost:3018 | Todo API (morning summary) |
| `CALENDAR_STORAGE_PATH` | No | ./data/calendar.json | Calendar storage |
| `CALENDAR_API_URL` | No | localhost:3014 | Calendar API (morning summary) |
| `CONTACTS_API_URL` | No | localhost:3015 | Contacts API (birthdays) |
| `PLANTA_API_URL` | No | localhost:3022 | Planta API (plants) |
| `WEATHER_DEFAULT_LOCATION` | No | Berlin | Default weather location |
| `STT_URL` | No | localhost:3020 | Speech-to-text (Whisper) |
| `VOICE_BOT_URL` | No | localhost:3050 | Voice bot (TTS) |
| `DEFAULT_VOICE` | No | de-DE-ConradNeural | Default TTS voice |
| `VOICE_ENABLED` | No | true | Enable voice processing |
