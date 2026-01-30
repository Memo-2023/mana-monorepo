# Matrix ManaDeck Bot - Claude Code Guidelines

## Overview

Matrix ManaDeck Bot provides card/deck management via Matrix chat. It integrates with the ManaDeck backend for full CRUD operations, AI deck generation, study sessions, and spaced repetition progress tracking.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: ManaDeck API (port 3009)
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
services/matrix-manadeck-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3321)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── manadeck/
│   │   ├── manadeck.module.ts
│   │   └── manadeck.service.ts # ManaDeck Backend API client
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

### Deck Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!decks` | liste | List all decks |
| `!deck [nr]` | details | Show deck details |
| `!neu Titel` | new, create | Create new deck (10 Mana) |
| `!loeschen [nr]` | delete | Delete deck |

### Card Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!karten [nr]` | cards | List cards in deck |
| `!karte [deck-nr] [card-nr]` | card | Show card details |

### AI Generation

| Command | Options | Description |
|---------|---------|-------------|
| `!generate Thema` | generieren, gen | Generate deck with AI (30 Mana) |
| `--count N` | - | Number of cards (1-50) |
| `--type TYPE` | - | flashcard, quiz, text, mixed |
| `--difficulty LEVEL` | - | beginner, intermediate, advanced |

### Learning & Progress

| Command | Aliases | Description |
|---------|---------|-------------|
| `!lernen [nr]` | study | Start study session |
| `!faellig` | due | Show due cards |
| `!stats` | statistik | Learning statistics |
| `!mana` | credits, guthaben | Show mana balance |

### Public Features

| Command | Aliases | Description |
|---------|---------|-------------|
| `!featured` | empfohlen | Show featured decks |
| `!leaderboard` | rangliste | Show top 10 users |

## Example Usage

```
# Login
!login max@example.com mypassword

# Create a deck
!neu Spanisch Vokabeln | Grundwortschatz

# Generate deck with AI
!generate Deutsche Geschichte --count 20 --type flashcard

# List decks
!decks

# View cards
!karten 1

# Start studying
!lernen 1

# Check due cards
!faellig

# Check mana balance
!mana
```

## Card Types

| Type | Content Structure |
|------|-------------------|
| `text` | `{ text, formatting? }` |
| `flashcard` | `{ front, back, hint? }` |
| `quiz` | `{ question, options[], correctAnswer, explanation? }` |
| `mixed` | `{ sections: Array<TextContent | FlashcardContent | QuizContent> }` |

## Credit Costs (Mana)

| Operation | Cost |
|-----------|------|
| Deck Creation | 10 Mana |
| Card Creation | 2 Mana |
| AI Card Generation | 5 Mana |
| AI Deck Generation | 30 Mana |
| Deck Export | 3 Mana |

## Environment Variables

```env
# Server
PORT=3321

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#manadeck:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# ManaDeck Backend
MANADECK_BACKEND_URL=http://localhost:3009
MANADECK_API_PREFIX=/api

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-manadeck-bot/Dockerfile -t matrix-manadeck-bot services/matrix-manadeck-bot

# Run
docker run -p 3321:3321 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e MANADECK_BACKEND_URL=http://manadeck-backend:3009 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-manadeck-bot-data:/app/data \
  matrix-manadeck-bot
```

## Health Check

```bash
curl http://localhost:3321/health
```

## ManaDeck Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/public/health` | GET | Health check |
| `/public/featured-decks` | GET | Featured decks |
| `/public/leaderboard` | GET | Leaderboard |
| `/api/decks` | GET | List user's decks |
| `/api/decks` | POST | Create deck |
| `/api/decks/:id` | GET | Get deck details |
| `/api/decks/:id` | DELETE | Delete deck |
| `/api/decks/:id/cards` | GET | Get cards in deck |
| `/api/cards/:id` | GET | Get card details |
| `/api/decks/generate` | POST | AI generate deck |
| `/api/study-sessions` | POST | Start study session |
| `/api/progress/due` | GET | Get due cards |
| `/api/stats` | GET | Get user stats |
| `/api/credits/balance` | GET | Get mana balance |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!decks` to get a list of decks
2. Bot stores the list internally for the user
3. User can reference decks by their list number
4. Numbers are valid until the user runs a new list command

Similarly for cards:
1. User runs `!karten [deck-nr]` to get cards
2. Cards can be referenced by `!karte [deck-nr] [card-nr]`

This allows simple commands like:
- `!deck 3` - Show details for deck #3
- `!karten 1` - Show cards in deck #1
- `!karte 1 5` - Show card #5 in deck #1
- `!lernen 2` - Start study session for deck #2
