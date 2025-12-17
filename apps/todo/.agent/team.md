# Todo App Team

## Module: todo
**Path:** `apps/todo`
**Description:** Full-featured task management application with projects, subtasks, labels, recurring tasks, reminders, and calendar integration. Supports natural language task creation and includes Kanban boards and advanced task metadata (story points, fun rating, effective duration).
**Tech Stack:** NestJS (backend), SvelteKit (web), Astro (landing), Drizzle ORM, PostgreSQL
**Platforms:** Backend, Web, Landing

## Team Overview

This team manages the Todo application, a comprehensive task management solution for the ManaCore ecosystem. The app enables users to organize tasks with sophisticated features like recurring tasks (RFC 5545 RRULE), calendar sync, and flexible metadata tracking.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User stories, task management UX, feature prioritization |
| Architect | `architect.md` | System design, database schema, calendar integration |
| Senior Developer | `senior-dev.md` | Complex features, recurrence logic, NLP parsing |
| Developer | `developer.md` | Feature implementation, UI components, bug fixes |
| Security Engineer | `security.md` | Auth flows, data privacy, multi-tenancy |
| QA Lead | `qa-lead.md` | Testing strategy, edge cases, data integrity |

## Key Features
- **Projects** - Color-coded projects with icons and archiving
- **Tasks** - Full CRUD with priority, due dates, status, and rich metadata
- **Subtasks** - Nested checklist items with drag-and-drop reordering
- **Labels** - Multi-label tagging with color coding
- **Recurring Tasks** - RFC 5545 RRULE support (daily, weekly, monthly, custom)
- **Reminders** - Push and email notifications at configurable intervals
- **Calendar Integration** - Bidirectional sync with Calendar app
- **Quick Add** - Natural language parsing ("Meeting morgen um 14 Uhr !hoch @Arbeit")
- **Kanban Boards** - Visual task management with columns
- **Statistics** - Activity heatmaps, priority distribution, project progress
- **Advanced Metadata** - Story points, effective duration, fun rating

## Architecture
```
apps/todo/
├── apps/
│   ├── backend/    # NestJS API (port 3018)
│   ├── web/        # SvelteKit frontend (port 5188)
│   └── landing/    # Astro marketing site (port 4323)
└── packages/
    └── shared/     # Shared types, utils, constants (@todo/shared)
```

## API Structure
### Projects
- `GET/POST /api/v1/projects` - List/create projects
- `GET/PUT/DELETE /api/v1/projects/:id` - Project CRUD
- `POST /api/v1/projects/:id/archive` - Archive project
- `PUT /api/v1/projects/reorder` - Reorder projects

### Tasks
- `GET/POST /api/v1/tasks` - Query/create tasks (with filters)
- `GET/PUT/DELETE /api/v1/tasks/:id` - Task CRUD
- `POST /api/v1/tasks/:id/complete` - Mark complete
- `POST /api/v1/tasks/:id/move` - Move to project
- `PUT /api/v1/tasks/:id/labels` - Update labels
- `GET /api/v1/tasks/inbox` - Inbox view
- `GET /api/v1/tasks/today` - Today view
- `GET /api/v1/tasks/upcoming` - Upcoming view
- `PUT /api/v1/tasks/reorder` - Reorder tasks

### Labels
- `GET/POST /api/v1/labels` - List/create labels
- `PUT/DELETE /api/v1/labels/:id` - Update/delete label

### Reminders
- `GET/POST /api/v1/tasks/:taskId/reminders` - List/create reminders
- `DELETE /api/v1/reminders/:id` - Delete reminder

## Database Schema
- **projects** - User projects with colors, icons, order
- **tasks** - Tasks with rich metadata (JSONB subtasks and metadata fields)
- **labels** - User-defined labels with colors
- **task_labels** - Many-to-many relationship
- **reminders** - Task reminders with status tracking

Note: `user_id` uses TEXT type (Mana Core Auth format)

## Views
- **Inbox** (`/`) - Tasks without a project
- **Today** (`/today`) - Due today + overdue
- **Upcoming** (`/upcoming`) - Next 7 days
- **Project** (`/project/[id]`) - Tasks in specific project
- **Label** (`/label/[id]`) - Tasks with specific label
- **Completed** (`/completed`) - Completed tasks archive
- **Search** (`/search`) - Full-text search

## How to Use
```
"As the [Role] for todo, help me with..."
"Read apps/todo/.agent/team/ and help me understand..."
```
