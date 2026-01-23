# Telegram Stats Bot - Claude Code Guidelines

## Overview

Telegram Stats Bot delivers analytics and statistics from Umami (stats.mana.how) via Telegram. It provides both automated scheduled reports and on-demand commands.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Scheduling**: @nestjs/schedule
- **Analytics**: Umami API

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types
```

## Project Structure

```
services/telegram-stats-bot/
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & website IDs
│   ├── bot/
│   │   ├── bot.module.ts
│   │   ├── bot.service.ts    # Send messages to Telegram
│   │   └── bot.update.ts     # Command handlers
│   ├── umami/
│   │   ├── umami.module.ts
│   │   └── umami.service.ts  # Umami API client
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.service.ts  # Data aggregation
│   │   └── formatters.ts     # Message formatters
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts  # User count from auth DB
│   └── scheduler/
│       ├── scheduler.module.ts
│       └── report.scheduler.ts  # Cron jobs
└── Dockerfile
```

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/start` | Show help |
| `/stats` | Overview of all apps (last 30 days) |
| `/today` | Today's statistics |
| `/week` | This week's statistics |
| `/realtime` | Active visitors right now |
| `/users` | Registered user statistics |
| `/help` | Show available commands |

## Scheduled Reports

| Report | Schedule | Timezone |
|--------|----------|----------|
| Daily | 09:00 | Europe/Berlin |
| Weekly | Monday 09:00 | Europe/Berlin |

## Environment Variables

```env
# Server
PORT=3300
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Umami
UMAMI_API_URL=http://umami:3000
UMAMI_USERNAME=admin
UMAMI_PASSWORD=xxx

# Database (optional, for user counts)
DATABASE_URL=postgresql://...
```

## Adding New Website IDs

Edit `src/config/configuration.ts`:

```typescript
export const WEBSITE_IDS: Record<string, string> = {
  'new-app-webapp': 'uuid-from-umami',
};

export const DISPLAY_NAMES: Record<string, string> = {
  'new-app-webapp': 'New App',
};
```

## Docker

```bash
# Build locally
docker build -f services/telegram-stats-bot/Dockerfile -t telegram-stats-bot .

# Run
docker run -p 3300:3300 \
  -e TELEGRAM_BOT_TOKEN=xxx \
  -e TELEGRAM_CHAT_ID=xxx \
  -e UMAMI_API_URL=http://umami:3000 \
  -e UMAMI_USERNAME=admin \
  -e UMAMI_PASSWORD=xxx \
  telegram-stats-bot
```

## Health Check

```bash
curl http://localhost:3300/health
```

## Testing Bot Commands

In Telegram, send commands to your bot:

```
/start     # Shows help message
/today     # Gets today's stats
/week      # Gets weekly stats
/realtime  # Shows active visitors
```

## Key Files

| File | Purpose |
|------|---------|
| `src/config/configuration.ts` | All Umami website IDs |
| `src/analytics/formatters.ts` | Report formatting |
| `src/scheduler/report.scheduler.ts` | Cron job definitions |
| `src/umami/umami.service.ts` | Umami API authentication |
