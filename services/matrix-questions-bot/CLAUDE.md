# Matrix Questions Bot - Claude Code Guidelines

## Overview

Matrix Questions Bot provides Q&A research management via Matrix chat. It integrates with the Questions backend for question management, web research via mana-search, answer tracking, and collection organization.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Questions API (port 3011)
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
services/matrix-questions-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3324)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── questions/
│   │   ├── questions.module.ts
│   │   └── questions.service.ts # Questions Backend API client
│   └── session/
│       ├── session.module.ts
│       └── session.service.ts  # User session & auth management
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!help` | hilfe | Show help message |
| `!login email pass` | - | Login |
| `!logout` | - | Logout |
| `!status` | - | Bot status |

### Question Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!fragen` | questions, liste | List all questions |
| `!fragen offen` | - | Filter by status |
| `!frage [nr]` | question, details | Show question details |
| `!neu Frage?` | new, ask | Create new question |
| `!loeschen [nr]` | delete | Delete question |
| `!archivieren [nr]` | archive | Archive question |

### Research

| Command | Aliases | Description |
|---------|---------|-------------|
| `!recherche [nr]` | research | Start quick research |
| `!recherche [nr] standard` | - | Standard research (15 sources) |
| `!recherche [nr] deep` | - | Deep research (30 sources) |
| `!ergebnis [nr]` | result | Show research result |
| `!quellen [nr]` | sources | Show sources |

### Answers

| Command | Aliases | Description |
|---------|---------|-------------|
| `!antwort [nr]` | answer | Show answer |
| `!bewerten [nr] 1-5` | rate | Rate answer |
| `!akzeptieren [nr]` | accept | Accept as solution |

### Collections

| Command | Aliases | Description |
|---------|---------|-------------|
| `!sammlungen` | collections | List collections |
| `!sammlung Name` | collection | Create collection |

### Search

| Command | Aliases | Description |
|---------|---------|-------------|
| `!suche Begriff` | search | Search questions |

## Research Depths

| Depth | Sources | Content Extraction | Categories |
|-------|---------|-------------------|------------|
| `quick` | 5 | No | general |
| `standard` | 15 | Yes | general, news |
| `deep` | 30 | Yes | general, news, science, it |

## Question Status

| Status | Emoji | Description |
|--------|-------|-------------|
| `open` | ❓ | New question |
| `researching` | 🔍 | Research in progress |
| `answered` | ✅ | Has answer |
| `archived` | 📦 | Archived |

## Priority Levels

| Priority | Indicator |
|----------|-----------|
| `urgent` | 🔴 |
| `high` | 🟠 |
| `normal` | (none) |
| `low` | (none) |

## Example Usage

```
# Login
!login max@example.com mypassword

# Create a new question
!neu Was ist Quantencomputing?

# List questions
!fragen

# Start research
!recherche 1 standard

# View sources
!quellen 1

# View answer
!antwort 1

# Rate the answer
!bewerten 1 5

# Accept as solution
!akzeptieren 1

# Search questions
!suche quantum

# Create collection
!sammlung Wissenschaft
```

## Environment Variables

```env
# Server
PORT=3324

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#questions:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Questions Backend
QUESTIONS_BACKEND_URL=http://localhost:3011
QUESTIONS_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-questions-bot/Dockerfile -t matrix-questions-bot services/matrix-questions-bot

# Run
docker run -p 3324:3324 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e QUESTIONS_BACKEND_URL=http://questions-backend:3011 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-questions-bot-data:/app/data \
  matrix-questions-bot
```

## Health Check

```bash
curl http://localhost:3324/health
```

## Questions Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/questions` | GET | List questions |
| `/api/v1/questions` | POST | Create question |
| `/api/v1/questions/:id` | GET | Get question |
| `/api/v1/questions/:id` | DELETE | Delete question |
| `/api/v1/questions/:id/status` | PUT | Update status |
| `/api/v1/research/start` | POST | Start research |
| `/api/v1/research/question/:id` | GET | Get research results |
| `/api/v1/sources/question/:id` | GET | Get sources |
| `/api/v1/answers/question/:id` | GET | Get answers |
| `/api/v1/answers/:id/rate` | POST | Rate answer |
| `/api/v1/answers/:id/accept` | POST | Accept answer |
| `/api/v1/collections` | GET | List collections |
| `/api/v1/collections` | POST | Create collection |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!fragen` to get a list of questions
2. Bot stores the list internally for the user
3. User can reference questions by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!frage 3` - Show details for question #3
- `!recherche 1 deep` - Start deep research for question #1
- `!antwort 2` - Show answer for question #2
