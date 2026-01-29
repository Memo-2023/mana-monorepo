# Mana Notify Service

Central notification microservice for email, push, Matrix, and webhook notifications across all ManaCore apps.

## Overview

- **Port**: 3040
- **Technology**: NestJS + BullMQ + Drizzle ORM + PostgreSQL + Redis
- **Purpose**: Unified notification API with template support and delivery tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Consumer Apps                                │
│   Auth │ Calendar │ Chat │ Picture │ Zitare │ ...          │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              mana-notify (Port 3040)                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Notification│  │ Template    │  │ Preferences │         │
│  │ API         │  │ Engine      │  │ Manager     │         │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘         │
│         │                │                                  │
│         ▼                ▼                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │           BullMQ Job Queues                   │          │
│  │  Email │ Push │ Matrix │ Webhook              │          │
│  └──────────────────────────────────────────────┘          │
│         │         │         │         │                    │
│         ▼         ▼         ▼         ▼                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Brevo   │ │ Expo    │ │ Matrix  │ │ HTTP    │          │
│  │ SMTP    │ │ Push    │ │ API     │ │ Client  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Development

```bash
# 1. Start PostgreSQL and Redis (from monorepo root)
pnpm docker:up

# 2. Install dependencies
pnpm install

# 3. Push database schema
pnpm db:push

# 4. Start in development mode
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

## API Endpoints

### Notifications (Service-Key Auth: X-Service-Key header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/send` | Send notification immediately |
| POST | `/api/v1/notifications/schedule` | Schedule notification for later |
| POST | `/api/v1/notifications/batch` | Send multiple notifications |
| GET | `/api/v1/notifications/:id` | Get notification status |
| DELETE | `/api/v1/notifications/:id` | Cancel pending notification |

### Templates (Service-Key Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | List all templates |
| GET | `/api/v1/templates/:slug` | Get template by slug |
| POST | `/api/v1/templates` | Create custom template |
| PUT | `/api/v1/templates/:slug` | Update template |
| DELETE | `/api/v1/templates/:slug` | Delete custom template |
| POST | `/api/v1/templates/:slug/preview` | Preview rendered template |
| POST | `/api/v1/templates/preview` | Preview custom template |

### Devices (JWT Auth: Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/devices/register` | Register push device |
| GET | `/api/v1/devices` | List user's devices |
| DELETE | `/api/v1/devices/:id` | Unregister device |

### Preferences (JWT Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/preferences` | Get user preferences |
| PUT | `/api/v1/preferences` | Update preferences |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Usage Examples

### Send Email

```bash
curl -X POST http://localhost:3040/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-Service-Key: your-service-key" \
  -d '{
    "channel": "email",
    "appId": "auth",
    "template": "auth-password-reset",
    "recipient": "user@example.com",
    "data": {
      "resetUrl": "https://mana.how/reset?token=xxx",
      "userName": "Max"
    }
  }'
```

### Send Push Notification

```bash
curl -X POST http://localhost:3040/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-Service-Key: your-service-key" \
  -d '{
    "channel": "push",
    "appId": "calendar",
    "userId": "user-uuid",
    "subject": "Erinnerung",
    "body": "Meeting in 15 Minuten",
    "data": { "eventId": "event-uuid" }
  }'
```

### Register Device (User JWT)

```bash
curl -X POST http://localhost:3040/api/v1/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_JWT" \
  -d '{
    "pushToken": "ExponentPushToken[xxx]",
    "platform": "ios",
    "deviceName": "iPhone 15"
  }'
```

### Schedule Notification

```bash
curl -X POST http://localhost:3040/api/v1/notifications/schedule \
  -H "Content-Type: application/json" \
  -H "X-Service-Key: your-service-key" \
  -d '{
    "channel": "email",
    "appId": "calendar",
    "template": "calendar-reminder",
    "recipient": "user@example.com",
    "data": {
      "eventTitle": "Team Meeting",
      "eventTime": "14:00 Uhr",
      "eventUrl": "https://calendar.mana.how/event/xxx"
    },
    "scheduledFor": "2024-12-20T13:45:00Z"
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3040 | API port |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `REDIS_HOST` | localhost | Redis host for BullMQ |
| `REDIS_PORT` | 6379 | Redis port |
| `SERVICE_KEY` | dev-service-key | Internal service authentication key |
| `MANA_CORE_AUTH_URL` | http://localhost:3001 | Auth service URL for JWT validation |
| `SMTP_HOST` | smtp-relay.brevo.com | SMTP server host |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_USER` | - | SMTP username |
| `SMTP_PASSWORD` | - | SMTP password |
| `SMTP_FROM` | ManaCore <noreply@mana.how> | Default sender address |
| `EXPO_ACCESS_TOKEN` | - | Expo push notification access token |
| `MATRIX_HOMESERVER_URL` | - | Matrix homeserver URL |
| `MATRIX_ACCESS_TOKEN` | - | Matrix bot access token |
| `RATE_LIMIT_EMAIL_PER_MINUTE` | 10 | Email rate limit |
| `RATE_LIMIT_PUSH_PER_MINUTE` | 100 | Push notification rate limit |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint

# Database commands
pnpm db:push       # Push schema to database
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio
```

## Database Schema

The service uses its own schema (`notify`) in the shared ManaCore database:

- `notify.notifications` - Notification records with status tracking
- `notify.templates` - Email/push templates with Handlebars support
- `notify.devices` - Registered push notification devices
- `notify.preferences` - User notification preferences
- `notify.delivery_logs` - Delivery attempt logs

## Default Templates

| Slug | Channel | Purpose |
|------|---------|---------|
| `auth-password-reset` | email | Password reset email |
| `auth-verification` | email | Email verification |
| `auth-welcome` | email | Welcome email |
| `calendar-reminder` | email | Calendar event reminder |

## Notification Channels

### Email (Brevo SMTP)
- Uses Nodemailer with Brevo SMTP relay
- Supports HTML and plain text
- Template rendering with Handlebars

### Push (Expo)
- Uses Expo Server SDK
- Supports iOS, Android, and web
- Batch sending with automatic chunking

### Matrix
- Direct Matrix API integration
- Supports formatted (HTML) messages
- For bot notifications

### Webhook
- HTTP POST/PUT to external URLs
- Configurable headers and timeout
- Retry with exponential backoff

## Integration with Other Services

### Usage from NestJS Backend

```typescript
// Direct HTTP call
const response = await fetch('http://mana-notify:3040/api/v1/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Service-Key': process.env.MANA_NOTIFY_SERVICE_KEY,
  },
  body: JSON.stringify({
    channel: 'email',
    appId: 'calendar',
    template: 'calendar-reminder',
    recipient: user.email,
    data: { eventTitle, eventTime },
  }),
});
```

### Using the Client SDK

```typescript
import { NotifyClient } from '@manacore/notify-client';

const notify = new NotifyClient({
  serviceUrl: 'http://localhost:3040',
  serviceKey: process.env.MANA_NOTIFY_SERVICE_KEY,
  appId: 'calendar',
});

// Send email
await notify.sendEmail({
  to: 'user@example.com',
  template: 'calendar-reminder',
  data: { eventTitle: 'Meeting', eventTime: '14:00' },
});

// Send push to user
await notify.sendPush({
  userId: 'user-uuid',
  title: 'Reminder',
  body: 'Meeting in 15 minutes',
  data: { eventId: 'xxx' },
});
```

## Project Structure

```
services/mana-notify/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── config/
│   │   └── configuration.ts       # App configuration
│   ├── db/
│   │   ├── schema/                # Drizzle schemas
│   │   ├── database.module.ts     # Database provider
│   │   └── connection.ts          # DB connection
│   ├── common/
│   │   ├── filters/               # Exception filters
│   │   └── guards/                # Auth guards
│   ├── queue/
│   │   ├── queue.module.ts        # BullMQ setup
│   │   └── processors/            # Channel processors
│   ├── channels/
│   │   ├── email/                 # Nodemailer service
│   │   ├── push/                  # Expo push service
│   │   ├── matrix/                # Matrix API service
│   │   └── webhook/               # HTTP webhook service
│   ├── notifications/             # Core notification API
│   ├── templates/                 # Template engine
│   │   └── defaults/              # Default HBS templates
│   ├── devices/                   # Device registration
│   ├── preferences/               # User preferences
│   ├── health/                    # Health check
│   └── metrics/                   # Prometheus metrics
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── CLAUDE.md
```

## Troubleshooting

### Email not sending

1. Check SMTP credentials in environment
2. Verify SMTP host/port settings
3. Check logs for error messages

### Push notifications failing

1. Verify Expo push tokens are valid
2. Check Expo access token is set
3. Ensure devices are registered

### Redis connection issues

```bash
# Check Redis
docker exec mana-notify-redis-dev redis-cli ping

# Check queue status
curl http://localhost:3040/health
```

## Metrics

Available at `/metrics` in Prometheus format:

- `mana_notify_notifications_sent_total` - Total notifications sent
- `mana_notify_notifications_failed_total` - Total failed notifications
- `mana_notify_emails_sent_total` - Emails sent by template
- `mana_notify_push_sent_total` - Push notifications by platform
- `mana_notify_notification_latency_seconds` - Processing latency
