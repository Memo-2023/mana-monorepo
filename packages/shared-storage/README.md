# @manacore/shared-storage

S3-compatible object storage client for the Manacore monorepo. Uses MinIO for local development and Hetzner Object Storage in production.

## Architecture

All apps use a **single unified bucket** with folder structure:

```
manacore-storage/
├── {userId}/
│   ├── picture/...      # Picture app files
│   ├── chat/...         # Chat attachments
│   ├── manadeck/...     # Card assets
│   ├── contacts/...     # Contact avatars
│   └── ...
```

## Setup

### Local Development

```bash
# Start MinIO with Docker
pnpm docker:up

# MinIO Console: http://localhost:9001
# Username: minioadmin
# Password: minioadmin
```

### Production (Hetzner Object Storage)

1. Create Hetzner Object Storage in [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Generate S3 credentials (Access Key + Secret Key)
3. Run the setup script:

```bash
export S3_ENDPOINT="https://fsn1.your-objectstorage.com"
export S3_ACCESS_KEY="your-access-key"
export S3_SECRET_KEY="your-secret-key"
./scripts/setup-hetzner-storage.sh
```

## Usage

```typescript
import {
  createUnifiedStorage,
  generateStorageKey,
  getContentType,
  APPS,
} from '@manacore/shared-storage';

// Create storage client
const storage = createUnifiedStorage();

// Generate a key for a user's file
const key = generateStorageKey('user-123', APPS.PICTURE, 'photo.jpg');
// => 'user-123/picture/a1b2c3d4-uuid.jpg'

// Upload a file
const result = await storage.upload(key, imageBuffer, {
  contentType: getContentType('photo.jpg'),
  public: true,
});

console.log(result.url);
// => 'http://localhost:9000/manacore-storage/user-123/picture/uuid.jpg'

// Download a file
const buffer = await storage.download(key);

// Delete a file
await storage.delete(key);

// List files for a user's app
const files = await storage.list('user-123/picture/');

// Generate presigned URLs
const uploadUrl = await storage.getUploadUrl('temp/upload.png', { expiresIn: 3600 });
const downloadUrl = await storage.getDownloadUrl(key, { expiresIn: 3600 });
```

## Available Apps

```typescript
import { APPS } from '@manacore/shared-storage';

APPS.PICTURE    // 'picture'
APPS.CHAT       // 'chat'
APPS.MANADECK   // 'manadeck'
APPS.NUTRIPHI   // 'nutriphi'
APPS.PRESI      // 'presi'
APPS.CALENDAR   // 'calendar'
APPS.CONTACTS   // 'contacts'
APPS.STORAGE    // 'storage'
APPS.MAIL       // 'mail'
APPS.INVENTORY  // 'inventory'
APPS.MANACORE   // 'manacore'
```

## Key Generation Utilities

```typescript
import {
  generateStorageKey,
  generateFileKey,
  generateUserFileKey,
  getContentType,
  validateFileSize,
  validateFileExtension,
  IMAGE_EXTENSIONS,
} from '@manacore/shared-storage';

// Recommended: App-scoped key
generateStorageKey('user-123', 'picture', 'photo.jpg');
// => 'user-123/picture/uuid.jpg'

// With subfolder
generateStorageKey('user-123', 'chat', 'doc.pdf', 'attachments');
// => 'user-123/chat/attachments/uuid.pdf'

// Generic file key
generateFileKey('photo.jpg', 'uploads', '2024');
// => 'uploads/2024/uuid.jpg'

// Get MIME type
getContentType('image.png'); // => 'image/png'

// Validate file
validateFileSize(fileSize, 10); // max 10MB
validateFileExtension('photo.jpg', IMAGE_EXTENSIONS);
```

## Environment Variables

### Local Development (MinIO)

Already configured in `.env.development`:

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
MANACORE_STORAGE_PUBLIC_URL=http://localhost:9000/manacore-storage
```

### Production (Hetzner)

```env
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_REGION=fsn1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
MANACORE_STORAGE_PUBLIC_URL=https://manacore-storage.fsn1.your-objectstorage.com
```

## Docker Commands

```bash
# Start infrastructure (Postgres, Redis, MinIO)
pnpm docker:up

# View MinIO logs
docker logs manacore-minio

# View bucket init logs
docker logs manacore-minio-init
```
