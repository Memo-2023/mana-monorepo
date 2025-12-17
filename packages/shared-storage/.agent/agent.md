# Shared Storage Agent

## Module Information
**Package**: `@manacore/shared-storage`
**Version**: 0.1.0
**Type**: TypeScript compiled library (dist/)
**Dependencies**:
- `@aws-sdk/client-s3` 3.700.0
- `@aws-sdk/s3-request-presigner` 3.700.0

**Build**: Compiled to CommonJS in `dist/` directory

## Identity
I am the Shared Storage Agent, responsible for providing S3-compatible object storage capabilities across all ManaCore backend services. I provide a unified interface for MinIO (local development) and Hetzner Object Storage (production), managing file uploads, downloads, presigned URLs, and a centralized bucket structure for all applications.

## Expertise
- **S3 Compatibility**: Works with MinIO, Hetzner, AWS S3, and any S3-compatible service
- **Unified Bucket Architecture**: Single bucket with `{userId}/{appName}/` folder structure
- **File Operations**: Upload, download, delete, list with presigned URLs
- **Type Safety**: Full TypeScript types for all operations
- **Path Management**: Automatic file key generation with UUIDs
- **MIME Type Detection**: Automatic content type detection from extensions
- **Environment Configuration**: Auto-configuration for development and production

## Code Structure

```
src/
├── index.ts       # Main export barrel
├── types.ts       # TypeScript types and constants
├── client.ts      # S3 StorageClient class
├── factory.ts     # Factory functions for creating clients
└── utils.ts       # File key generation and validation utilities
```

## Key Patterns

### 1. Unified Bucket Architecture
Single bucket for all ManaCore apps with organized folder structure:

```
manacore-storage/
├── {userId}/
│   ├── picture/
│   │   ├── {uuid}.jpg
│   │   └── {uuid}.png
│   ├── chat/
│   │   ├── attachments/{uuid}.pdf
│   │   └── avatars/{uuid}.jpg
│   ├── contacts/
│   │   └── {uuid}.vcf
│   └── ...
```

**Benefits:**
- Single bucket simplifies management and costs
- User-scoped folders for data isolation
- App-specific subfolders for organization
- Easy to list all files for a user/app

### 2. Storage Client Pattern
Main class for all S3 operations:

```typescript
import { createUnifiedStorage, generateStorageKey, APPS } from '@manacore/shared-storage';

const storage = createUnifiedStorage();

// Upload file
const key = generateStorageKey('user-123', APPS.PICTURE, 'photo.jpg');
const result = await storage.upload(key, imageBuffer, {
  contentType: 'image/jpeg',
  public: true,
  cacheControl: 'max-age=31536000'
});
// result: { key, url?, etag? }

// Download file
const buffer = await storage.download(key);

// Delete file
await storage.delete(key);

// Check existence
const exists = await storage.exists(key);

// List files
const files = await storage.list('user-123/picture/');
// files: [{ key, size, lastModified, etag }]
```

### 3. Presigned URL Pattern
Generate temporary signed URLs for client-side uploads/downloads:

```typescript
// Upload URL (for client-side direct uploads)
const uploadUrl = await storage.getUploadUrl(key, {
  expiresIn: 3600 // 1 hour
});
// Client can PUT to this URL

// Download URL (for private files)
const downloadUrl = await storage.getDownloadUrl(key, {
  expiresIn: 900 // 15 minutes
});
// Client can GET from this URL

// Public URL (if bucket has public access)
const publicUrl = storage.getPublicUrl(key);
// Direct URL (no expiration)
```

### 4. File Key Generation Pattern
Utility functions for consistent key naming:

```typescript
import { generateStorageKey, generateFileKey, APPS } from '@manacore/shared-storage';

// Unified bucket key (recommended)
const key = generateStorageKey('user-123', APPS.PICTURE, 'photo.jpg');
// => 'user-123/picture/{uuid}.jpg'

const key2 = generateStorageKey('user-123', APPS.CHAT, 'doc.pdf', 'attachments');
// => 'user-123/chat/attachments/{uuid}.pdf'

// Generic file key
const key3 = generateFileKey('image.png', 'folder1', 'folder2');
// => 'folder1/folder2/{uuid}.png'

// User-scoped key
const key4 = generateUserFileKey('user-123', 'avatar.png');
// => 'users/user-123/{uuid}.png'
```

### 5. Environment Configuration Pattern
Auto-configures based on environment:

```typescript
import { getStorageConfig, createStorageClient } from '@manacore/shared-storage';

// Get config (auto-detects MinIO in dev)
const config = getStorageConfig();
// Development: Uses MinIO defaults (localhost:9000)
// Production: Reads from S3_ENDPOINT, S3_ACCESS_KEY, etc.

// Create custom client
const storage = createStorageClient('my-bucket', {
  endpoint: 'https://storage.example.com',
  region: 'eu-central-1',
  accessKeyId: 'key',
  secretAccessKey: 'secret'
});
```

## Integration Points

### With Backend Services (NestJS)
Primary use case - file storage in backends:

```typescript
// app.module.ts
import { createUnifiedStorage } from '@manacore/shared-storage';

@Module({
  providers: [
    {
      provide: 'STORAGE_CLIENT',
      useValue: createUnifiedStorage()
    }
  ]
})

// service.ts
import { StorageClient, generateStorageKey, APPS } from '@manacore/shared-storage';

@Injectable()
export class ImageService {
  constructor(@Inject('STORAGE_CLIENT') private storage: StorageClient) {}

  async uploadUserImage(userId: string, file: Buffer, filename: string) {
    const key = generateStorageKey(userId, APPS.PICTURE, filename);
    const result = await this.storage.upload(key, file, {
      contentType: getContentType(filename),
      public: true
    });
    return result;
  }
}
```

### With File Upload Utilities
```typescript
import {
  getContentType,
  validateFileSize,
  validateFileExtension,
  IMAGE_EXTENSIONS
} from '@manacore/shared-storage';

// Validate before upload
if (!validateFileSize(file.size, 10)) {
  throw new Error('File too large (max 10MB)');
}

if (!validateFileExtension(filename, IMAGE_EXTENSIONS)) {
  throw new Error('Invalid file type');
}

const contentType = getContentType(filename);
// Auto-detects: 'image/jpeg', 'image/png', etc.
```

### With Frontend (Presigned URLs)
```typescript
// Backend: Generate upload URL
const uploadUrl = await storage.getUploadUrl(key);

// Frontend: Direct upload to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});
```

## Available App Names

```typescript
import { APPS, type AppName } from '@manacore/shared-storage';

APPS.PICTURE     // 'picture'
APPS.CHAT        // 'chat'
APPS.MANADECK    // 'manadeck'
APPS.NUTRIPHI    // 'nutriphi'
APPS.PRESI       // 'presi'
APPS.CALENDAR    // 'calendar'
APPS.CONTACTS    // 'contacts'
APPS.STORAGE     // 'storage'
APPS.MAIL        // 'mail'
APPS.INVENTORY   // 'inventory'
APPS.MANACORE    // 'manacore'
```

## Environment Variables

### Required (Production)
```bash
S3_ENDPOINT=https://storage.example.com
S3_REGION=eu-central-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### Optional
```bash
MANACORE_STORAGE_PUBLIC_URL=https://cdn.example.com/manacore-storage
NODE_ENV=development  # Auto-uses MinIO defaults
```

### MinIO Defaults (Development)
```bash
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

## How to Use

### Installation
This package is internal to the monorepo. Add to dependencies in `package.json`:

```json
{
  "dependencies": {
    "@manacore/shared-storage": "workspace:*"
  }
}
```

### Import Examples

```typescript
// Client and factory
import { StorageClient, createUnifiedStorage, createStorageClient } from '@manacore/shared-storage';

// Utilities
import {
  generateStorageKey,
  generateFileKey,
  generateUserFileKey,
  getContentType,
  validateFileSize,
  validateFileExtension
} from '@manacore/shared-storage';

// Constants
import { UNIFIED_BUCKET, APPS, IMAGE_EXTENSIONS, DOCUMENT_EXTENSIONS } from '@manacore/shared-storage';

// Types
import type {
  StorageConfig,
  BucketConfig,
  AppName,
  UploadOptions,
  PresignedUrlOptions,
  UploadResult,
  FileInfo
} from '@manacore/shared-storage';
```

### Best Practices

#### 1. Use Unified Bucket
Always use the unified bucket structure for consistency:

```typescript
const storage = createUnifiedStorage();
const key = generateStorageKey(userId, APPS.PICTURE, filename);
```

#### 2. Set Proper Content Types
Always specify content type for proper browser handling:

```typescript
await storage.upload(key, buffer, {
  contentType: getContentType(filename),
  cacheControl: 'max-age=31536000' // 1 year for immutable files
});
```

#### 3. Validate Before Upload
Validate files before uploading to prevent errors:

```typescript
if (!validateFileSize(file.size, 10)) {
  return err('FILE_TOO_LARGE', 'Max size is 10MB');
}

if (!validateFileExtension(filename, IMAGE_EXTENSIONS)) {
  return err('INVALID_FILE_TYPE', 'Only images allowed');
}
```

#### 4. Use Presigned URLs for Client Uploads
For large files, use presigned URLs to avoid proxying through backend:

```typescript
// Backend
const uploadUrl = await storage.getUploadUrl(key, { expiresIn: 3600 });
return { uploadUrl, key };

// Frontend
await fetch(uploadUrl, { method: 'PUT', body: file });
```

#### 5. List with Prefix
Use prefixes to list files for specific users/apps:

```typescript
// All files for a user in an app
const files = await storage.list(`${userId}/${APPS.PICTURE}/`);

// All files in a subfolder
const files = await storage.list(`${userId}/${APPS.CHAT}/attachments/`);
```

### Common Use Cases

1. **User Profile Pictures**
   ```typescript
   const key = generateStorageKey(userId, APPS.MANACORE, 'avatar.jpg', 'avatars');
   await storage.upload(key, buffer, { contentType: 'image/jpeg', public: true });
   ```

2. **Chat Attachments**
   ```typescript
   const key = generateStorageKey(userId, APPS.CHAT, filename, 'attachments');
   const uploadUrl = await storage.getUploadUrl(key);
   // Return uploadUrl to client for direct upload
   ```

3. **AI-Generated Images**
   ```typescript
   const key = generateStorageKey(userId, APPS.PICTURE, `${promptId}.png`);
   await storage.upload(key, imageBuffer, { contentType: 'image/png', public: true });
   const publicUrl = storage.getPublicUrl(key);
   ```

4. **Document Storage**
   ```typescript
   const key = generateStorageKey(userId, APPS.CONTACTS, 'contacts.vcf', 'exports');
   await storage.upload(key, vcfBuffer, { contentType: 'text/vcard' });
   const downloadUrl = await storage.getDownloadUrl(key, { expiresIn: 900 });
   ```

## File Validation Constants

```typescript
IMAGE_EXTENSIONS      // ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
DOCUMENT_EXTENSIONS   // ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
AUDIO_EXTENSIONS      // ['.mp3', '.wav', '.ogg', '.m4a']
VIDEO_EXTENSIONS      // ['.mp4', '.webm', '.mov', '.avi']
```

## Advanced Operations

### Direct S3 Client Access
For advanced operations not covered by the wrapper:

```typescript
const s3Client = storage.getS3Client();
// Use with @aws-sdk/client-s3 commands
```

### Custom Bucket
For services that need their own bucket:

```typescript
const storage = createStorageClient({
  name: 'my-app-bucket',
  publicUrl: 'https://cdn.example.com/my-app-bucket'
});
```

## Notes

- **Compiled Package**: This package is compiled to `dist/` before use
- **S3 Compatible**: Works with MinIO, Hetzner, AWS S3, DigitalOcean Spaces, etc.
- **Path Style**: Automatically uses path-style URLs for MinIO/localhost
- **UUID Keys**: All file keys use UUIDs to prevent collisions and expose filenames
- **Public vs Private**: Set `public: true` for public-read ACL, omit for private files
- **Presigned URL Expiration**: Default 3600s (1 hour), configurable per request
- **Buffer Handling**: Upload accepts Buffer, Uint8Array, string, or ReadableStream
- **Error Handling**: AWS SDK throws errors, wrap calls in try/catch or use Result pattern
