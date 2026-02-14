# Matrix Onboarding Bot - Claude Code Guidelines

## Overview

Matrix Onboarding Bot guides new users through a profile setup process. It collects display name, interests, and language preference, storing them in mana-core-auth's globalSettings.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk via @manacore/matrix-bot-common
- **Auth**: mana-core-auth (Settings API)
- **Sessions**: Redis via @manacore/bot-services

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
services/matrix-onboarding-bot/
├── src/
│   ├── main.ts               # Application entry point (port 4020)
│   ├── app.module.ts         # Root module
│   ├── config/
│   │   └── configuration.ts  # Configuration & messages (de/en)
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   └── onboarding/
│       ├── onboarding.module.ts
│       ├── onboarding.service.ts  # API client for mana-core-auth
│       └── state-machine.ts       # Onboarding flow state machine
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `!start` | Start onboarding (or restart if completed) |
| `!profile` | Show current profile |
| `!edit name Max` | Change display name |
| `!edit interests KI, Musik` | Change interests |
| `!edit language de` | Change language (de/en) |
| `!skip` | Skip current question (if allowed) |
| `!cancel` | Cancel onboarding |
| `!help` | Show help text |

## Onboarding Flow

```
IDLE → NAME → INTERESTS → LANGUAGE → SUMMARY → COMPLETED
               ↓           ↓
             SKIP        SKIP
```

1. **NAME** (required): Ask for display name
2. **INTERESTS** (skippable): Ask for interests (comma-separated)
3. **LANGUAGE** (skippable): Ask for language preference (de/en)
4. **SUMMARY**: Show profile and ask for confirmation
5. **COMPLETED**: Save to mana-core-auth and finish

## Data Storage

Profile data is stored in mana-core-auth's `user_settings.globalSettings`:

```typescript
interface GlobalSettings {
  // ... existing fields
  displayName?: string;       // From onboarding
  interests?: string[];       // From onboarding
  onboardingCompleted?: boolean;
}
```

## Environment Variables

```env
# Server
PORT=4020

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#onboarding:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# mana-core-auth
MANA_CORE_AUTH_URL=http://localhost:3001
MANA_CORE_SERVICE_KEY=your-service-key

# Redis (for session storage)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
```

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/settings` | GET | Get user settings |
| `/api/v1/settings/global` | PATCH | Update global settings |

## Docker

```bash
# Build
docker build -f services/matrix-onboarding-bot/Dockerfile -t matrix-onboarding-bot .

# Run
docker run -p 4020:4020 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e MANA_CORE_AUTH_URL=http://mana-auth:3001 \
  -e REDIS_HOST=redis \
  -v matrix-bots-data:/app/data \
  matrix-onboarding-bot
```

## Health Check

```bash
curl http://localhost:4020/health
```

## Authentication

The bot requires users to be logged in via Matrix-SSO-Link (shared Redis session).

1. User logs in via Matrix SSO link in another bot or web app
2. Session stored in Redis with Matrix user ID as key
3. Onboarding bot retrieves token from Redis
4. Token used to call mana-core-auth Settings API

## Example Dialog

```
Bot: Willkommen beim Onboarding!

     Ich helfe dir, dein Profil einzurichten.
     Wie mochtest du genannt werden?

User: Max

Bot: Hallo Max! Was sind deine Interessen?
     (z.B. Programmierung, Musik - durch Komma getrennt)
     Sag `!skip` zum Uberspringen.

User: KI, Gaming, Musik

Bot: Welche Sprache bevorzugst du?
     Antworte mit `de` fur Deutsch oder `en` fur Englisch.

User: de

Bot: **Dein Profil:**
     - Name: Max
     - Interessen: KI, Gaming, Musik
     - Sprache: Deutsch

     Ist das korrekt? (ja/nein)

User: ja

Bot: Perfekt! Dein Profil ist eingerichtet.
     Du kannst es jederzeit mit `!profile` anzeigen oder mit `!edit` andern.
```

## Localization

The bot supports German (de) and English (en). Messages are defined in `src/config/configuration.ts` under the `MESSAGES` object.

## State Machine

The `OnboardingStateMachine` class in `src/onboarding/state-machine.ts` is a pure function that:
- Takes current state + action
- Returns new state + message key
- Has no side effects

This makes it easy to test and reason about the flow.
