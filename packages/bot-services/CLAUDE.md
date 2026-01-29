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

| Service | Storage | Description |
|---------|---------|-------------|
| `TodoService` | File (JSON) | Task management with projects, priorities, dates |
| `CalendarService` | File (JSON) | Events, calendars, reminders |
| `AiService` | In-memory | Ollama LLM integration, chat sessions, vision |
| `ClockService` | External API | Timers, alarms, world clocks |
| `NutritionService` | Placeholder | Meal tracking (to be implemented) |
| `QuotesService` | Placeholder | Daily quotes (to be implemented) |
| `StatsService` | Placeholder | Analytics reports (to be implemented) |
| `DocsService` | Placeholder | Documentation generation (to be implemented) |

## Usage

### In NestJS (Bot or Gateway)

```typescript
import { Module } from '@nestjs/common';
import { TodoModule, CalendarModule, AiModule, ClockModule } from '@manacore/bot-services';

@Module({
  imports: [
    // File-based storage (default)
    TodoModule.register({ storagePath: './data/todos.json' }),
    CalendarModule.register({ storagePath: './data/calendar.json' }),

    // External services
    AiModule.register({ baseUrl: 'http://ollama:11434' }),
    ClockModule.register({ apiUrl: 'http://clock-backend:3017/api/v1' }),
  ],
})
export class AppModule {}
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
│   │   ├── types.ts
│   │   ├── todo.service.ts
│   │   ├── todo.module.ts
│   │   └── index.ts
│   ├── calendar/
│   ├── ai/
│   ├── clock/
│   └── ...
├── package.json
├── tsconfig.json
└── CLAUDE.md
```
