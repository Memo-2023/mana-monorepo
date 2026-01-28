# Matrix Zitare Bot - Claude Code Guidelines

## Overview

Matrix Zitare Bot provides daily inspirational quotes via Matrix chat. It includes a built-in collection of German quotes and integrates with the Zitare backend for user favorites and lists management.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Storage**: Built-in quotes + Zitare Backend API
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
services/matrix-zitare-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3317)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration, help text, quotes data
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── quotes/
│   │   ├── quotes.module.ts
│   │   ├── quotes.service.ts # Local quotes management
│   │   └── zitare.service.ts # Zitare Backend API client
│   └── session/
│       ├── session.module.ts
│       └── session.service.ts  # User session & auth management
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `!help` | Show help message |
| `!zitat` | Random quote |
| `!heute` | Quote of the day |
| `!suche [text]` | Search quotes |
| `!kategorie [name]` | Quotes by category |
| `!kategorien` | Show all categories |
| `!login email pass` | Login to Zitare |
| `!logout` | Logout |
| `!favorit` | Save last quote to favorites |
| `!favoriten` | Show favorites |
| `!listen` | Show lists |
| `!liste [name]` | Create new list |
| `!addliste [nr]` | Add last quote to list |
| `!status` | Bot status |

## Natural Language Keywords

The bot responds to natural language (German + English):
- "zitat", "inspiration" -> Random quote
- "heute", "tageszitat" -> Daily quote
- "motiviere mich" -> Motivation quote
- "guten morgen" -> Motivation quote
- "kategorien" -> Show categories
- "hilfe", "help" -> Help message

## Voice Notes

Voice notes are transcribed via mana-stt service and parsed as commands:
- Say category names (e.g., "Motivation", "Liebe") for themed quotes
- Say search terms to find matching quotes
- Use natural language commands

## Quote Categories

- `motivation` - Motivationszitate
- `weisheit` - Weisheiten
- `liebe` - Liebeszitate
- `leben` - Lebenszitate
- `erfolg` - Erfolgszitate
- `glueck` - Gluckszitate
- `freundschaft` - Freundschaft
- `mut` - Mutzitate
- `hoffnung` - Hoffnungszitate
- `natur` - Naturzitate

## Environment Variables

```env
# Server
PORT=3317

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#zitare:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Zitare Backend (for favorites/lists)
ZITARE_BACKEND_URL=http://localhost:3007
ZITARE_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001

# Speech-to-Text
STT_URL=http://localhost:3020
```

## Docker

```bash
# Build locally
docker build -f services/matrix-zitare-bot/Dockerfile -t matrix-zitare-bot services/matrix-zitare-bot

# Run
docker run -p 3317:3317 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e ZITARE_BACKEND_URL=http://zitare-backend:3007 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-zitare-bot-data:/app/data \
  matrix-zitare-bot
```

## Health Check

```bash
curl http://localhost:3317/health
```

## Getting a Matrix Access Token

```bash
# Login to get access token
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "zitare-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Zitare Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/favorites` | GET | Get user favorites |
| `/api/v1/favorites` | POST | Add favorite |
| `/api/v1/favorites/:id` | DELETE | Remove favorite |
| `/api/v1/lists` | GET | Get user lists |
| `/api/v1/lists` | POST | Create list |
| `/api/v1/lists/:id/quotes` | POST | Add quote to list |

## GDPR Compliance

- Built-in quotes stored locally (no external API)
- User favorites/lists stored in Zitare Backend database
- All data under user control
- No third-party tracking
