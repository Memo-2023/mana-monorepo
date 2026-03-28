# mana-media - Unified Media Platform

Central media handling service for all ManaCore applications with content-addressable storage (CAS) and automatic deduplication.

**Stack:** Hono + Bun (migrated from NestJS 2026-03-28)

## Overview

mana-media provides:
- **Content-Addressable Storage** - SHA-256 based deduplication across all apps
- **Upload API** - File uploads with automatic deduplication
- **Matrix Import** - Copy images from Matrix MXC URLs to persistent storage
- **Processing** - Thumbnails, WebP conversion, resizing (via BullMQ)
- **Delivery** - Optimized file serving, on-the-fly transforms

**Port:** 3015 (production)

## Quick Start

```bash
# Start dependencies (Redis + MinIO + PostgreSQL)
pnpm docker:up

# Create database
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE mana_media;"

# Install dependencies
cd services/mana-media/apps/api
pnpm install

# Push schema
pnpm db:push

# Start development server
pnpm dev
```

Service runs on `http://localhost:3015`

## API Endpoints

### Upload
```bash
# Upload file
curl -X POST http://localhost:3015/api/v1/media/upload \
  -F "file=@image.jpg" \
  -F "app=chat" \
  -F "userId=user123"

# Response
{
  "id": "abc123",
  "status": "processing",
  "hash": "sha256...",
  "urls": {
    "original": "http://localhost:3015/api/v1/media/abc123/file",
    "thumbnail": "http://localhost:3015/api/v1/media/abc123/file/thumb"
  }
}
```

### Import from Matrix
```bash
# Import media from Matrix MXC URL
curl -X POST http://localhost:3015/api/v1/media/import/matrix \
  -H "Content-Type: application/json" \
  -d '{
    "mxcUrl": "mxc://matrix.mana.how/abc123",
    "app": "nutriphi",
    "userId": "user-uuid"
  }'
```

### Get Media
```bash
# Get metadata
GET /api/v1/media/:id

# Get by content hash (check if file exists)
GET /api/v1/media/hash/:sha256hash

# Get original file
GET /api/v1/media/:id/file

# Get thumbnail
GET /api/v1/media/:id/file/thumb

# Get medium variant
GET /api/v1/media/:id/file/medium

# On-the-fly transform
GET /api/v1/media/:id/transform?w=400&h=300&fit=cover&format=webp
```

### List & Delete
```bash
# List media (filter by app/user)
GET /api/v1/media?app=chat&userId=user123&limit=50

# Delete
DELETE /api/v1/media/:id
```

## Client Library

```typescript
import { MediaClient } from '@manacore/media-client';

const media = new MediaClient('http://localhost:3050');

// Upload
const result = await media.upload(file, { app: 'chat' });

// Wait for processing
const ready = await media.waitForReady(result.id);

// Get URLs
const thumbUrl = media.getThumbnailUrl(result.id);
const customUrl = media.getTransformUrl(result.id, {
  width: 400,
  format: 'webp'
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      mana-media (Port 3015)                  │
├─────────────────────────────────────────────────────────────┤
│  Upload Module   │  File uploads, Matrix import, dedup      │
│  Matrix Module   │  Download from Matrix MXC URLs           │
│  Process Module  │  Sharp thumbnail generation (BullMQ)     │
│  Storage Module  │  MinIO S3 abstraction                    │
│  Delivery Module │  File serving + on-the-fly transforms    │
│  Database Module │  PostgreSQL + Drizzle ORM                │
└─────────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌────────────┐
    │  Redis  │   │  MinIO  │   │ PostgreSQL │
    │ BullMQ  │   │ Storage │   │   mana_media │
    └─────────┘   └─────────┘   └────────────┘
```

## Database Schema

### media (Content-Addressable Storage)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content_hash | TEXT | SHA-256 hash (unique) |
| original_name | TEXT | Original filename |
| mime_type | TEXT | MIME type |
| size | BIGINT | File size in bytes |
| original_key | TEXT | S3 storage key |
| status | TEXT | uploading/processing/ready/failed |
| thumbnail_key | TEXT | Thumbnail S3 key |
| width/height | INT | Image dimensions |

### media_references (User ownership)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| media_id | UUID | FK to media |
| user_id | UUID | Owner user ID |
| app | TEXT | Source app (nutriphi, contacts, etc.) |
| source_url | TEXT | Original source (e.g., mxc:// URL) |

## Processing Pipeline

| File Type | Generated Variants |
|-----------|-------------------|
| Images    | thumb (200x200), medium (800x800), large (1920x1920) |
| Videos    | (planned) thumbnail, HLS streaming |
| Documents | (planned) thumbnail, text extraction |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3015 | API port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| REDIS_PASSWORD | - | Redis password (optional) |
| S3_ENDPOINT | localhost | MinIO/S3 endpoint |
| S3_PORT | 9000 | MinIO/S3 port |
| S3_USE_SSL | false | Use HTTPS for S3 |
| S3_ACCESS_KEY | minioadmin | S3 access key |
| S3_SECRET_KEY | minioadmin | S3 secret key |
| S3_BUCKET | mana-media | Storage bucket |
| S3_PUBLIC_URL | - | Public URL for media |
| MATRIX_HOMESERVER_URL | https://matrix.mana.how | Matrix homeserver |
| PUBLIC_URL | http://localhost:3015/api/v1 | Public API URL |

## Development

```bash
# Run with watch mode (Bun)
pnpm dev

# Type check
pnpm type-check

# Database commands
cd apps/api
pnpm db:push    # Push schema to database
pnpm db:studio  # Open Drizzle Studio
```

## Storage Layout

```
mana-media bucket/
├── originals/           # Original uploads
│   └── 2026/02/01/
│       └── {id}.{ext}
├── processed/           # Generated variants
│   └── {id}/
│       ├── thumb.webp
│       ├── medium.webp
│       └── large.webp
└── cache/               # Transform cache
    └── {id}_{params}.webp
```

## Roadmap

- [x] v0.1: Basic upload + thumbnails
- [x] v0.2: PostgreSQL persistence with Drizzle ORM
- [x] v0.3: Content-addressable storage with SHA-256 deduplication
- [x] v0.4: Matrix MXC URL import
- [ ] v0.5: Video thumbnails (FFmpeg)
- [ ] v0.6: Chunked upload for large files
- [ ] v0.7: OCR for documents
- [ ] v0.8: Vector search (Qdrant)
- [ ] v1.0: Full production ready

## Integration Example (NutriPhi Bot)

```typescript
// In matrix-nutriphi-bot
const response = await fetch('http://mana-media:3015/api/v1/media/import/matrix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mxcUrl: 'mxc://matrix.mana.how/abc123',
    app: 'nutriphi',
    userId: userUuid,
  }),
});

const { id, hash, urls } = await response.json();
// Store id or hash in meal record for reference
```
