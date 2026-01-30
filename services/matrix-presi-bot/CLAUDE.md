# Matrix Presi Bot - Claude Code Guidelines

## Overview

Matrix Presi Bot provides presentation management via Matrix chat. It integrates with the Presi backend for deck/slide management, theming, and sharing.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Presi API (port 3008)
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
services/matrix-presi-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3325)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── presi/
│   │   ├── presi.module.ts
│   │   └── presi.service.ts  # Presi Backend API client
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

### Presentation Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!presis` | decks, liste | List all presentations |
| `!presi [nr]` | deck, details | Show presentation with slides |
| `!neu Titel` | new, create | Create presentation |
| `!loeschen [nr]` | delete | Delete presentation |
| `!umbenennen [nr] Titel` | rename | Rename presentation |

### Slide Management

| Command | Description |
|---------|-------------|
| `!folie [nr] titel Titel \| Untertitel` | Add title slide |
| `!folie [nr] text Titel \| Inhalt` | Add content slide |
| `!folie [nr] punkte Titel \| P1, P2, P3` | Add bullet slide |
| `!folie [nr] bild Titel \| URL` | Add image slide |
| `!folieloeschen [presi-nr] [folien-nr]` | Delete slide |

### Themes

| Command | Aliases | Description |
|---------|---------|-------------|
| `!themes` | designs | List available themes |
| `!theme [presi-nr] [theme-nr]` | design | Apply theme |

### Sharing

| Command | Options | Description |
|---------|---------|-------------|
| `!teilen [nr]` | share | Share presentation |
| `--tage N` | - | Expire in N days |
| `!links [nr]` | shares | List share links |

## Slide Types

| Type | Content |
|------|---------|
| `title` | Title + optional subtitle |
| `content` | Title + body text |
| `bullets` | Title + bullet points |
| `image` | Title + image URL |

## Example Usage

```
# Login
!login max@example.com mypassword

# Create presentation
!neu Meine Praesentation | Eine tolle Praesentation

# List presentations
!presis

# Add title slide
!folie 1 titel Willkommen | Zur Praesentation

# Add content slide
!folie 1 text Einfuehrung | Hier ist der Inhalt

# Add bullet points
!folie 1 punkte Agenda | Punkt 1, Punkt 2, Punkt 3

# View presentation
!presi 1

# Apply theme
!themes
!theme 1 2

# Share presentation
!teilen 1 --tage 7

# View share links
!links 1
```

## Environment Variables

```env
# Server
PORT=3325

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#presi:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Presi Backend
PRESI_BACKEND_URL=http://localhost:3008
PRESI_API_PREFIX=/api

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-presi-bot/Dockerfile -t matrix-presi-bot services/matrix-presi-bot

# Run
docker run -p 3325:3325 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e PRESI_BACKEND_URL=http://presi-backend:3008 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-presi-bot-data:/app/data \
  matrix-presi-bot
```

## Health Check

```bash
curl http://localhost:3325/health
```

## Presi Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/decks` | GET | List presentations |
| `/api/decks` | POST | Create presentation |
| `/api/decks/:id` | GET | Get presentation with slides |
| `/api/decks/:id` | PUT | Update presentation |
| `/api/decks/:id` | DELETE | Delete presentation |
| `/api/decks/:id/slides` | POST | Add slide |
| `/api/slides/:id` | DELETE | Delete slide |
| `/api/themes` | GET | List themes |
| `/api/share/deck/:id` | POST | Create share link |
| `/api/share/deck/:id/links` | GET | List share links |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!presis` or `!themes` to get a list
2. Bot stores the list internally for the user
3. User can reference items by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!presi 2` - Show presentation #2
- `!folie 1 titel Hallo` - Add slide to presentation #1
- `!theme 1 3` - Apply theme #3 to presentation #1
