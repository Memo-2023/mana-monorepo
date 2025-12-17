# Calendar Shared Package Agent

## Module Information

**Package:** `@calendar/shared`
**Type:** Shared TypeScript Package (Internal Monorepo Package)
**Location:** `apps/calendar/packages/shared`
**Purpose:** Shared types, utilities, and constants for the Calendar application

This package provides the common TypeScript types, utility functions, and constants used across all Calendar app modules (backend, web, mobile, landing). It ensures type safety and consistency across the entire Calendar application.

## Identity

I am the Calendar Shared Package Agent. I provide and maintain the foundational type definitions, utility functions, and constants that form the contract between all Calendar application layers. I ensure type consistency across backend APIs, web frontends, mobile apps, and landing pages.

## Expertise

- **Type Definitions**: TypeScript interfaces and types for Calendar domain entities
- **Date Utilities**: Pure date manipulation functions without external dependencies
- **Recurrence Logic**: RFC 5545 RRULE parsing and expansion utilities
- **Constants**: Shared configuration values, colors, timezones, and API routes
- **Cross-Platform Compatibility**: Types work across NestJS, SvelteKit, React Native, and Astro

## Code Structure

```
apps/calendar/packages/shared/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── calendar.ts     # Calendar entity, settings, view types
│   │   ├── event.ts        # Event entity, attendees, tags, metadata
│   │   ├── reminder.ts     # Reminder entity and presets
│   │   ├── share.ts        # Calendar sharing and permissions
│   │   ├── recurrence.ts   # Recurrence rules (RFC 5545)
│   │   ├── sync.ts         # External calendar sync types
│   │   └── index.ts        # Type exports
│   │
│   ├── utils/              # Pure utility functions
│   │   ├── date.ts         # Date manipulation (start/end of day/week/month/year)
│   │   ├── recurrence.ts   # RRULE parsing and event expansion
│   │   └── index.ts        # Utility exports
│   │
│   ├── constants/          # Shared constants
│   │   └── index.ts        # Colors, timezones, API routes, presets
│   │
│   └── index.ts            # Main entry point
│
├── package.json            # Package definition with named exports
└── tsconfig.json           # TypeScript configuration
```

## Key Patterns

### Type Organization

```typescript
// Entity types - Match database schemas exactly
export interface Calendar {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  isVisible: boolean;
  timezone: string;
  settings?: CalendarSettings | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Input types - For API requests
export interface CreateCalendarInput {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  timezone?: string;
  settings?: CalendarSettings;
}

// Update types - Partial updates
export interface UpdateCalendarInput {
  name?: string;
  description?: string | null;
  color?: string;
  // ... all optional
}
```

### JSON Metadata Types

```typescript
// JSONB column types
export interface CalendarSettings {
  defaultView?: CalendarViewType;
  weekStartsOn?: 0 | 1;
  showWeekNumbers?: boolean;
  defaultEventDuration?: number;
  defaultReminder?: number;
}

export interface EventMetadata {
  url?: string;
  conferenceUrl?: string;
  responsiblePerson?: ResponsiblePerson;
  attendees?: EventAttendee[];
  organizer?: string;
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];
  allDayDisplayMode?: AllDayDisplayMode;
  locationDetails?: LocationDetails;
}
```

### Date-Agnostic Types

```typescript
// Supports both Date objects and ISO strings
export interface CalendarEvent {
  startTime: Date | string;
  endTime: Date | string;
  createdAt: Date | string;
  // Backend returns strings, frontend can use Date objects
}
```

### Pure Date Utilities

```typescript
// No external dependencies (no date-fns, dayjs, etc.)
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
```

### Recurrence Rule Parsing

```typescript
// Parse RFC 5545 RRULE strings
export function parseRecurrenceRule(rrule: string): RecurrenceRule | null {
  // Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=2"
  const parts = rrule.split(';');
  // ...parse into RecurrenceRule object
}

// Expand recurring events into instances
export function expandRecurrence(
  event: CalendarEvent,
  startDate: Date,
  endDate: Date
): Date[] {
  // Generate all event instances in date range
}
```

### Type-Safe Constants

```typescript
export const CALENDAR_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
  // ...
] as const;

export const API_ROUTES = {
  HEALTH: '/api/v1/health',
  CALENDARS: '/api/v1/calendars',
  EVENTS: '/api/v1/events',
  // ...
} as const;
```

## Integration Points

### Backend (NestJS)

```typescript
// apps/calendar/apps/backend/src/calendar/calendar.service.ts
import { Calendar, CreateCalendarInput } from '@calendar/shared';

@Injectable()
export class CalendarService {
  async create(userId: string, input: CreateCalendarInput): Promise<Calendar> {
    // Types ensure request/response match
  }
}
```

### Web (SvelteKit)

```typescript
// apps/calendar/apps/web/src/lib/api/calendars.ts
import type { Calendar, CreateCalendarInput } from '@calendar/shared';
import { API_ROUTES } from '@calendar/shared/constants';

export async function createCalendar(
  data: CreateCalendarInput
): Promise<Calendar> {
  const response = await apiClient.post(API_ROUTES.CALENDARS, data);
  return response.data;
}
```

### Mobile (React Native)

```typescript
// apps/calendar/apps/mobile/src/api/calendars.ts
import type { Calendar, CalendarViewType } from '@calendar/shared/types';
import { DEFAULT_CALENDAR_COLOR } from '@calendar/shared/constants';

export function useCalendarStore() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  // ...
}
```

### Utility Usage

```typescript
// Across all platforms
import { startOfWeek, endOfWeek, getWeekNumber } from '@calendar/shared/utils';

const weekStart = startOfWeek(new Date(), 1); // Monday
const weekEnd = endOfWeek(new Date(), 1);
const weekNum = getWeekNumber(new Date());
```

## How to Use

### Adding New Types

1. **Identify the domain entity** (Calendar, Event, Reminder, etc.)
2. **Create base entity interface** matching database schema
3. **Add Input/Update types** for API operations
4. **Add to type index exports**

```typescript
// src/types/new-entity.ts
export interface NewEntity {
  id: string;
  userId: string;
  // ... fields matching DB schema
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateNewEntityInput {
  // Required fields for creation
}

export interface UpdateNewEntityInput {
  // Optional fields for updates
}

// src/types/index.ts
export * from './new-entity';
```

### Adding Utility Functions

1. **Keep utilities pure** (no side effects)
2. **No external dependencies** for date utilities
3. **Add comprehensive JSDoc comments**
4. **Export from utils/index.ts**

```typescript
// src/utils/my-utility.ts
/**
 * Description of what this utility does
 * @param param1 - Description
 * @returns Description
 */
export function myUtility(param1: string): number {
  // Pure function implementation
  return 42;
}

// src/utils/index.ts
export * from './my-utility';
```

### Adding Constants

1. **Use `as const` for type safety**
2. **Group related constants**
3. **Provide both value and label for UI constants**

```typescript
// src/constants/index.ts
export const NEW_CONSTANTS = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
] as const;

export type NewConstantType = (typeof NEW_CONSTANTS)[number]['value'];
```

### Using Named Exports

```typescript
// Main entry
import { Calendar, CalendarEvent } from '@calendar/shared';

// Named exports (recommended for tree-shaking)
import type { Calendar } from '@calendar/shared/types';
import { startOfWeek } from '@calendar/shared/utils';
import { CALENDAR_COLORS } from '@calendar/shared/constants';
```

### Type-Checking

```bash
# From shared package directory
pnpm type-check

# From monorepo root
pnpm type-check  # Checks all packages including shared
```

## Design Principles

1. **Single Source of Truth**: All Calendar types defined here, nowhere else
2. **Platform Agnostic**: Works in Node.js, browser, React Native
3. **Zero Runtime Dependencies**: Only TypeScript types and pure functions
4. **Strict Type Safety**: No `any`, prefer unions over loosely typed fields
5. **Date Flexibility**: Support both `Date` objects and ISO strings
6. **JSON-First Metadata**: Use JSONB-compatible types for flexible data
7. **RFC 5545 Compliance**: Follow iCalendar standards for recurrence
8. **Tree-Shakeable Exports**: Named exports via package.json exports field

## Common Tasks

### Extending Event Metadata

```typescript
// Add new field to EventMetadata
export interface EventMetadata {
  // ... existing fields
  newField?: string;  // Add optional field
}

// Backend automatically handles JSONB column
// Frontend gets type safety immediately
```

### Adding View Types

```typescript
// src/types/calendar.ts
export type CalendarViewType =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'agenda'
  | 'new-view';  // Add new view type

// Update constants
export const VIEW_TYPES = ['day', 'week', 'month', 'year', 'agenda', 'new-view'] as const;
```

### Modifying Recurrence Logic

```typescript
// src/utils/recurrence.ts
// Update parseRecurrenceRule or expandRecurrence
// All backends/frontends get updated logic automatically
```

## Version Management

This package uses internal versioning (`1.0.0`) and is NOT published to npm. It's consumed directly from the monorepo using TypeScript path mapping.

```json
// Other packages reference it via
{
  "dependencies": {
    "@calendar/shared": "workspace:*"
  }
}
```

Changes to this package affect ALL calendar apps immediately - there's no version lag. Use semantic commits and comprehensive testing.

## Related Documentation

- **Calendar Backend**: `apps/calendar/apps/backend/.agent/agent.md`
- **Calendar Web**: `apps/calendar/apps/web/.agent/agent.md`
- **Project Guide**: `apps/calendar/CLAUDE.md`
- **Monorepo Guide**: Root `CLAUDE.md`
