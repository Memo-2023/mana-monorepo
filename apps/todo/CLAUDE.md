# Todo Project Guide

## Overview

**Todo** is a full-featured task management application for the ManaCore ecosystem. It supports projects, tasks with subtasks, labels, recurring tasks, reminders, and calendar integration.

| App | Port | URL |
|-----|------|-----|
| Backend | 3018 | http://localhost:3018 |
| Web App | 5188 | http://localhost:5188 |
| Landing Page | 4323 | http://localhost:4323 |

## Project Structure

```
apps/todo/
├── apps/
│   ├── backend/      # NestJS API server (@todo/backend)
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
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |
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

### projects
- `id` (UUID) - Primary key
- `user_id` (UUID) - Owner
- `name` (VARCHAR) - Project name
- `color` (VARCHAR) - Hex color
- `icon` (VARCHAR) - Icon name
- `order` (INTEGER) - Sort order
- `is_archived` (BOOLEAN) - Archive flag
- `is_default` (BOOLEAN) - Inbox project

### tasks
- `id` (UUID) - Primary key
- `project_id` (UUID) - FK to projects (nullable = Inbox)
- `user_id` (UUID) - Owner
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
- `user_id` (UUID) - Owner
- `name` (VARCHAR) - Label name
- `color` (VARCHAR) - Hex color

### task_labels
- `task_id` (UUID) - FK to tasks
- `label_id` (UUID) - FK to labels

### reminders
- `id` (UUID) - Primary key
- `task_id` (UUID) - FK to tasks
- `minutes_before` (INTEGER) - Offset
- `type` (VARCHAR) - push/email/both
- `status` (VARCHAR) - pending/sent/failed

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3018
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/todo
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5186,http://localhost:8081
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3018
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
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

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS with CSS variables
- **Formatting**: Prettier with project config
- **i18n**: All UI text in locale files

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM (port 5432)
3. **Ports**: Backend=3018, Web=5188, Landing=4323
4. **Recurrence**: Uses RFC 5545 RRULE format
5. **Calendar**: Tasks can sync bidirectionally with Calendar app
