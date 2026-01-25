# Storage Project Guide

## Project Structure

```
apps/storage/
├── apps/
│   ├── backend/      # NestJS API server (@storage/backend) - Port 3016
│   ├── landing/      # Astro marketing landing page (@storage/landing)
│   └── web/          # SvelteKit web application (@storage/web) - Port 5185
├── packages/
│   └── shared/       # Shared types, utils, configs (@storage/shared)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm storage:dev                   # Run all storage apps
pnpm dev:storage:web               # Start web app
pnpm dev:storage:landing           # Start landing page
pnpm dev:storage:backend           # Start backend server
pnpm dev:storage:app               # Start web + backend together
pnpm storage:db:push               # Push schema to database
pnpm storage:db:studio             # Open Drizzle Studio
pnpm storage:db:seed               # Seed database
```

### Backend (apps/storage/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/storage/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/storage/apps/landing)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
```

## Technology Stack

- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Landing**: Astro 5.x, Tailwind CSS
- **Backend**: NestJS 11, Drizzle ORM, PostgreSQL
- **Storage**: S3-compatible (MinIO local, Hetzner production)
- **Types**: TypeScript 5.x

## Architecture

### Backend API Endpoints

#### Files

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/health`                  | GET    | Health check               |
| `/api/v1/files`                   | GET    | List files (with folderId) |
| `/api/v1/files/:id`               | GET    | Get file details           |
| `/api/v1/files/upload`            | POST   | Upload file (multipart)    |
| `/api/v1/files/:id/download`      | GET    | Download file              |
| `/api/v1/files/:id`               | PATCH  | Update file (rename)       |
| `/api/v1/files/:id/move`          | PATCH  | Move file to folder        |
| `/api/v1/files/:id`               | DELETE | Soft delete file           |
| `/api/v1/files/:id/favorite`      | POST   | Toggle favorite            |
| `/api/v1/files/:id/versions`      | GET    | List file versions         |
| `/api/v1/files/:id/versions`      | POST   | Upload new version         |
| `/api/v1/files/:id/tags`          | POST   | Update file tags           |

#### Folders

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/folders`                 | GET    | List root folders          |
| `/api/v1/folders/:id`             | GET    | Get folder with contents   |
| `/api/v1/folders/:id/tree`        | GET    | Get folder tree (sidebar)  |
| `/api/v1/folders`                 | POST   | Create folder              |
| `/api/v1/folders/:id`             | PATCH  | Update folder              |
| `/api/v1/folders/:id/move`        | PATCH  | Move folder                |
| `/api/v1/folders/:id`             | DELETE | Soft delete folder         |
| `/api/v1/folders/:id/favorite`    | POST   | Toggle favorite            |

#### Shares

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/shares`                  | GET    | List user's shares         |
| `/api/v1/shares`                  | POST   | Create share link          |
| `/api/v1/shares/:id`              | PATCH  | Update share settings      |
| `/api/v1/shares/:id`              | DELETE | Revoke share               |
| `/api/v1/public/shares/:token`    | GET    | Access shared item (public)|
| `/api/v1/public/shares/:token/download` | GET | Download shared file   |

#### Tags

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/tags`                    | GET    | List user's tags           |
| `/api/v1/tags`                    | POST   | Create tag                 |
| `/api/v1/tags/:id`                | PATCH  | Update tag                 |
| `/api/v1/tags/:id`                | DELETE | Delete tag                 |

#### Trash

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/trash`                   | GET    | List trash items           |
| `/api/v1/trash/:id/restore`       | POST   | Restore item               |
| `/api/v1/trash/:id`               | DELETE | Permanently delete         |
| `/api/v1/trash`                   | DELETE | Empty trash                |

#### Search & Favorites

| Endpoint                          | Method | Description                |
| --------------------------------- | ------ | -------------------------- |
| `/api/v1/search?q=...`            | GET    | Search files & folders     |
| `/api/v1/favorites`               | GET    | List favorites             |

### Database Schema

**files** - File metadata

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name` (VARCHAR) - Display name
- `original_name` (VARCHAR) - Original filename
- `mime_type` (VARCHAR) - MIME type
- `size` (BIGINT) - File size in bytes
- `storage_path` (VARCHAR) - Full S3 path
- `storage_key` (VARCHAR) - S3 object key (unique)
- `parent_folder_id` (UUID) - Parent folder reference
- `current_version` (INTEGER) - Current version number
- `is_favorite` (BOOLEAN) - Favorite flag
- `is_deleted` (BOOLEAN) - Soft delete flag
- `deleted_at` (TIMESTAMP) - Deletion timestamp
- `created_at`, `updated_at` (TIMESTAMP)

**folders** - Folder hierarchy

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name` (VARCHAR) - Folder name
- `description` (TEXT) - Optional description
- `parent_folder_id` (UUID) - Self-reference for hierarchy
- `path` (TEXT) - Materialized path (e.g., /root/subfolder)
- `depth` (INTEGER) - Depth in hierarchy
- `is_favorite` (BOOLEAN) - Favorite flag
- `is_deleted` (BOOLEAN) - Soft delete flag
- `deleted_at` (TIMESTAMP) - Deletion timestamp
- `created_at`, `updated_at` (TIMESTAMP)

**file_versions** - Version history

- `id` (UUID) - Primary key
- `file_id` (UUID) - File reference
- `version_number` (INTEGER) - Version number
- `storage_path` (VARCHAR) - S3 path for this version
- `storage_key` (VARCHAR) - S3 key for this version
- `size` (BIGINT) - Version size
- `comment` (TEXT) - Version comment
- `created_by` (VARCHAR) - User who created version
- `created_at` (TIMESTAMP)

**shares** - Sharing links

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - Owner reference
- `file_id` (UUID) - Shared file (nullable)
- `folder_id` (UUID) - Shared folder (nullable)
- `share_type` (VARCHAR) - 'file' or 'folder'
- `share_token` (VARCHAR) - Unique public token
- `access_level` (VARCHAR) - 'view', 'edit', 'download'
- `password` (VARCHAR) - Optional password hash
- `max_downloads` (INTEGER) - Download limit
- `download_count` (INTEGER) - Current downloads
- `expires_at` (TIMESTAMP) - Expiration date
- `created_at` (TIMESTAMP)

**tags** - User tags

- `id` (UUID) - Primary key
- `user_id` (VARCHAR) - User reference
- `name` (VARCHAR) - Tag name
- `color` (VARCHAR) - Tag color
- `created_at` (TIMESTAMP)

**file_tags** - Many-to-many relation

- `file_id` (UUID) - File reference
- `tag_id` (UUID) - Tag reference

### Environment Variables

#### Backend (.env)

```
NODE_ENV=development
PORT=3016
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/storage
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5185,http://localhost:8081
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
STORAGE_S3_PUBLIC_URL=http://localhost:9000/storage-storage
MAX_FILE_SIZE=104857600
MAX_FILES_PER_UPLOAD=10
```

#### Web (.env)

```
PUBLIC_BACKEND_URL=http://localhost:3016
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Packages

### @storage/shared

- Types: `File`, `Folder`, `FileVersion`, `Share`, `Tag`
- Utils: File type detection, size formatting, path utilities

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS
- **Formatting**: Prettier with project config

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM
3. **Port**: Backend runs on port 3016, Web on port 5185 by default
4. **Storage**: Uses MinIO/S3 for file storage via @manacore/shared-storage
5. **Bucket**: `storage-storage` bucket for all files
6. **Soft Delete**: Files/folders are soft-deleted first (trash), then permanently deleted
7. **Versioning**: Files support version history, each version stored separately in S3
8. **Sharing**: Public links with optional password, download limits, and expiration
