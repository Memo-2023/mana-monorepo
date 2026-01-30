# Matrix Contacts Bot - Claude Code Guidelines

## Overview

Matrix Contacts Bot provides contact management via Matrix chat. It integrates with the Contacts backend for full CRUD operations, search, favorites, and archiving.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Contacts API (port 3015)
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
services/matrix-contacts-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3320)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── contacts/
│   │   ├── contacts.module.ts
│   │   └── contacts.service.ts # Contacts Backend API client
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
| `!kontakte` | contacts, liste | List all contacts |
| `!suche [text]` | search | Search contacts |
| `!favoriten` | favorites | Show favorites |
| `!kontakt [nr]` | contact, details | Show contact details |
| `!neu Vorname [Nachname]` | new, add | Create new contact |
| `!edit [nr] [feld] [wert]` | bearbeiten | Edit contact field |
| `!loeschen [nr]` | delete | Delete contact |
| `!fav [nr]` | favorit | Toggle favorite |
| `!archiv [nr]` | archive | Toggle archive |
| `!login email pass` | - | Login |
| `!logout` | - | Logout |
| `!status` | - | Bot status |

## Editable Fields

| Field | Aliases | Description |
|-------|---------|-------------|
| `email` | - | Email address |
| `phone` | telefon | Phone number |
| `mobile` | mobil, handy | Mobile number |
| `company` | firma | Company name |
| `job` | jobtitle, beruf | Job title |
| `website` | web | Website URL |
| `street` | strasse | Street address |
| `city` | stadt | City |
| `zip` | plz | Postal code |
| `country` | land | Country |
| `notes` | notizen | Notes |
| `birthday` | geburtstag | Birthday (YYYY-MM-DD) |

## Example Usage

```
# Create a contact
!neu Max Mustermann

# Add email
!edit 1 email max@example.com

# Add phone
!edit 1 phone +49 123 456789

# Mark as favorite
!fav 1

# Search
!suche Muster
```

## Environment Variables

```env
# Server
PORT=3320

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#contacts:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Contacts Backend
CONTACTS_BACKEND_URL=http://localhost:3015
CONTACTS_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-contacts-bot/Dockerfile -t matrix-contacts-bot services/matrix-contacts-bot

# Run
docker run -p 3320:3320 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e CONTACTS_BACKEND_URL=http://contacts-backend:3015 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-contacts-bot-data:/app/data \
  matrix-contacts-bot
```

## Health Check

```bash
curl http://localhost:3320/health
```

## Getting a Matrix Access Token

```bash
# Create bot user first, then login
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "contacts-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Contacts Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/contacts` | GET | List contacts with filters |
| `/api/v1/contacts` | POST | Create contact |
| `/api/v1/contacts/:id` | GET | Get contact details |
| `/api/v1/contacts/:id` | PATCH | Update contact |
| `/api/v1/contacts/:id` | DELETE | Delete contact |
| `/api/v1/contacts/:id/favorite` | POST | Toggle favorite |
| `/api/v1/contacts/:id/archive` | POST | Toggle archive |

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!kontakte` or `!suche` to get a list
2. Bot stores the list internally for the user
3. User can reference contacts by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!kontakt 3` - Show details for contact #3 in the list
- `!edit 1 email new@email.com` - Edit contact #1
- `!fav 2` - Toggle favorite for contact #2
