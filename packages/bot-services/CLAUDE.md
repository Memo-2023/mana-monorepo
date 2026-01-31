# @manacore/bot-services

Shared business logic services for Matrix bots and the Gateway.

## Purpose

This package provides **transport-agnostic** services that contain all business logic for the Matrix bot ecosystem. Services in this package:

- Have no Matrix-specific code
- Can be used by individual bots OR the unified Gateway
- Support pluggable storage (file-based, in-memory, database)
- Are fully testable in isolation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     @manacore/bot-services                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ TodoService │  │ CalendarSvc │  │  AiService  │  │ ClockService│   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│  Pure business logic - no Matrix code!                                  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Gateway  │    │ Todo Bot │    │  CLI     │
        │ (Matrix) │    │ (Matrix) │    │  Tool    │
        └──────────┘    └──────────┘    └──────────┘
```

## Available Services

### Business Logic Services

| Service | Storage | Description |
|---------|---------|-------------|
| `TodoService` | File (JSON) | Task management with projects, priorities, dates |
| `CalendarService` | File (JSON) | Events, calendars, reminders |
| `AiService` | In-memory | Ollama LLM integration, chat sessions, vision |
| `ClockService` | External API | Timers, alarms, world clocks |

### Infrastructure Services

| Service | Storage | Description |
|---------|---------|-------------|
| `SessionService` | In-memory | User authentication via mana-core-auth |
| `TranscriptionService` | External API | Speech-to-text via mana-stt service |

### Placeholder Services (to be implemented)

| Service | Description |
|---------|-------------|
| `NutritionService` | Meal tracking |
| `QuotesService` | Daily quotes |
| `StatsService` | Analytics reports |
| `DocsService` | Documentation generation |

## Usage

### In NestJS (Bot or Gateway)

```typescript
import { Module } from '@nestjs/common';
import {
  TodoModule,
  CalendarModule,
  AiModule,
  ClockModule,
  SessionModule,
  TranscriptionModule,
} from '@manacore/bot-services';

@Module({
  imports: [
    // File-based storage (default)
    TodoModule.register({ storagePath: './data/todos.json' }),
    CalendarModule.register({ storagePath: './data/calendar.json' }),

    // External services
    AiModule.register({ baseUrl: 'http://ollama:11434' }),
    ClockModule.register({ apiUrl: 'http://clock-backend:3017/api/v1' }),

    // Infrastructure services (use ConfigService by default)
    SessionModule.forRoot(),
    TranscriptionModule.forRoot(),
  ],
})
export class AppModule {}
```

### Session Service (Authentication)

```typescript
import { SessionService } from '@manacore/bot-services';

// Login a Matrix user
const result = await sessionService.login(
  '@user:matrix.org',
  'email@example.com',
  'password'
);

if (result.success) {
  // Get token for API calls
  const token = sessionService.getToken('@user:matrix.org');

  // Check if logged in
  const isLoggedIn = sessionService.isLoggedIn('@user:matrix.org');
}

// Logout
sessionService.logout('@user:matrix.org');

// Store custom session data
sessionService.setSessionData('@user:matrix.org', 'currentConversationId', 'abc123');
const convId = sessionService.getSessionData<string>('@user:matrix.org', 'currentConversationId');
```

### Transcription Service (Speech-to-Text)

```typescript
import { TranscriptionService } from '@manacore/bot-services';

// Transcribe audio buffer
const text = await transcriptionService.transcribe(audioBuffer, { language: 'de' });

// Get full response with metadata
const result = await transcriptionService.transcribeWithMetadata(audioBuffer);
console.log(result.text, result.language, result.model);

// Health check
const isHealthy = await transcriptionService.checkHealth();
```

### Direct Service Usage

```typescript
import { TodoService } from '@manacore/bot-services/todo';
import { AiService } from '@manacore/bot-services/ai';

// Create task
const task = await todoService.createTask('@user:matrix.org', {
  title: 'Buy groceries',
  priority: 2,
  dueDate: '2025-01-30',
});

// AI chat
const response = await aiService.chatSimple('@user:matrix.org', 'What is TypeScript?');
```

### Custom Storage Provider

```typescript
import { TodoModule, StorageProvider, TodoData } from '@manacore/bot-services';

// PostgreSQL storage example
class PostgresTodoStorage implements StorageProvider<TodoData> {
  async load(): Promise<TodoData> {
    // Load from database
  }
  async save(data: TodoData): Promise<void> {
    // Save to database
  }
}

// Use custom storage
TodoModule.forRoot(new PostgresTodoStorage());
```

## Input Parsing

Services include German-language natural input parsing:

### Todo

```typescript
const parsed = todoService.parseTaskInput('Einkaufen !p1 @morgen #haushalt');
// { title: 'Einkaufen', priority: 1, dueDate: '2025-01-30', project: 'haushalt' }
```

### Calendar

```typescript
const parsed = calendarService.parseEventInput('Meeting morgen um 14:30');
// { title: 'Meeting', startTime: Date, endTime: Date, isAllDay: false }
```

### Clock

```typescript
const seconds = clockService.parseDuration('1h30m');  // 5400
const time = clockService.parseAlarmTime('14 Uhr 30'); // '14:30:00'
```

## Development

```bash
# Type check
pnpm --filter @manacore/bot-services type-check

# Install in a bot
pnpm --filter matrix-todo-bot add @manacore/bot-services
```

## Adding New Services

1. Create directory: `src/{service}/`
2. Add files:
   - `types.ts` - Interfaces and types
   - `{service}.service.ts` - Business logic
   - `{service}.module.ts` - NestJS module
   - `index.ts` - Exports
3. Export from `src/index.ts`
4. Update `package.json` exports

## File Structure

```
packages/bot-services/
├── src/
│   ├── index.ts              # Main exports
│   ├── shared/
│   │   ├── types.ts          # Common types
│   │   ├── storage.ts        # Storage providers
│   │   ├── utils.ts          # Utility functions
│   │   └── index.ts
│   ├── todo/
│   ├── calendar/
│   ├── ai/
│   ├── clock/
│   ├── session/              # NEW: User authentication
│   │   ├── types.ts
│   │   ├── session.service.ts
│   │   ├── session.module.ts
│   │   └── index.ts
│   ├── transcription/        # NEW: Speech-to-text
│   │   ├── types.ts
│   │   ├── transcription.service.ts
│   │   ├── transcription.module.ts
│   │   └── index.ts
│   └── ...
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Migrating Bots to Shared Services

To migrate a bot from local services to shared services:

### 1. Add dependency

```bash
# In package.json
"dependencies": {
  "@manacore/bot-services": "workspace:*",
  ...
}
```

### 2. Update module imports

```typescript
// bot.module.ts - BEFORE
import { SessionModule } from '../session/session.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
  imports: [SessionModule, TranscriptionModule],
})

// bot.module.ts - AFTER
import { SessionModule, TranscriptionModule } from '@manacore/bot-services';

@Module({
  imports: [SessionModule.forRoot(), TranscriptionModule.forRoot()],
})
```

### 3. Update service imports

```typescript
// matrix.service.ts - BEFORE
import { SessionService } from '../session/session.service';
import { TranscriptionService } from '../transcription/transcription.service';

// matrix.service.ts - AFTER
import { SessionService, TranscriptionService } from '@manacore/bot-services';
```

### 4. Delete local modules

```bash
rm -rf src/session/
rm -rf src/transcription/
```

### Migrated Bots

| Bot | SessionService | TranscriptionService |
|-----|----------------|---------------------|
| matrix-todo-bot | - | ✅ |
| matrix-picture-bot | ✅ | - |
| matrix-clock-bot | - | ✅ |
| matrix-zitare-bot | ✅ | ✅ |
| matrix-chat-bot | TODO | - |
| matrix-contacts-bot | TODO | - |
| matrix-nutriphi-bot | TODO | TODO |
| matrix-project-doc-bot | - | TODO |
| ... | ... | ... |
