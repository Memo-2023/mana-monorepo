# Matrix Stats Bot - Claude Code Guidelines

## Overview

Matrix Stats Bot delivers analytics from Umami (self-hosted) via Matrix. GDPR-compliant replacement for telegram-stats-bot.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Analytics**: Umami API + Prometheus/VictoriaMetrics
- **Scheduling**: @nestjs/schedule

## Commands

```bash
pnpm install
pnpm start:dev        # Development with hot reload
pnpm build            # Production build
pnpm type-check       # TypeScript check
```

## Matrix Commands

### Personal Stats (requires login)

| Command | Description |
|---------|-------------|
| `!mystats` | Your personal statistics across all ManaCore apps |
| `!status` | Account status and credit balance |

### Global Analytics (Umami)

| Command | Description |
|---------|-------------|
| `!stats` | Overview of all apps (30 days) |
| `!today` | Today's statistics |
| `!week` | This week's statistics |
| `!realtime` | Active visitors right now |

### Infrastructure (Prometheus)

| Command | Description |
|---------|-------------|
| `!system` | Mac Mini status (CPU, RAM, Disk, Uptime) |
| `!services` | Backend service health (UP/DOWN) |
| `!traffic` | HTTP traffic & latency per service |
| `!db` | PostgreSQL & Redis status |
| `!growth` | User growth statistics |

### Account

| Command | Description |
|---------|-------------|
| `!login email password` | Login with ManaCore credentials |
| `!logout` | Logout from current session |
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

# Prometheus / VictoriaMetrics
PROMETHEUS_URL=http://victoriametrics:8428

# Database (for user counts)
DATABASE_URL=postgresql://...
```

## Health Check

```bash
curl http://localhost:3312/health
```
