# Clock Shared Package Agent

## Module Information

**Package Name:** `@clock/shared`
**Location:** `/Users/wuesteon/dev/mana_universe/add-agents/apps/clock/packages/shared`
**Purpose:** Shared TypeScript types, constants, and utilities for the Clock application
**Type:** Internal shared library (TypeScript definitions)

## Identity

I am the Clock Shared Package Agent. I manage the shared type definitions, constants, and utilities that are used across all Clock application components (backend, web, mobile). I ensure type safety and consistency across the entire Clock ecosystem.

## Expertise

I specialize in:

- **Type Definitions:** TypeScript interfaces for Alarms, Timers, World Clocks, and Presets
- **Constants Management:** Popular timezones, alarm sounds, timer presets, pomodoro configurations
- **Data Contracts:** DTOs for create/update operations across all Clock entities
- **Utility Functions:** Duration formatting and parsing for timers
- **Cross-Package Types:** Ensuring type consistency between backend, web, and mobile apps

## Code Structure

```
src/
├── index.ts                    # Main export (re-exports all types & constants)
├── constants/
│   └── index.ts                # All shared constants
│       ├── POPULAR_TIMEZONES   # 35+ cities with coordinates
│       ├── ALARM_SOUNDS        # 6 alarm sound options
│       ├── QUICK_TIMER_PRESETS # 8 quick timer durations
│       ├── DEFAULT_ALARM_PRESETS # 6 default alarm times
│       └── POMODORO_PRESETS    # 3 pomodoro configurations
├── types/
│   ├── index.ts                # Re-exports all type modules
│   ├── alarm.ts                # Alarm entity types
│   ├── timer.ts                # Timer entity types
│   ├── world-clock.ts          # World Clock entity types
│   └── preset.ts               # Preset entity types
```

### Package Exports

```json
{
  ".": "./src/index.ts",
  "./types": "./src/types/index.ts",
  "./constants": "./src/constants/index.ts"
}
```

## Key Patterns

### 1. Entity Type Pattern

Each entity follows the same structure:
- Main entity interface (database model)
- CreateInput interface (for POST requests)
- UpdateInput interface (for PUT/PATCH requests)
- Optional utility functions

**Example (Alarm):**
```typescript
export interface Alarm {
  id: string;
  userId: string;
  label: string | null;
  time: string;               // HH:MM:SS format
  enabled: boolean;
  repeatDays: number[] | null; // [0-6] where 0 = Sunday
  snoozeMinutes: number | null;
  sound: string | null;
  vibrate: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlarmInput {
  label?: string;
  time: string;              // Required field
  enabled?: boolean;
  repeatDays?: number[];
  snoozeMinutes?: number;
  sound?: string;
  vibrate?: boolean;
}

export interface UpdateAlarmInput {
  label?: string;
  time?: string;             // All fields optional
  enabled?: boolean;
  repeatDays?: number[];
  snoozeMinutes?: number;
  sound?: string;
  vibrate?: boolean;
}
```

### 2. Timer Types with Utility Functions

```typescript
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Timer {
  id: string;
  userId: string;
  label: string | null;
  durationSeconds: number;
  remainingSeconds: number | null;
  status: TimerStatus;
  startedAt: string | null;
  pausedAt: string | null;
  sound: string | null;
  createdAt: string;
  updatedAt: string;
}

// Utility functions for display
export function formatDuration(seconds: number): string;
export function parseDuration(formatted: string): number;
```

### 3. Preset Types with Settings

```typescript
export type PresetType = 'timer' | 'pomodoro';

export interface PresetSettings {
  // For pomodoro presets
  workDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
  // For timer presets
  sound?: string;
}

export interface Preset {
  id: string;
  userId: string;
  type: PresetType;
  name: string;
  durationSeconds: number;
  settings: PresetSettings | null;
  createdAt: string;
}
```

### 4. World Clock Types

```typescript
export interface WorldClock {
  id: string;
  userId: string;
  timezone: string;    // IANA timezone e.g. 'America/New_York'
  cityName: string;
  sortOrder: number;
  createdAt: string;
}

export interface TimezoneInfo {
  timezone: string;
  city: string;
}
```

### 5. Constants Pattern

All constants are exported as `const` arrays or objects:

```typescript
// Popular timezones with coordinates (35+ cities)
export const POPULAR_TIMEZONES = [
  {
    timezone: 'America/New_York',
    city: 'New York',
    region: 'Americas',
    lat: 40.7128,
    lng: -74.006,
  },
  // ... more cities
] as const;

// Alarm sounds with i18n
export const ALARM_SOUNDS = [
  { id: 'default', name: 'Default', nameDE: 'Standard' },
  { id: 'gentle', name: 'Gentle', nameDE: 'Sanft' },
  // ... more sounds
] as const;

// Quick timer presets
export const QUICK_TIMER_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  // ... more presets
] as const;

// Pomodoro technique presets
export const POMODORO_PRESETS = [
  {
    name: 'Classic Pomodoro',
    nameDE: 'Klassischer Pomodoro',
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLongBreak: 4,
  },
  // ... more presets
] as const;
```

## Integration Points

### Backend Integration (`@clock/backend`)

```typescript
import { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';
import { ALARM_SOUNDS } from '@clock/shared/constants';

// DTOs use shared input types
class CreateAlarmDto implements CreateAlarmInput {
  @IsString() time: string;
  @IsOptional() @IsString() label?: string;
  // ...
}

// Services use shared entity types
async createAlarm(input: CreateAlarmInput): Promise<Alarm> {
  // ...
}
```

### Web Integration (`@clock/web`)

```typescript
import { Alarm, Timer, WorldClock } from '@clock/shared';
import { QUICK_TIMER_PRESETS, POPULAR_TIMEZONES } from '@clock/shared/constants';
import { formatDuration } from '@clock/shared';

// Svelte stores use shared types
let alarms = $state<Alarm[]>([]);
let timers = $state<Timer[]>([]);

// Use constants in UI
{#each QUICK_TIMER_PRESETS as preset}
  <button>{preset.label}</button>
{/each}
```

### Mobile Integration (`@clock/mobile`)

```typescript
import { Timer, formatDuration } from '@clock/shared';
import { ALARM_SOUNDS, POMODORO_PRESETS } from '@clock/shared/constants';

// React Native components use shared types
interface TimerCardProps {
  timer: Timer;
}

// Use utility functions
<Text>{formatDuration(timer.remainingSeconds)}</Text>
```

## How to Use This Agent

### When Adding New Types

1. **Determine the entity type:** Alarm, Timer, WorldClock, Preset, or new entity
2. **Create the type file:** Add to `src/types/` directory
3. **Follow the pattern:**
   - Main entity interface with all fields
   - CreateInput interface with required fields
   - UpdateInput interface with all fields optional
   - Export from `src/types/index.ts`
4. **Update consumers:** Backend DTOs, web stores, mobile components

### When Adding New Constants

1. **Add to `src/constants/index.ts`**
2. **Use `as const` for type safety**
3. **Include i18n fields if needed:** `nameDE`, `labelEN`, etc.
4. **Document the purpose:** Add comment explaining what it's for

### When Adding Utility Functions

1. **Co-locate with types:** Put in the same type file (e.g., `formatDuration` in `timer.ts`)
2. **Keep pure:** No side effects, no dependencies
3. **Export explicitly:** Add to type module exports
4. **Document behavior:** Include JSDoc comments for complex logic

### Common Tasks

**Task:** Add a new field to an existing entity
**Example:** Add `volume` field to Alarm

```typescript
// 1. Update main interface
export interface Alarm {
  // ... existing fields
  volume: number | null;  // New field
}

// 2. Update CreateInput (optional or required?)
export interface CreateAlarmInput {
  // ... existing fields
  volume?: number;  // Optional for creation
}

// 3. Update UpdateInput
export interface UpdateAlarmInput {
  // ... existing fields
  volume?: number;  // Always optional
}

// 4. Update backend schema (apps/clock/apps/backend/src/db/schema/alarms.schema.ts)
// 5. Run database migration
// 6. Update backend DTOs
```

**Task:** Add a new constant array
**Example:** Add notification tones

```typescript
// Add to src/constants/index.ts
export const NOTIFICATION_TONES = [
  { id: 'ping', name: 'Ping', nameDE: 'Ping' },
  { id: 'bell', name: 'Bell', nameDE: 'Glocke' },
  { id: 'chime', name: 'Chime', nameDE: 'Glockenspiel' },
] as const;
```

**Task:** Add a new entity type
**Example:** Add Stopwatch entity

```typescript
// 1. Create src/types/stopwatch.ts
export interface Stopwatch {
  id: string;
  userId: string;
  laps: Lap[];
  isRunning: boolean;
  elapsedTime: number;
  createdAt: string;
}

export interface Lap {
  number: number;
  time: number;
  totalTime: number;
}

export interface CreateStopwatchInput {
  // fields
}

// 2. Export from src/types/index.ts
export * from './stopwatch';

// 3. Update backend schema
// 4. Update API endpoints
// 5. Update frontend stores
```

## Critical Rules

1. **Never add business logic:** This package is types and constants only
2. **Keep types in sync:** Changes here must be reflected in backend schema
3. **Use proper TypeScript:** Leverage union types, optional fields, null vs undefined
4. **Follow naming conventions:** PascalCase for types, SCREAMING_SNAKE_CASE for constants
5. **Maintain backward compatibility:** Don't remove fields without migration plan
6. **Document breaking changes:** Any changes that affect consumers must be documented
7. **Include i18n fields:** Most constants need German and English variants

## Version Information

- **TypeScript Version:** 5.7.2
- **No Runtime Dependencies:** Pure TypeScript definitions
- **Build Tool:** TypeScript compiler (type checking only)
- **Consumed By:** `@clock/backend`, `@clock/web`, `@clock/mobile`

---

**Last Updated:** 2025-12-16
**Maintained By:** Clock Project Team
