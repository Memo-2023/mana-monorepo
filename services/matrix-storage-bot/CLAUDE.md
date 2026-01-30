# Matrix Storage Bot - Claude Code Guidelines

## Overview

Matrix Storage Bot provides cloud storage management via Matrix chat. It integrates with the Storage backend for file/folder management, sharing, favorites, search, and trash operations.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Storage API (port 3016)
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
services/matrix-storage-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3323)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── storage.service.ts # Storage Backend API client
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

### File Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!dateien` | files, ls | List files in root |
| `!dateien [ordner-nr]` | - | List files in folder |
| `!datei [nr]` | file, info | Show file details |
| `!download [nr]` | dl | Get download link |
| `!loeschen [nr]` | delete, rm | Move file to trash |
| `!umbenennen [nr] name` | rename, mv | Rename file |
| `!verschieben [nr] [ordner-nr]` | move | Move to folder |

### Folder Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!ordner` | folders, dir | List root folders |
| `!ordner [nr]` | - | List subfolders |
| `!neuordner Name` | mkdir, newfolder | Create folder |
| `!neuordner Name [in-nr]` | - | Create subfolder |
| `!ordnerloeschen [nr]` | rmdir | Delete folder |

### Sharing

| Command | Options | Description |
|---------|---------|-------------|
| `!teilen [nr]` | share | Share file (create link) |
| `--tage N` | - | Expire in N days |
| `--passwort abc` | - | Password protect |
| `--downloads N` | - | Limit downloads |
| `!links` | shares | List share links |
| `!linkloeschen [nr]` | unshare | Delete share link |

### Organization

| Command | Aliases | Description |
|---------|---------|-------------|
| `!suche Begriff` | search, find | Search files/folders |
| `!favoriten` | favorites, favs | Show favorites |
| `!fav [nr]` | favorit | Toggle favorite |

### Trash

| Command | Aliases | Description |
|---------|---------|-------------|
| `!papierkorb` | trash | Show trash |
| `!wiederherstellen [nr]` | restore | Restore from trash |
| `!leeren` | emptytrash | Empty trash |

## Example Usage

```
# Login
!login max@example.com mypassword

# List files
!dateien

# Create a folder
!neuordner Dokumente

# List folders
!ordner

# Move file to folder
!verschieben 1 1

# Share a file with expiration
!teilen 1 --tage 7 --passwort geheim

# Search for files
!suche bericht

# View favorites
!favoriten

# Toggle favorite
!fav 1

# View trash
!papierkorb

# Restore from trash
!wiederherstellen 1
```

## Environment Variables

```env
# Server
PORT=3323

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#storage:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Storage Backend
STORAGE_BACKEND_URL=http://localhost:3016
STORAGE_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-storage-bot/Dockerfile -t matrix-storage-bot services/matrix-storage-bot

# Run
docker run -p 3323:3323 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e STORAGE_BACKEND_URL=http://storage-backend:3016 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-storage-bot-data:/app/data \
  matrix-storage-bot
```

## Health Check

```bash
curl http://localhost:3323/health
```

## Storage Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/files` | GET | List files |
| `/api/v1/files/:id` | GET | Get file details |
| `/api/v1/files/:id/download` | GET | Get download URL |
| `/api/v1/files/:id` | PATCH | Rename file |
| `/api/v1/files/:id/move` | PATCH | Move file |
| `/api/v1/files/:id` | DELETE | Delete file |
| `/api/v1/files/:id/favorite` | POST | Toggle favorite |
| `/api/v1/folders` | GET | List folders |
| `/api/v1/folders` | POST | Create folder |
| `/api/v1/folders/:id` | DELETE | Delete folder |
| `/api/v1/folders/:id/favorite` | POST | Toggle favorite |
| `/api/v1/shares` | GET | List shares |
| `/api/v1/shares` | POST | Create share |
| `/api/v1/shares/:id` | DELETE | Delete share |
| `/api/v1/search` | GET | Search files/folders |
| `/api/v1/favorites` | GET | Get favorites |
| `/api/v1/trash` | GET | List trash |
| `/api/v1/trash/:id/restore` | POST | Restore from trash |
| `/api/v1/trash` | DELETE | Empty trash |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!dateien` or `!ordner` to get a list
2. Bot stores the list internally for the user
3. User can reference items by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!datei 3` - Show details for file #3
- `!download 1` - Get download link for file #1
- `!dateien 2` - List files in folder #2
- `!verschieben 1 3` - Move file #1 to folder #3
