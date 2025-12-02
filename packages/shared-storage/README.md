# @manacore/shared-storage

S3-compatible object storage client for the Manacore monorepo. Uses MinIO for local development and Hetzner Object Storage in production.

## Setup

### Local Development

1. Start MinIO with Docker:

```bash
pnpm docker:up
```

2. Access MinIO Console at http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

### Pre-created Buckets

The following buckets are automatically created:

| Bucket | Project | Purpose |
|--------|---------|---------|
| `picture-storage` | Picture | Generated AI images |
| `chat-storage` | Chat | User file uploads |
| `manadeck-storage` | ManaDeck | Card/deck assets |
| `nutriphi-storage` | NutriPhi | Meal photos |
| `presi-storage` | Presi | Presentation slides |
| `calendar-storage` | Calendar | Calendar attachments |
| `contacts-storage` | Contacts | Contact avatars/files |
| `storage-storage` | Storage | Cloud drive files |

## Usage

### Basic Usage

```typescript
import { createPictureStorage, generateUserFileKey, getContentType } from '@manacore/shared-storage';

// Create client for Picture project
const storage = createPictureStorage();

// Upload a file
const key = generateUserFileKey('user-123', 'avatar.png');
const result = await storage.upload(key, imageBuffer, {
  contentType: getContentType('avatar.png'),
  public: true,
});

console.log(result.url); // http://localhost:9000/picture-storage/users/user-123/uuid.png

// Download a file
const buffer = await storage.download(key);

// Delete a file
await storage.delete(key);

// List files
const files = await storage.list('users/user-123/');

// Generate presigned URLs
const uploadUrl = await storage.getUploadUrl('temp/upload.png', { expiresIn: 3600 });
const downloadUrl = await storage.getDownloadUrl(key, { expiresIn: 3600 });
```

### Custom Configuration

```typescript
import { createStorageClient, BUCKETS } from '@manacore/shared-storage';

// Override default config
const storage = createStorageClient(BUCKETS.PICTURE, {
  endpoint: 'https://fsn1.your-objectstorage.com',
  region: 'fsn1',
  accessKeyId: process.env.HETZNER_ACCESS_KEY,
  secretAccessKey: process.env.HETZNER_SECRET_KEY,
  forcePathStyle: false,
});
```

### Available Factory Functions

```typescript
import {
  createPictureStorage,
  createChatStorage,
  createManaDeckStorage,
  createNutriPhiStorage,
  createPresiStorage,
  createCalendarStorage,
  createContactsStorage,
  createStorageStorage,
} from '@manacore/shared-storage';
```

## Environment Variables

### Local Development (MinIO)

Already configured in `.env.development`:

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

### Production (Hetzner Object Storage)

```env
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_REGION=fsn1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Optional: public URLs for CDN access
PICTURE_STORAGE_PUBLIC_URL=https://picture-storage.fsn1.your-objectstorage.com
NUTRIPHI_S3_PUBLIC_URL=https://nutriphi-storage.fsn1.your-objectstorage.com
```

## Utilities

```typescript
import {
  generateFileKey,
  generateUserFileKey,
  getContentType,
  validateFileSize,
  validateFileExtension,
  IMAGE_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
} from '@manacore/shared-storage';

// Generate unique file key
const key = generateFileKey('photo.jpg', 'uploads', '2024');
// => 'uploads/2024/uuid.jpg'

// User-scoped key
const userKey = generateUserFileKey('user-123', 'avatar.png', 'avatars');
// => 'users/user-123/avatars/uuid.png'

// Get MIME type
const contentType = getContentType('image.png'); // => 'image/png'

// Validate file
const isValidSize = validateFileSize(fileSize, 10); // max 10MB
const isValidType = validateFileExtension('photo.jpg', IMAGE_EXTENSIONS);
```

## Docker Commands

```bash
# Start all infrastructure (Postgres, Redis, MinIO)
pnpm docker:up

# Start only database services (no MinIO)
pnpm docker:up:db

# View MinIO logs
docker logs manacore-minio

# View bucket init logs
docker logs manacore-minio-init
```
