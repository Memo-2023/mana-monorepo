# Matrix Planta Bot - Claude Code Guidelines

## Overview

Matrix Planta Bot provides plant care management via Matrix chat. It integrates with the Planta backend for plant CRUD operations, watering schedules, watering history, care settings, and **AI-powered plant identification** via image analysis.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Planta API (port 3022)
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
services/matrix-planta-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3322)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── planta/
│   │   ├── planta.module.ts
│   │   └── planta.service.ts # Planta Backend API client
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

### Plant Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!pflanzen` | plants, liste | List all plants |
| `!pflanze [nr]` | plant, details | Show plant details |
| `!neu Name` | new, add | Add new plant |
| `!loeschen [nr]` | delete, entfernen | Remove plant |
| `!edit [nr] [feld] [wert]` | bearbeiten | Edit plant field |

### AI Plant Identification

| Action | Description |
|--------|-------------|
| Send image | Automatically analyzes plant with Gemini Vision AI |

When you send an image to the bot, it will:
1. Upload the image to the Planta backend
2. Analyze it using Google Gemini Vision
3. Return identification (scientific name, common names, confidence)
4. Show health assessment and care tips

### Watering

| Command | Aliases | Description |
|---------|---------|-------------|
| `!giessen [nr]` | water | Mark plant as watered |
| `!giessen [nr] Notiz` | - | Water with note |
| `!faellig` | due, upcoming | Show watering status |
| `!historie [nr]` | history, verlauf | Watering history |
| `!intervall [nr] [tage]` | interval, frequenz | Set watering interval |

## Editable Fields

| Field | Aliases | Values |
|-------|---------|--------|
| `name` | - | Any text |
| `art` | wissenschaftlich, scientific | Scientific name |
| `licht` | light | wenig/low, mittel/medium, hell/bright, direkt/direct |
| `wasser` | water | Number of days |
| `feuchtigkeit` | humidity | niedrig/low, mittel/medium, hoch/high |
| `temperatur` | temperature | Any text |
| `erde` | soil | Any text |
| `notizen` | notes | Any text |

## Example Usage

```
# Login
!login max@example.com mypassword

# Send a plant image -> Bot responds with:
# 🌿 Pflanze erkannt!
# Monstera deliciosa (Fensterblatt)
# ✅ Konfidenz: 92%
#
# Gesundheit: 💚 Gesund
#
# 📋 Pflegetipps:
# • ☀️ Helles Licht - Heller Standort mit indirektem Sonnenlicht
# • 💧 Alle 7 Tage giessen
# • 🌱 Blaetter regelmaessig mit Wasser besprühen

# Add a new plant
!neu Monstera Deliciosa

# Edit plant properties
!edit 1 licht hell
!edit 1 wasser 7
!edit 1 notizen Fensterbank Wohnzimmer

# Water a plant
!giessen 1
!giessen 1 Etwas Duenger hinzugefuegt

# Check watering status
!faellig

# View watering history
!historie 1

# Set watering interval
!intervall 1 5
```

## Plant Health Status

| Status | Emoji | Description |
|--------|-------|-------------|
| `healthy` | 🌱 | Plant is healthy |
| `needs_attention` | ⚠️ | Plant needs care |
| `sick` | 🥀 | Plant is sick |

## Environment Variables

```env
# Server
PORT=3322

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#planta:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Planta Backend
PLANTA_BACKEND_URL=http://localhost:3022
PLANTA_API_PREFIX=/api

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-planta-bot/Dockerfile -t matrix-planta-bot services/matrix-planta-bot

# Run
docker run -p 3322:3322 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e PLANTA_BACKEND_URL=http://planta-backend:3022 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-planta-bot-data:/app/data \
  matrix-planta-bot
```

## Health Check

```bash
curl http://localhost:3322/health
```

## Planta Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/plants` | GET | List user's plants |
| `/api/plants` | POST | Create plant |
| `/api/plants/:id` | GET | Get plant details |
| `/api/plants/:id` | PUT | Update plant |
| `/api/plants/:id` | DELETE | Delete plant |
| `/api/watering/upcoming` | GET | Get upcoming waterings |
| `/api/watering/:plantId/water` | POST | Log watering |
| `/api/watering/:plantId` | PUT | Update watering schedule |
| `/api/watering/:plantId/history` | GET | Get watering history |
| `/api/photos/upload` | POST | Upload plant photo (multipart) |
| `/api/analysis/identify` | POST | Analyze photo with Gemini Vision AI |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!pflanzen` or `!faellig` to get a list
2. Bot stores the list internally for the user
3. User can reference plants by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!pflanze 3` - Show details for plant #3
- `!giessen 1` - Water plant #1
- `!edit 2 licht hell` - Set light requirement for plant #2
