# Matrix Skilltree Bot - Claude Code Guidelines

## Overview

Matrix Skilltree Bot provides skill tree and XP management via Matrix chat. It integrates with the Skilltree backend for skill CRUD, XP tracking, leveling, and activity history.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Skilltree API (port 3024)
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
services/matrix-skilltree-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3326)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── skilltree/
│   │   ├── skilltree.module.ts
│   │   └── skilltree.service.ts # Skilltree Backend API client
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

### Skill Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!skills` | liste, faehigkeiten | List all skills |
| `!skills koerper` | - | Filter by branch |
| `!skill [nr]` | details | Show skill details |
| `!neu Name \| Branch` | new, create | Create skill |
| `!loeschen [nr]` | delete | Delete skill |

### XP Tracking

| Command | Options | Description |
|---------|---------|-------------|
| `!xp [nr] 50 Aktivitaet` | punkte | Add XP to skill |
| `--min N` | - | Optional duration in minutes |

### Statistics

| Command | Aliases | Description |
|---------|---------|-------------|
| `!stats` | statistik | Show user statistics |
| `!aktivitaeten` | activities, verlauf | Recent activities |
| `!aktivitaeten [nr]` | - | Activities for skill |

## Skill Branches

| Branch | German | Icon | Description |
|--------|--------|------|-------------|
| `intellect` | wissen, gehirn | 🧠 | Knowledge, languages, science |
| `body` | koerper, fitness | 💪 | Fitness, sports, health |
| `creativity` | kreativ, kunst | 🎨 | Art, music, writing |
| `social` | sozial | 👥 | Communication, leadership |
| `practical` | praktisch, handwerk | 🔧 | Crafts, cooking, tech |
| `mindset` | achtsamkeit, mental | 💖 | Meditation, focus |
| `custom` | eigene | ⭐ | User-defined |

## Level System

| Level | Name | XP Required |
|-------|------|-------------|
| 0 | Unbekannt | 0 |
| 1 | Anfaenger | 100 |
| 2 | Fortgeschritten | 500 |
| 3 | Kompetent | 1,500 |
| 4 | Experte | 4,000 |
| 5 | Meister | 10,000 |

## Example Usage

```
# Login
!login max@example.com mypassword

# Create a skill
!neu Spanisch | intellect
!neu Joggen | body | Taegliches Lauftraining

# List skills
!skills

# Add XP
!xp 1 100 Vokabeln gelernt
!xp 2 50 30min Joggen --min 30

# View skill details
!skill 1

# View stats
!stats

# View activities
!aktivitaeten
!aktivitaeten 1

# Delete skill
!loeschen 1
```

## Environment Variables

```env
# Server
PORT=3326

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#skilltree:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Skilltree Backend
SKILLTREE_BACKEND_URL=http://localhost:3024
SKILLTREE_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-skilltree-bot/Dockerfile -t matrix-skilltree-bot services/matrix-skilltree-bot

# Run
docker run -p 3326:3326 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e SKILLTREE_BACKEND_URL=http://skilltree-backend:3024 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-skilltree-bot-data:/app/data \
  matrix-skilltree-bot
```

## Health Check

```bash
curl http://localhost:3326/health
```

## Skilltree Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/skills` | GET | List skills |
| `/api/v1/skills` | POST | Create skill |
| `/api/v1/skills/:id` | GET | Get skill details |
| `/api/v1/skills/:id` | DELETE | Delete skill |
| `/api/v1/skills/:id/xp` | POST | Add XP to skill |
| `/api/v1/skills/stats` | GET | Get user statistics |
| `/api/v1/activities` | GET | List activities |
| `/api/v1/activities/recent` | GET | Recent activities |
| `/api/v1/activities/skill/:id` | GET | Skill activities |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!skills` to get a list of skills
2. Bot stores the list internally for the user
3. User can reference skills by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!skill 3` - Show details for skill #3
- `!xp 1 100 Training` - Add 100 XP to skill #1
- `!aktivitaeten 2` - Show activities for skill #2
