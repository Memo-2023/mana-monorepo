# @manacore/matrix-bot-common

Shared utilities and base classes for Matrix bots.

## Purpose

This package consolidates common code patterns found across all 19 Matrix bots:

- ~4,000 lines of duplicate code reduced to shared utilities
- Consistent behavior across all bots
- Easier maintenance and updates
- Type-safe helpers for common patterns

## Available Components

### BaseMatrixService

Abstract base class that handles Matrix client lifecycle:

```typescript
import { BaseMatrixService, MatrixBotConfig, MatrixRoomEvent } from '@manacore/matrix-bot-common';

@Injectable()
export class MyBotService extends BaseMatrixService {
	constructor(configService: ConfigService) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get('matrix.homeserverUrl'),
			accessToken: this.configService.get('matrix.accessToken'),
			storagePath: this.configService.get('matrix.storagePath'),
			allowedRooms: this.configService.get('matrix.allowedRooms') || [],
		};
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	) {
		if (message === '!hello') {
			await this.sendReply(roomId, event, 'Hello!');
		}
	}

	// Optional: Handle voice messages
	protected async handleAudioMessage(roomId: string, event: MatrixRoomEvent, sender: string) {
		// Transcribe and process
	}

	// Optional: Send intro on room join
	protected getIntroductionMessage(): string | null {
		return 'Hello! I am a bot.';
	}
}
```

**Provides:**

- `onModuleInit()` - Client setup, storage, auto-join
- `onModuleDestroy()` - Graceful shutdown
- `sendMessage(roomId, message)` - Send markdown message
- `sendReply(roomId, event, message)` - Reply to event
- `sendNotice(roomId, message)` - Non-highlighted message
- `downloadMedia(mxcUrl)` - Download from Matrix
- `uploadMedia(buffer, contentType, filename)` - Upload to Matrix

### HealthController

Shared health endpoint:

```typescript
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';

@Module({
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-todo-bot')],
})
export class AppModule {}
```

Returns:

```json
{
	"status": "ok",
	"service": "matrix-todo-bot",
	"timestamp": "2026-02-01T12:00:00.000Z",
	"uptime": 3600
}
```

### MatrixMessageService

Injectable service for message operations:

```typescript
import { MatrixMessageService } from '@manacore/matrix-bot-common';

@Injectable()
export class MyService {
	constructor(private messageService: MatrixMessageService) {}

	async doSomething(client: MatrixClient, roomId: string) {
		await this.messageService.sendMessage(client, roomId, '**Bold** message');
		await this.messageService.sendReaction(client, roomId, eventId, '👍');
		await this.messageService.editMessage(client, roomId, eventId, 'Updated text');
	}
}
```

### KeywordCommandDetector

Natural language command detection:

```typescript
import { KeywordCommandDetector, COMMON_KEYWORDS } from '@manacore/matrix-bot-common';

const detector = new KeywordCommandDetector([
	...COMMON_KEYWORDS, // hilfe, help, status, etc.
	{ keywords: ['liste', 'list', 'zeige'], command: 'list' },
	{ keywords: ['neu', 'new', 'erstelle'], command: 'create' },
]);

const command = detector.detect('zeige mir alles'); // Returns 'list'
const command2 = detector.detect('random text'); // Returns null
```

### Markdown Utilities

```typescript
import { markdownToHtml, formatNumberedList, formatBulletList } from '@manacore/matrix-bot-common';

const html = markdownToHtml('**bold** and *italic*');
// '<strong>bold</strong> and <em>italic</em>'

const list = formatNumberedList(items, (item, i) => `${item.name} - ${item.status}`);
// '1. Item A - active\n2. Item B - done'
```

### SessionHelper

Type-safe session data wrapper:

```typescript
import { SessionHelper } from '@manacore/matrix-bot-common';

interface MySessionData {
	currentItemId: string;
	selectedModel: string;
	itemList: string[];
}

const session = new SessionHelper<MySessionData>(sessionService, matrixUserId);

session.set('currentItemId', 'abc123');
const itemId = session.get('currentItemId'); // string | null
session.delete('currentItemId');

if (session.isLoggedIn()) {
	const token = session.getToken();
}
```

### UserListMapper

Number-based reference system:

```typescript
import { UserListMapper } from '@manacore/matrix-bot-common';

const mapper = new UserListMapper<Contact>();

// After listing contacts to user
mapper.setList(userId, contacts);

// User says "!select 3"
const contact = mapper.getByNumber(userId, 3);

// For items with id field
import { UserIdListMapper } from '@manacore/matrix-bot-common';
const idMapper = new UserIdListMapper<{ id: string; name: string }>();
const itemId = idMapper.getIdByNumber(userId, 2);
```

## Migration Guide

### Before (duplicate code in each bot)

```typescript
// matrix.service.ts - 50+ lines duplicated across 12 bots
private markdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // ...
}

private async sendReply(roomId: string, event: any, message: string) {
  const reply = RichReply.createFor(roomId, event, message, this.markdownToHtml(message));
  reply.msgtype = 'm.text';
  await this.client.sendMessage(roomId, reply);
}
```

### After (using shared package)

```typescript
import { markdownToHtml } from '@manacore/matrix-bot-common';

// Or extend BaseMatrixService which includes sendReply()
await this.sendReply(roomId, event, message);
```

## Installation

```bash
pnpm --filter matrix-xxx-bot add @manacore/matrix-bot-common
```

## File Structure

```
packages/matrix-bot-common/
├── src/
│   ├── index.ts              # Main exports
│   ├── base/
│   │   ├── base-matrix.service.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── index.ts
│   ├── message/
│   │   ├── message.service.ts
│   │   └── index.ts
│   ├── markdown/
│   │   ├── markdown-formatter.ts
│   │   └── index.ts
│   ├── keywords/
│   │   ├── keyword-detector.ts
│   │   └── index.ts
│   ├── session/
│   │   ├── session-helper.ts
│   │   └── index.ts
│   └── list-mapper/
│       ├── list-mapper.ts
│       └── index.ts
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Development

```bash
# Type check
pnpm --filter @manacore/matrix-bot-common type-check

# Add to a bot
pnpm --filter matrix-xxx-bot add @manacore/matrix-bot-common
```
