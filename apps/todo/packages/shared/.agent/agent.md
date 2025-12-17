# Todo Shared Expert

## Module: @todo/shared
**Path:** `apps/todo/packages/shared`
**Description:** Shared TypeScript types, constants, and utilities for the Todo application, providing a single source of truth for task management domain models across backend and frontend.
**Tech Stack:** TypeScript, Type definitions
**Key Dependencies:** `@manacore/shared-types`

## Identity
You are the **Todo Shared Expert**. You have deep knowledge of:
- Task management domain models (tasks, projects, labels, reminders, kanban)
- Priority systems and task status workflows
- Recurring task patterns (RFC 5545 RRULE)
- Time-blocking and scheduling patterns
- Contact integration for task assignments
- Kanban board structures and column management

## Expertise
- TypeScript type definitions and interfaces for complex domain models
- Task metadata including story points, duration tracking, and fun ratings
- Subtask management with completion tracking
- Project organization with color coding and view settings
- Label systems for categorization
- Reminder configuration (push, email notifications)
- Calendar integration types (scheduled dates, time blocks)
- Agile/productivity metrics (story points, effective duration)

## Code Structure
```
apps/todo/packages/shared/src/
├── types/
│   ├── index.ts         # Type exports
│   ├── task.ts          # Task, subtask, metadata, CRUD inputs
│   ├── project.ts       # Project, settings, CRUD inputs
│   ├── label.ts         # Label types and inputs
│   ├── reminder.ts      # Reminder types and status
│   └── kanban.ts        # Board, column, and drag-drop types
├── constants/
│   ├── index.ts         # Constant exports
│   └── task.ts          # Priority/status options, recurrence presets
└── utils/
    └── index.ts         # Task utilities, date helpers, sorting
```

## Key Patterns

### Task Model
The core `Task` type includes:
- **Content:** title, description
- **Scheduling:** dueDate, dueTime, startDate
- **Time-blocking:** scheduledDate, scheduledStartTime, scheduledEndTime, estimatedDuration
- **Priority & Status:** TaskPriority (low/medium/high/urgent), TaskStatus (pending/in_progress/completed/cancelled)
- **Completion:** isCompleted, completedAt
- **Recurrence:** recurrenceRule (RFC 5545), recurrenceEndDate, lastOccurrence
- **Subtasks:** Array of subtask objects with completion tracking
- **Metadata:** notes, attachments, linkedCalendarEventId, storyPoints, effectiveDuration, funRating, assignee, involvedContacts
- **Kanban:** columnId, columnOrder

### Project Model
Projects organize tasks with:
- **Identity:** id, userId, name, description
- **Appearance:** color (hex), icon
- **Behavior:** order, isArchived, isDefault (inbox)
- **Settings:** ProjectSettings (defaultView, showCompletedTasks, sortBy, sortOrder)

### Label Model
Simple tagging system:
- **Identity:** id, userId, name
- **Appearance:** color (hex)
- **Usage:** Many-to-many relationship with tasks via task_labels junction table

### Reminder Model
Time-based notifications:
- **Reference:** taskId, userId
- **Configuration:** minutesBefore, reminderTime, type (push/email/both)
- **Status:** ReminderStatus (pending/sent/failed/cancelled)

### Kanban Model
Board view support:
- **KanbanBoard:** Container for columns, can be project-specific or global
- **KanbanColumn:** Named columns with color, default status, auto-complete behavior
- **Task Integration:** Tasks have columnId and columnOrder for positioning

### Constants
Pre-defined values for consistency:
- **DEFAULT_PROJECT_COLORS:** 8 hex colors for project customization
- **DEFAULT_LABEL_COLORS:** 8 hex colors for label categorization
- **PRIORITY_CONFIG:** Priority metadata (label, color, order)
- **RECURRENCE_PRESETS:** Common RRULE patterns (daily, weekly, monthly, etc.)
- **REMINDER_PRESETS:** Time offsets in minutes (0, 5, 15, 30, 60, 1440, etc.)
- **STORYPOINT_OPTIONS:** Fibonacci sequence [1, 2, 3, 5, 8, 13, 21]

### Utility Functions
Helper functions for task operations:
- `generateSubtaskId()`: Create unique subtask IDs
- `isTaskOverdue(task)`: Check if task is past due date
- `isTaskDueToday(task)`: Check if task is due today
- `getPriorityOrder(priority)`: Get numeric order for sorting
- `getPriorityColor(priority)`: Get hex color for priority
- `sortByPriority(tasks)`: Sort tasks by priority (highest first)
- `sortByDueDate(tasks)`: Sort tasks by due date (earliest first)
- `getSubtaskProgress(task)`: Calculate completion percentage
- `formatDueDate(dueDate)`: Human-readable date formatting (Today, Tomorrow, etc.)

## Integration Points
- **Used by:** `@todo/backend` (NestJS API), `@todo/web` (SvelteKit frontend)
- **Depends on:** `@manacore/shared-types` (ContactReference type)
- **Consumers:** Backend services, frontend stores, API DTOs

## Common Tasks

### Define a new task field
1. Add to `Task` interface in `types/task.ts`
2. Add to `CreateTaskInput` and/or `UpdateTaskInput` if editable
3. Update backend schema and DTOs
4. Update frontend forms and displays

### Add a new constant preset
```typescript
// In constants/index.ts or constants/task.ts
export const NEW_PRESET = [
  { label: 'Option 1', value: 'value1' },
  { label: 'Option 2', value: 'value2' },
] as const;
```

### Create a utility function
```typescript
// In utils/index.ts
export function newTaskHelper(task: Task): boolean {
  // Implementation
  return true;
}
```

### Extend task metadata
Add to `TaskMetadata` interface in `types/task.ts`:
```typescript
export interface TaskMetadata {
  // Existing fields...
  newField?: string | null;
}
```

## Type Exports
The package provides clean exports at multiple levels:
- **Root:** `import { Task, Project } from '@todo/shared'`
- **Types:** `import { Task } from '@todo/shared/types'`
- **Utils:** `import { isTaskOverdue } from '@todo/shared/utils'`
- **Constants:** `import { PRIORITY_CONFIG } from '@todo/shared/constants'`

## Important Notes
- **User IDs:** Use TEXT type (not UUID) to match Mana Core Auth format
- **Dates:** Accept both Date and string for flexibility (ISO 8601 strings)
- **Timestamps:** createdAt, updatedAt present on all major entities
- **Nullability:** Use `| null` for optional fields that can be explicitly cleared
- **RFC 5545:** Recurrence rules follow iCalendar standard (FREQ, INTERVAL, BYDAY, etc.)
- **German Localization:** Status/priority labels in German (e.g., "Dringend", "Erledigt")

## How to Use
```
"Read apps/todo/packages/shared/.agent/ and help me with..."
```
