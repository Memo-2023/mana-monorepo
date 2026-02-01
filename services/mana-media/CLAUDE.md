# mana-media - Unified Media Platform

Central media handling service for all ManaCore applications.

## Overview

mana-media provides:
- **Upload API** - Chunked uploads, deduplication
- **Processing** - Thumbnails, WebP conversion, resizing
- **Delivery** - Optimized file serving, on-the-fly transforms
- **Search** (planned) - Vector-based semantic search

## Quick Start

```bash
# Start dependencies (Redis + MinIO)
docker compose up redis minio -d

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Service runs on `http://localhost:3050`

## API Endpoints

### Upload
```bash
# Upload file
curl -X POST http://localhost:3050/api/v1/media/upload \
  -F "file=@image.jpg" \
  -F "app=chat" \
  -F "userId=user123"

# Response
{
  "id": "abc123",
  "status": "processing",
  "urls": {
    "original": "http://localhost:3050/api/v1/media/abc123/file",
    "thumbnail": "http://localhost:3050/api/v1/media/abc123/file/thumb"
  }
}
```

### Get Media
```bash
# Get metadata
GET /api/v1/media/:id

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
# List media
GET /api/v1/media?app=chat&limit=50

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
┌─────────────────────────────────────────────────┐
│                  mana-media                      │
├─────────────────────────────────────────────────┤
│  Upload Module     │  Handles file uploads       │
│  Process Module    │  Sharp/FFmpeg processing    │
│  Storage Module    │  MinIO abstraction          │
│  Delivery Module   │  File serving + transforms  │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐         ┌─────────┐
    │  Redis  │         │  MinIO  │
    │  Queue  │         │ Storage │
    └─────────┘         └─────────┘
```

## Processing Pipeline

| File Type | Generated Variants |
|-----------|-------------------|
| Images    | thumb (200x200), medium (800x800), large (1920x1920) |
| Videos    | (planned) thumbnail, HLS streaming |
| Documents | (planned) thumbnail, text extraction |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3050 | API port |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| S3_ENDPOINT | localhost | MinIO/S3 endpoint |
| S3_PORT | 9000 | MinIO/S3 port |
| S3_ACCESS_KEY | minioadmin | S3 access key |
| S3_SECRET_KEY | minioadmin | S3 secret key |
| S3_BUCKET | mana-media | Storage bucket |

## Development

```bash
# Run with watch mode
pnpm dev

# Type check
pnpm type-check

# Build
pnpm build
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
- [ ] v0.2: Video thumbnails (FFmpeg)
- [ ] v0.3: Chunked upload for large files
- [ ] v0.4: OCR for documents
- [ ] v0.5: Vector search (Qdrant)
- [ ] v1.0: Full production ready
