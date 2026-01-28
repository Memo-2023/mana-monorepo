# Matrix Todo Bot - Claude Code Guidelines

## Overview

Matrix Todo Bot provides a GDPR-compliant task management interface via Matrix chat. It uses the Matrix protocol for messaging, allowing self-hosting all data on the Mac Mini server.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Storage**: Local JSON file (per-user tasks)

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
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   └── todo/
│       ├── todo.module.ts
│       └── todo.service.ts   # Task storage & management
├── Dockerfile
└── package.json
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!help` | Show help message |
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
```

## Docker

```bash
# Build locally
docker build -f services/matrix-todo-bot/Dockerfile -t matrix-todo-bot services/matrix-todo-bot

# Run
docker run -p 3314:3314 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
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

## Data Storage

Tasks are stored in a local JSON file (`/app/data/todo-data.json`) with per-user isolation.

Structure:
```json
{
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task title",
      "completed": false,
      "priority": 4,
      "dueDate": "2024-01-28",
      "project": "Arbeit",
      "labels": [],
      "createdAt": "2024-01-27T10:00:00Z",
      "completedAt": null,
      "userId": "@user:mana.how"
    }
  ],
  "projects": []
}
```

## GDPR Compliance

- All task data stored locally on Mac Mini
- No third-party data processing
- Full control over data retention
- Per-user data isolation via Matrix user IDs
- Can delete all user data on request
