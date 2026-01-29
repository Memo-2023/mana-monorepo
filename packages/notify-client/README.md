# @manacore/notify-client

Client SDK for the mana-notify notification service.

## Installation

```bash
pnpm add @manacore/notify-client
```

## Usage

### Basic Usage

```typescript
import { NotifyClient } from '@manacore/notify-client';

const notify = new NotifyClient({
  serviceUrl: 'http://localhost:3040',
  serviceKey: process.env.MANA_NOTIFY_SERVICE_KEY,
  appId: 'your-app-id',
});

// Send email
await notify.sendEmail({
  to: 'user@example.com',
  template: 'auth-password-reset',
  data: { resetUrl: 'https://...', userName: 'Max' },
});

// Send push notification
await notify.sendPush({
  userId: 'user-uuid',
  title: 'New Message',
  body: 'You have a new message',
  data: { messageId: 'xxx' },
});

// Send to specific token
await notify.sendPush({
  token: 'ExponentPushToken[xxx]',
  title: 'Hello',
  body: 'World',
});

// Schedule notification
await notify.scheduleEmail({
  to: 'user@example.com',
  template: 'calendar-reminder',
  data: { eventTitle: 'Meeting' },
  scheduledFor: new Date('2024-12-20T13:45:00Z'),
});
```

### NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotifyModule } from '@manacore/notify-client/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NotifyModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        serviceUrl: config.get('MANA_NOTIFY_URL', 'http://localhost:3040'),
        serviceKey: config.get('MANA_NOTIFY_SERVICE_KEY'),
        appId: config.get('APP_ID'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

Then inject the client:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { NOTIFY_CLIENT, NotifyClient } from '@manacore/notify-client/nestjs';

@Injectable()
export class NotificationService {
  constructor(@Inject(NOTIFY_CLIENT) private readonly notify: NotifyClient) {}

  async sendWelcomeEmail(email: string, name: string) {
    await this.notify.sendEmail({
      to: email,
      template: 'auth-welcome',
      data: { userName: name },
    });
  }
}
```

## API Reference

### NotifyClient

#### Constructor

```typescript
new NotifyClient({
  serviceUrl: string;    // mana-notify service URL
  serviceKey: string;    // Service authentication key
  appId: string;         // Your application ID
  timeout?: number;      // Request timeout in ms (default: 30000)
});
```

#### Methods

##### Email

- `sendEmail(options)` - Send an email immediately
- `scheduleEmail(options)` - Schedule an email for later

##### Push Notifications

- `sendPush(options)` - Send a push notification
- `schedulePush(options)` - Schedule a push notification

##### Other Channels

- `sendMatrix(options)` - Send a Matrix message
- `sendWebhook(options)` - Send a webhook

##### Batch & Management

- `sendBatch(notifications)` - Send multiple notifications
- `getNotification(id)` - Get notification status
- `cancelNotification(id)` - Cancel a pending notification

##### Templates

- `listTemplates(appId?)` - List available templates
- `getTemplate(slug, locale?)` - Get a template
- `previewTemplate(slug, data, locale?)` - Preview a rendered template

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MANA_NOTIFY_URL` | mana-notify service URL |
| `MANA_NOTIFY_SERVICE_KEY` | Service authentication key |
| `APP_ID` | Your application ID |
