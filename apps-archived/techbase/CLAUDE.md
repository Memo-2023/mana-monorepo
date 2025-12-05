# TechBase Project Guide

## Project Structure

```
apps/techbase/
├── apps/
│   ├── web/          # Astro web application (@techbase/web)
│   └── backend/      # NestJS API server (@techbase/backend)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm techbase:dev           # Run all techbase apps
pnpm dev:techbase:web       # Start web app only
pnpm dev:techbase:backend   # Start backend only
pnpm dev:techbase:app       # Start web + backend together
pnpm techbase:db:push       # Push schema to database
pnpm techbase:db:studio     # Open Drizzle Studio
```

### Project Level (from apps/techbase/)

```bash
pnpm dev                    # Run all apps
pnpm dev:web                # Start web only
pnpm dev:backend            # Start backend only
pnpm build                  # Build all apps
```

## Technology Stack

- **Web**: Astro 5.5.5, Tailwind CSS, Alpine.js, Fuse.js
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **i18n**: German (default), English (via Astro Content Collections)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/votes` | POST | Submit vote |
| `/api/votes/:softwareId` | GET | Get votes for software |
| `/api/votes/:softwareId/metrics` | GET | Get aggregated metrics |
| `/api/votes/metrics/all` | GET | Get all software metrics |
| `/api/comments` | POST | Submit comment |
| `/api/comments/:softwareId` | GET | Get approved comments |
| `/api/admin/comments` | GET | Get all comments (admin) |
| `/api/admin/comments/pending` | GET | Get pending comments |
| `/api/admin/comments/:id/approve` | PATCH | Approve comment |
| `/api/admin/comments/:id/reject` | PATCH | Reject comment |
| `/api/admin/comments/:id` | DELETE | Delete comment |

## Database Schema

### votes

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| software_id | VARCHAR(255) | Software identifier |
| metric | VARCHAR(50) | Metric name (easeOfUse, featureRichness, etc.) |
| rating | INTEGER | Rating value (1-5) |
| ip_hash | VARCHAR(255) | Hashed IP for duplicate prevention |
| created_at | TIMESTAMP | Creation timestamp |

Unique constraint on (software_id, metric, ip_hash)

### comments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| software_id | VARCHAR(255) | Software identifier |
| user_name | VARCHAR(100) | Comment author |
| comment | TEXT | Comment content |
| ip_hash | VARCHAR(255) | Hashed IP |
| is_approved | BOOLEAN | Moderation status |
| is_spam | BOOLEAN | Spam flag |
| moderated_at | TIMESTAMP | Moderation timestamp |
| moderated_by | VARCHAR(255) | Moderator identifier |
| created_at | TIMESTAMP | Creation timestamp |

## Environment Variables

### Backend (.env)

```env
PORT=3021
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/techbase
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:4321,http://localhost:5173
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3021
```

## Code Style Preferences

- Use Tailwind CSS for styling
- Use Alpine.js for client-side interactivity
- Follow Astro's component structure
- Keep logic in separate utility files
- Use TypeScript for type safety
- Backend follows NestJS module pattern

## Key Directories

### Web App

- `src/components/`: UI components (SearchBar, VotingSystem, etc.)
- `src/content/`: Content collections (software data in DE/EN)
- `src/utils/`: Utility functions (i18n, search, api client)
- `src/pages/`: Page routes and API endpoints
- `src/layouts/`: Page layouts (Base, Admin)

### Backend

- `src/db/schema/`: Drizzle ORM schemas
- `src/votes/`: Voting module (controller, service, DTOs)
- `src/comments/`: Comments module with moderation
- `src/health/`: Health check endpoint
