# @mana/shared-storage

S3-compatible object storage client for the Mana monorepo. Uses MinIO for S3-compatible storage.

## Setup

### Local Development

```bash
pnpm docker:up          # Start MinIO + Postgres + Redis
pnpm docker:up          # MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
```

### Buckets

Each app gets its own isolated bucket, created automatically by `minio-init`:

| Bucket | Project | Purpose |
|--------|---------|---------|
| `mana-storage` | Mana | Avatars, auth assets |
| `picture-storage` | Picture | AI-generated images |
| `chat-storage` | Chat | User file uploads |
| `cards-storage` | Cards | Card/deck assets |
| `presi-storage` | Presi | Presentation slides |
| `calendar-storage` | Calendar | Calendar attachments |
| `contacts-storage` | Contacts | Contact avatars/files |
| `storage-storage` | Storage | Cloud drive files |
| `mail-storage` | Mail | Email attachments |
| `inventory-storage` | Inventory | Product photos |
| `music-storage` | Music | Music tracks, beats, covers |
| `plants-storage` | Planta | Plant photos |
| `projectdoc-storage` | ProjectDoc | Document files |

## Usage

### Basic Operations

```typescript
import { createPictureStorage, generateUserFileKey, getContentType } from '@mana/shared-storage';

const storage = createPictureStorage();

// Upload
const key = generateUserFileKey('user-123', 'avatar.png');
const result = await storage.upload(key, imageBuffer, {
  contentType: getContentType('avatar.png'),
  public: true,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB limit (works with buffers AND streams)
});

// Download
const buffer = await storage.download(key);
const stream = await storage.downloadStream(key); // Memory-efficient for large files

// Delete
await storage.delete(key);
await storage.deleteMany(['a.png', 'b.png', 'c.png']); // Bulk delete (auto-batches at 1000)
await storage.deleteByPrefix('users/user-123/');         // Delete all user files

// Copy & Move
const copied = await storage.copy('old/file.png', 'new/file.png');
const moved = await storage.move('src/file.png', 'dst/file.png'); // copy + delete

// Metadata (without downloading)
const meta = await storage.getMetadata(key);
// => { contentType: 'image/png', size: 4096, lastModified: Date, etag: '...', metadata: {} }

// Check existence
const exists = await storage.exists(key);

// List files (auto-paginates)
const files = await storage.list('users/user-123/');

// Presigned URLs
const uploadUrl = await storage.getUploadUrl('temp/upload.png', { expiresIn: 3600 });
const downloadUrl = await storage.getDownloadUrl(key);

// Public/CDN URLs
const publicUrl = storage.getPublicUrl(key);
const cdnUrl = storage.getCdnUrl(key); // Falls back to publicUrl if no CDN configured
```

### Generic Factory

```typescript
import { createStorage } from '@mana/shared-storage';

// Instead of app-specific factories:
const storage = createStorage('PICTURE');
const storage = createStorage('CHAT');
const storage = createStorage('MUSIC');
```

App-specific aliases still work: `createPictureStorage()`, `createChatStorage()`, etc.

### Multipart Upload (Server-Side)

For large files uploaded through the backend:

```typescript
const result = await storage.uploadMultipart('video.mp4', largeBuffer, {
  contentType: 'video/mp4',
  maxSizeBytes: 500 * 1024 * 1024, // 500MB limit
});
```

### Presigned Multipart Upload (Browser Direct-Upload)

Skip the backend — browser uploads directly to S3:

```typescript
// 1. Backend: initiate upload
const { uploadId, key } = await storage.createMultipartUpload(
  'users/123/video.mp4',
  'video/mp4'
);

// 2. Backend: generate presigned URLs for each part
const urls = await storage.getMultipartUploadUrls(key, uploadId, numberOfParts);
// => ['https://signed-url-part-1', 'https://signed-url-part-2', ...]

// 3. Browser: PUT each chunk to the corresponding URL
// (returns ETag in response headers)

// 4. Backend: complete upload with ETags from browser
const result = await storage.completeMultipartUpload(key, uploadId, [
  { partNumber: 1, etag: '"etag-from-part-1"' },
  { partNumber: 2, etag: '"etag-from-part-2"' },
]);

// If browser abandons upload:
await storage.abortMultipartUpload(key, uploadId);
```

## Hooks (Upload Events)

Fire-and-forget event system for post-upload processing:

```typescript
const storage = createPictureStorage();

// Thumbnail generation after upload
storage.hooks.on('upload', async ({ key, contentType, sizeBytes }) => {
  if (contentType?.startsWith('image/')) {
    await generateThumbnail(key);
  }
});

// Error logging
storage.hooks.on('upload:error', ({ bucket, key, error }) => {
  logger.error(`Upload failed: ${bucket}/${key}`, error);
});

// Track deletions
storage.hooks.on('delete', ({ bucket, keys }) => {
  logger.info(`Deleted ${keys.length} files from ${bucket}`);
});

// Unsubscribe
const unsub = storage.hooks.on('download', handler);
unsub(); // Remove listener

// Available events: upload, upload:error, delete, delete:error, download
```

## Metrics

### In-Memory (Testing / Local Dev)

```typescript
import { InMemoryMetrics, attachMetrics } from '@mana/shared-storage';

const storage = createPictureStorage();
const metrics = new InMemoryMetrics();
attachMetrics(storage.hooks, metrics);

// After some operations:
console.log(metrics.counters.uploads);    // 5
console.log(metrics.counters.deletes);    // 2
console.log(metrics.sizes);              // [1024, 2048, ...]
```

### Prometheus (NestJS Backends)

```typescript
import { MetricsService } from '@mana/shared-nestjs-metrics';
import { createPictureStorage, createPrometheusCollector, attachMetrics } from '@mana/shared-storage';

@Injectable()
export class StorageService {
  private storage = createPictureStorage();

  constructor(metricsService: MetricsService) {
    const collector = createPrometheusCollector(metricsService);
    attachMetrics(this.storage.hooks, collector);
  }
}
```

This creates the following Prometheus metrics:
- `storage_uploads_total` (counter, labels: bucket, content_type)
- `storage_upload_errors_total` (counter, labels: bucket)
- `storage_deletes_total` (counter, labels: bucket)
- `storage_downloads_total` (counter, labels: bucket)
- `storage_upload_size_bytes` (histogram, labels: bucket, buckets: 1KB-100MB)

## Environment Variables

```env
# Required
S3_ENDPOINT=http://localhost:9000      # MinIO
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Optional
S3_PUBLIC_ENDPOINT=https://minio.mana.how  # For presigned URLs (if internal != public)
PICTURE_STORAGE_PUBLIC_URL=https://...     # Direct public URL per bucket
PICTURE_CDN_URL=https://cdn.example.com   # CDN URL per bucket (getCdnUrl() uses this)
```

## Testing

```bash
cd packages/shared-storage
pnpm test           # Run 104 tests
pnpm test:watch     # Watch mode
pnpm type-check     # TypeScript check
pnpm build          # Build to dist/
```

## API Reference

### StorageClient

| Method | Description |
|--------|-------------|
| `upload(key, body, options?)` | Upload a file (supports maxSizeBytes for buffers and streams) |
| `uploadMultipart(key, body, options?)` | Multipart upload for large files (10MB parts) |
| `download(key)` | Download file to Buffer |
| `downloadStream(key)` | Download as ReadableStream (memory-efficient) |
| `delete(key)` | Delete a file |
| `deleteMany(keys)` | Bulk delete (auto-batches at 1000) |
| `deleteByPrefix(prefix)` | Delete all files matching prefix |
| `copy(src, dest)` | Copy file within bucket |
| `move(src, dest)` | Move file (copy + delete) |
| `exists(key)` | Check if file exists |
| `getMetadata(key)` | Get content-type, size, metadata without download |
| `list(prefix?, maxKeys?)` | List files (auto-paginates) |
| `getUploadUrl(key, options?)` | Presigned PUT URL |
| `getDownloadUrl(key, options?)` | Presigned GET URL |
| `getPublicUrl(key)` | Direct public URL |
| `getCdnUrl(key)` | CDN URL (falls back to public) |
| `createMultipartUpload(key, contentType?)` | Initiate browser direct-upload |
| `getMultipartUploadUrls(key, uploadId, parts)` | Presigned URLs per part |
| `completeMultipartUpload(key, uploadId, parts)` | Finalize multipart upload |
| `abortMultipartUpload(key, uploadId)` | Cancel multipart upload |
| `hooks` | StorageHooks instance for event listeners |
| `getBucketName()` | Get bucket name |
| `getS3Client()` | Get underlying S3Client for advanced use |
