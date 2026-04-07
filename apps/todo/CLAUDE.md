# Todo Project Guide

## Overview

**Todo** is a full-featured task management application for the Mana ecosystem. It supports projects, tasks with subtasks, labels, recurring tasks, reminders, and calendar integration.

| App | Port | URL |
|-----|------|-----|
| Backend | 3018 | http://localhost:3018 |
| Web App | 5188 | http://localhost:5188 |
| Landing Page | 4323 | http://localhost:4323 |

## Project Structure

```
apps/todo/
├── apps/
│   ├── backend/      # Hono/Bun compute server (@todo/server)
│   ├── web/          # SvelteKit web application (@todo/web)
│   └── landing/      # Astro marketing landing page (@todo/landing)
├── packages/
│   └── shared/       # Shared types, utils, constants (@todo/shared)
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# All apps
pnpm todo:dev                 # Run all todo apps

# Individual apps
pnpm dev:todo:backend         # Start backend server (port 3018)
pnpm dev:todo:web             # Start web app (port 5188)
pnpm dev:todo:landing         # Start landing page (port 4323)
pnpm dev:todo:app             # Start web + backend together

# Database
pnpm todo:db:push             # Push schema to database
pnpm todo:db:studio           # Open Drizzle Studio
pnpm todo:db:seed             # Seed initial data
```

### Backend (apps/todo/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
pnpm db:seed                     # Seed initial data
```

### Web App (apps/todo/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/todo/apps/landing)

```bash
pnpm dev                         # Start dev server (port 4323)
pnpm build                       # Build for production
pnpm preview                     # Preview build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Hono + Bun, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Auth (JWT) |
| **i18n** | svelte-i18n (DE, EN) |
| **Dates** | date-fns |

## Core Features

1. **Projects** - Organize tasks into color-coded projects
2. **Tasks** - Full CRUD with priority, due dates, and status
3. **Subtasks** - Checklist items within tasks
4. **Labels** - Tag tasks with colored labels
5. **Recurring Tasks** - Daily, weekly, monthly (RFC 5545 RRULE)
6. **Reminders** - Push and email notifications
7. **Calendar Integration** - Sync tasks with Calendar app
8. **Quick Add** - Natural language task creation

## Views

| View | Route | Description |
|------|-------|-------------|
| **Inbox** | `/` (default) | Tasks without a project |
| **Today** | `/today` | Due today + overdue |
| **Upcoming** | `/upcoming` | Next 7 days, grouped by date |
| **Project** | `/project/[id]` | Tasks in specific project |
| **Label** | `/label/[id]` | Tasks with specific label |
| **Completed** | `/completed` | Completed tasks archive |
| **Search** | `/search` | Full-text search |

## API Endpoints

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/projects` | GET | List user's projects |
| `/api/v1/projects` | POST | Create project |
| `/api/v1/projects/:id` | GET | Get project details |
| `/api/v1/projects/:id` | PUT | Update project |
| `/api/v1/projects/:id` | DELETE | Delete project |
| `/api/v1/projects/:id/archive` | POST | Archive project |
| `/api/v1/projects/reorder` | PUT | Reorder projects |

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tasks` | GET | Query tasks (filters) |
| `/api/v1/tasks` | POST | Create task |
| `/api/v1/tasks/:id` | GET | Get task details |
| `/api/v1/tasks/:id` | PUT | Update task |
| `/api/v1/tasks/:id` | DELETE | Delete task |
| `/api/v1/tasks/:id/complete` | POST | Mark complete |
| `/api/v1/tasks/:id/uncomplete` | POST | Mark incomplete |
| `/api/v1/tasks/:id/move` | POST | Move to project |
| `/api/v1/tasks/:id/labels` | PUT | Update labels |
| `/api/v1/tasks/inbox` | GET | Inbox tasks |
| `/api/v1/tasks/today` | GET | Today's tasks |
| `/api/v1/tasks/upcoming` | GET | Upcoming tasks |
| `/api/v1/tasks/reorder` | PUT | Reorder tasks |

### Labels

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/labels` | GET | List labels |
| `/api/v1/labels` | POST | Create label |
| `/api/v1/labels/:id` | PUT | Update label |
| `/api/v1/labels/:id` | DELETE | Delete label |

### Reminders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tasks/:taskId/reminders` | GET | List reminders |
| `/api/v1/tasks/:taskId/reminders` | POST | Add reminder |
| `/api/v1/reminders/:id` | DELETE | Delete reminder |

## Database Schema

> **Note**: `user_id` columns use TEXT type (not UUID) because Mana Auth generates non-UUID user IDs.

### projects
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner (Better Auth format)
- `name` (VARCHAR) - Project name
- `color` (VARCHAR) - Hex color
- `icon` (VARCHAR) - Icon name
- `order` (INTEGER) - Sort order
- `is_archived` (BOOLEAN) - Archive flag
- `is_default` (BOOLEAN) - Inbox project

### tasks
- `id` (UUID) - Primary key
- `project_id` (UUID) - FK to projects (nullable = Inbox)
- `user_id` (TEXT) - Owner (Better Auth format)
- `title` (VARCHAR) - Task title
- `description` (TEXT) - Description
- `due_date` (TIMESTAMP) - Due date
- `priority` (VARCHAR) - low/medium/high/urgent
- `is_completed` (BOOLEAN) - Completion flag
- `order` (INTEGER) - Sort order
- `recurrence_rule` (VARCHAR) - RFC 5545 RRULE
- `subtasks` (JSONB) - Subtask array
- `metadata` (JSONB) - Extra data

### labels
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner (Better Auth format)
- `name` (VARCHAR) - Label name
- `color` (VARCHAR) - Hex color

### task_labels
- `task_id` (UUID) - FK to tasks
- `label_id` (UUID) - FK to labels

### reminders
- `id` (UUID) - Primary key
- `task_id` (UUID) - FK to tasks
- `user_id` (TEXT) - Owner (Better Auth format)
- `minutes_before` (INTEGER) - Offset
- `type` (VARCHAR) - push/email/both
- `status` (VARCHAR) - pending/sent/failed

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3018
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/todo
MANA_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5186,http://localhost:8081
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3018
PUBLIC_MANA_AUTH_URL=http://localhost:3001
```

## Quick Add Syntax

Natural language task creation:

```
"Meeting morgen um 14 Uhr !hoch @Arbeit #wichtig"
```

Recognized patterns:
- **Date**: heute, morgen, nächsten Montag, 15.12.
- **Time**: um 14 Uhr, 14:00
- **Priority**: !hoch, !niedrig, !dringend, !!!
- **Project**: @Projektname
- **Labels**: #label1 #label2
- **Recurrence**: jeden Tag, wöchentlich, monatlich
- **Duration**: 30min, 2h, 1.5 Stunden (maps to `estimatedDuration`)

### Multi-Task Input

Split multiple tasks with keywords (`danach`, `dann`, `und dann`, `anschließend`, `außerdem`) or semicolons:

```
"Morgen um 10 Zahnarzt 1h, danach Einkaufen"
→ Task 1: Zahnarzt (morgen 10:00, 1h)
→ Task 2: Einkaufen (morgen 11:00, auto-offset)

"Meeting 14 Uhr 1h @Arbeit; Report schreiben; Mails"
→ 3 tasks, all inherit date + project from first task
```

Context inheritance: subsequent tasks inherit date, time, and project from the first task. If the first task has a duration, the next task's time is offset accordingly.

### Smart Duration (Auto-Estimation)

Duration is **automatically applied** to new tasks when no explicit duration is typed. The system uses history-based estimation (weighted by project, labels, title similarity, priority) with a configurable default as fallback. Controllable via Settings > Task-Verhalten:

- **Smarte Dauer** toggle (`smartDurationEnabled`, default: on)
- **Standard-Dauer** fallback (`defaultTaskDuration`, default: 30min)

Priority: explicit duration in text > history estimate > default fallback > none (if disabled).

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS with CSS variables
- **Formatting**: Prettier with project config
- **i18n**: All UI text in locale files

## Production Readiness

**Status: Production-Ready (2026-03-24)**

### Checklist

| Category | Status | Details |
|----------|--------|---------|
| **Error Handling** | ✅ | Global `+error.svelte` with i18n (5 languages), error tracking via GlitchTip |
| **Offline Support** | ✅ | Offline page with shared `OfflinePage` component |
| **PWA** | ✅ | Service worker, manifest, icons, shortcuts (New task, Kanban, Settings) |
| **Security Headers** | ✅ | CSP, X-Frame-Options via `setSecurityHeaders()` |
| **Loading States** | ✅ | Skeleton loaders: TaskList, TaskItem, KanbanBoard, KanbanColumn, Statistics |
| **i18n** | ✅ | 5 languages (DE/EN/FR/ES/IT) via svelte-i18n |
| **Meta/SEO** | ✅ | OG tags, meta description in root layout |
| **Accessibility** | ✅ | Focus trapping in all modals, ARIA roles, keyboard shortcuts |
| **Rate Limiting** | ✅ | ThrottlerGuard global (100 req/min) |
| **API Validation** | ✅ | DTOs with class-validator, RRULE DoS protection (max 5000 occurrences) |
| **Auth** | ✅ | JWT via mana-auth, client-side redirect in `onMount` |
| **Toast System** | ✅ | Toast notifications via shared `toastStore` |
| **Docker** | ✅ | Multi-stage build (web + backend), health checks, Traefik labels |
| **Tests** | ✅ | Unit tests (7 backend, 3 web), E2E tests (3 suites: auth, projects, tasks) |
| **Error Tracking** | ✅ | GlitchTip integration (client + server) |
| **Metrics** | ✅ | Prometheus via MetricsModule |
| **Context Menu** | ✅ | Shared ContextMenu on TaskList (priority, project, complete, delete) |
| **Auto-Save** | ✅ | 500ms debounce, no save/cancel buttons needed |
| **Drag & Drop** | ✅ | Task reordering in list + kanban views |

### Test Suites

```bash
# Unit tests
pnpm --filter @todo/server test
pnpm --filter @todo/web test

# E2E tests
pnpm --filter @todo/web test:e2e
```

| Type | Suite | Coverage |
|------|-------|----------|
| Unit (Backend) | `task.service.spec.ts` | Task CRUD, recurrence |
| Unit (Backend) | `project.service.spec.ts` | Project management |
| Unit (Backend) | `kanban.service.spec.ts` | Kanban operations |
| Unit (Backend) | `reminder.service.spec.ts` | Reminders |
| Unit (Backend) | `label.service.spec.ts` | Labels |
| Unit (Web) | `task-parser.test.ts` | Natural language parsing |
| Unit (Web) | `task-filters.test.ts` | Filter logic |
| Unit (Web) | `view.test.ts` | View store state |
| E2E | `auth.spec.ts` | Login, redirect |
| E2E | `projects.spec.ts` | Project CRUD |
| E2E | `tasks.spec.ts` | Task CRUD |

## Important Notes

1. **Authentication**: Uses Mana Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM (port 5432)
3. **Ports**: Backend=3018, Web=5188, Landing=4323
4. **Recurrence**: Uses RFC 5545 RRULE format
5. **Calendar**: Tasks can sync bidirectionally with Calendar app
