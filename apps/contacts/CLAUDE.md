# Contacts Project Guide

## Project Structure

```
apps/contacts/
├── apps/
│   ├── backend/      # NestJS API server (@contacts/backend) - Port 3015
│   ├── landing/      # Astro marketing landing page (@contacts/landing)
│   ├── web/          # SvelteKit web application (@contacts/web) - Port 5184
│   └── mobile/       # Expo/React Native mobile app (@contacts/mobile)
├── packages/
│   └── shared/       # Shared types, utils, configs (@contacts/shared)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm contacts:dev                   # Run all contacts apps
pnpm dev:contacts:mobile            # Start mobile app
pnpm dev:contacts:web               # Start web app
pnpm dev:contacts:landing           # Start landing page
pnpm dev:contacts:backend           # Start backend server
pnpm dev:contacts:app               # Start web + backend together
```

### Mobile App (apps/contacts/apps/mobile)

```bash
pnpm dev                         # Start Expo dev server
pnpm ios                         # Run on iOS simulator
pnpm android                     # Run on Android emulator
```

### Backend (apps/contacts/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/contacts/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/contacts/apps/landing)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
```

## Technology Stack

- **Mobile**: React Native 0.81 + Expo SDK 54, NativeWind, Expo Router, Zustand
- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Landing**: Astro 5.x, Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Types**: TypeScript 5.x

## Architecture

### Backend API Endpoints

| Endpoint                              | Method | Description                |
| ------------------------------------- | ------ | -------------------------- |
| `/api/v1/health`                      | GET    | Health check               |
| `/api/v1/contacts`                    | GET    | Get user's contacts        |
| `/api/v1/contacts`                    | POST   | Create new contact         |
| `/api/v1/contacts/:id`                | GET    | Get contact details        |
| `/api/v1/contacts/:id`                | PATCH  | Update contact             |
| `/api/v1/contacts/:id`                | DELETE | Delete contact             |
| `/api/v1/contacts/:id/favorite`       | POST   | Toggle favorite            |
| `/api/v1/contacts/:id/archive`        | POST   | Toggle archive             |
| `/api/v1/contacts/:id/photo`          | POST   | Upload contact photo       |
| `/api/v1/groups`                      | GET    | Get user's groups          |
| `/api/v1/groups`                      | POST   | Create new group           |
| `/api/v1/groups/:id`                  | PATCH  | Update group               |
| `/api/v1/groups/:id`                  | DELETE | Delete group               |
| `/api/v1/groups/:id/contacts`         | POST   | Add contacts to group      |
| `/api/v1/tags`                        | GET    | Get user's tags            |
| `/api/v1/tags`                        | POST   | Create new tag             |
| `/api/v1/tags/:id`                    | DELETE | Delete tag                 |
| `/api/v1/contacts/:id/notes`          | GET    | Get contact notes          |
| `/api/v1/contacts/:id/notes`          | POST   | Add note to contact        |
| `/api/v1/notes/:id`                   | PATCH  | Update note                |
| `/api/v1/notes/:id`                   | DELETE | Delete note                |
| `/api/v1/contacts/:id/activities`     | GET    | Get contact activities     |
| `/api/v1/contacts/:id/activities`     | POST   | Log activity               |
| `/api/v1/import/preview`              | POST   | Preview file import (vCard/CSV) |
| `/api/v1/import/execute`              | POST   | Execute contact import     |
| `/api/v1/import/template/csv`         | GET    | Download CSV template      |
| `/api/v1/google/auth-url`             | GET    | Get Google OAuth URL       |
| `/api/v1/google/callback`             | POST   | Exchange OAuth code        |
| `/api/v1/google/status`               | GET    | Get Google connection status |
| `/api/v1/google/disconnect`           | DELETE | Disconnect Google account  |
| `/api/v1/google/contacts`             | GET    | Fetch Google contacts      |
| `/api/v1/google/import`               | POST   | Import from Google         |
| `/api/v1/export`                      | GET    | Quick export all contacts  |
| `/api/v1/export`                      | POST   | Export with options        |
| `/api/v1/organizations/:orgId/contacts` | GET  | Get organization contacts  |
| `/api/v1/teams/:teamId/contacts`      | GET    | Get team contacts          |
| `/api/v1/contacts/:id/share`          | POST   | Share contact              |

### Database Schema

**contacts** - Contact information

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `first_name`, `last_name`, `display_name`, `nickname` (VARCHAR)
- `email`, `phone`, `mobile` (VARCHAR)
- `street`, `city`, `postal_code`, `country` (VARCHAR)
- `company`, `job_title`, `department` (VARCHAR)
- `website`, `birthday`, `notes`, `photo_url` (VARCHAR/TEXT/DATE)
- `is_favorite`, `is_archived` (BOOLEAN)
- `organization_id`, `team_id` (UUID) - Manacore integration
- `visibility` (VARCHAR) - private/team/organization/public
- `shared_with` (JSONB) - Array of user IDs
- `created_at`, `updated_at` (TIMESTAMP)

**contact_groups** - Groups for organizing contacts

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name` (VARCHAR) - Group name
- `description` (TEXT) - Optional description
- `color` (VARCHAR) - Group color
- `created_at` (TIMESTAMP)

**contact_to_groups** - Many-to-many relation

- `contact_id` (UUID) - Contact reference
- `group_id` (UUID) - Group reference

**contact_tags** - Tags for contacts

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name` (VARCHAR) - Tag name
- `color` (VARCHAR) - Tag color

**contact_to_tags** - Many-to-many relation

- `contact_id` (UUID) - Contact reference
- `tag_id` (UUID) - Tag reference

**contact_notes** - Notes for contacts

- `id` (UUID) - Primary key
- `contact_id` (UUID) - Contact reference
- `user_id` (VARCHAR) - User reference
- `content` (TEXT) - Note content
- `is_pinned` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**contact_activities** - Activity log

- `id` (UUID) - Primary key
- `contact_id` (UUID) - Contact reference
- `user_id` (VARCHAR) - User reference
- `activity_type` (VARCHAR) - created/updated/called/emailed/met/note_added
- `description` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

**connected_accounts** - OAuth provider connections (Google, etc.)

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `provider` (VARCHAR) - Provider name (e.g., 'google')
- `provider_account_id` (VARCHAR) - Provider's user ID
- `provider_email` (VARCHAR) - Provider account email
- `access_token` (TEXT) - OAuth access token (encrypted)
- `refresh_token` (TEXT) - OAuth refresh token (encrypted)
- `token_expires_at` (TIMESTAMP) - Token expiration time
- `scope` (TEXT) - Granted OAuth scopes
- `provider_data` (JSONB) - Additional provider-specific data
- `created_at`, `updated_at` (TIMESTAMP)

### Environment Variables

#### Backend (.env)

```
NODE_ENV=development
PORT=3015
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/contacts
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5184,http://localhost:8081
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=contacts-photos

# Google OAuth (for contacts import)
# Get credentials from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5184/import?tab=google
```

#### Mobile (.env)

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:3015
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

#### Web (.env)

```
PUBLIC_BACKEND_URL=http://localhost:3015
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Packages

### @contacts/shared

- Types: `Contact`, `ContactGroup`, `ContactTag`, `ContactNote`, `ContactActivity`
- Utils: Search, filter, import/export functions
- Configs: App configuration

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks, Zustand for state
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS / NativeWind
- **Formatting**: Prettier with project config

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM
3. **Port**: Backend runs on port 3015, Web on port 5184 by default
4. **Storage**: Uses MinIO/S3 for contact photos via @manacore/shared-storage
5. **Manacore Integration**: Contacts can be linked to Organizations and Teams
