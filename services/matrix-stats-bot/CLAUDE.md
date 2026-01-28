# Matrix Stats Bot - Claude Code Guidelines

## Overview

Matrix Stats Bot delivers analytics from Umami (self-hosted) via Matrix. GDPR-compliant replacement for telegram-stats-bot.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Analytics**: Umami API
- **Scheduling**: @nestjs/schedule

## Commands

```bash
pnpm install
pnpm start:dev        # Development with hot reload
pnpm build            # Production build
pnpm type-check       # TypeScript check
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!stats` | Overview of all apps (30 days) |
| `!today` | Today's statistics |
| `!week` | This week's statistics |
| `!realtime` | Active visitors right now |
| `!users` | Registered user statistics |
| `!help` | Show available commands |

## Scheduled Reports

| Report | Schedule | Timezone |
|--------|----------|----------|
| Daily | 09:00 | Europe/Berlin |
| Weekly | Monday 09:00 | Europe/Berlin |

## Environment Variables

```env
PORT=3312
TZ=Europe/Berlin

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_REPORT_ROOM_ID=!roomid:mana.how

# Umami
UMAMI_API_URL=http://umami:3000
UMAMI_USERNAME=admin
UMAMI_PASSWORD=xxx

# Database (for user counts)
DATABASE_URL=postgresql://...
```

## Health Check

```bash
curl http://localhost:3312/health
```
