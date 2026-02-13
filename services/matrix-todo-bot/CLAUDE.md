# Matrix Todo Bot - Claude Code Guidelines

## Overview

Matrix Todo Bot provides a task management interface via Matrix chat. It integrates with the Todo backend for full CRUD operations, syncing tasks across Matrix, web, and mobile apps.

**Login Required**: Users must login (`!login email password`) to use the bot. All tasks are synchronized with the todo-backend.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Todo API (port 3018)
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
services/matrix-todo-bot/
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
| `!add [task]` | Create a new task |
| `!list` | Show all pending tasks |
| `!heute` / `!today` | Show today's tasks |
| `!inbox` | Show tasks without date |
| `!done [nr]` | Mark task as complete |
| `!delete [nr]` | Delete a task |
| `!projects` | List all projects |
| `!project [name]` | Show project tasks |
| `!status` | Show bot status |
| `!pin` | Pin help to room |

## Natural Language Keywords

The bot also responds to natural language (German + English):
- "hilfe", "help" → Show help
- "zeige aufgaben", "show tasks" → List tasks
- "heute", "today" → Today's tasks
- "inbox", "eingang" → Inbox tasks
- "projekte", "projects" → List projects

## Task Input Syntax

```
!add Task title !p1 @morgen #projektname
     │          │    │       └── Project
     │          │    └── Due date (@heute, @morgen, @übermorgen)
     │          └── Priority (1-4, 1 highest)
     └── Task title
```

## Environment Variables

```env
# Server
PORT=3314

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#todo-bot:mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Todo Backend
TODO_BACKEND_URL=http://localhost:3018

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001

# Redis (for session storage)
REDIS_URL=redis://localhost:6379
```

## Docker

```bash
# Build locally
docker build -f services/matrix-todo-bot/Dockerfile -t matrix-todo-bot services/matrix-todo-bot

# Run
docker run -p 3314:3314 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e TODO_BACKEND_URL=http://todo-backend:3018 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-todo-bot-data:/app/data \
  matrix-todo-bot
```

## Health Check

```bash
curl http://localhost:3314/health
```

## Getting a Matrix Access Token

```bash
# Login to get access token
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "todo-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Authentication Flow

1. User sends `!login email password`
2. Bot authenticates via mana-core-auth
3. JWT token stored in Redis session
4. Token used for all Todo API calls
5. Tasks sync with todo-backend (PostgreSQL)

## Data Synchronization

All tasks are stored in the Todo backend PostgreSQL database. Changes made via:
- Matrix bot
- Todo web app
- Todo mobile app

...are all synchronized automatically.
