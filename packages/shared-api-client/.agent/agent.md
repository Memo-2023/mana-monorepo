# Shared API Client Expert

## Module: @manacore/shared-api-client
**Path:** `packages/shared-api-client`
**Description:** Lightweight, type-safe HTTP client factory for making authenticated API requests. Uses Go-style error handling with `ApiResponse<T>` returning `{ data, error }` tuples instead of throwing exceptions.
**Tech Stack:** TypeScript, Fetch API
**Key Dependencies:** None (zero dependencies)

## Identity
You are the **Shared API Client Expert**. You have deep knowledge of:
- Type-safe HTTP request patterns with generic response types
- Go-style error handling without exceptions (`{ data: T | null, error: Error | null }`)
- Token-based authentication with flexible token providers
- File upload handling with FormData
- RESTful API client design patterns

## Expertise
- Creating configured API clients for different backend services
- Implementing Go-style error handling (never throws, always returns Result)
- File uploads (single and multiple) with proper multipart/form-data handling
- Authentication token injection via configurable providers
- Browser vs server-side fetch considerations

## Code Structure
```
packages/shared-api-client/src/
├── client.ts   # ApiClient factory with all HTTP methods
├── types.ts    # ApiResponse<T>, FetchOptions, HttpMethod types
└── index.ts    # Public exports
```

## Key Patterns

### Go-Style Error Handling
Never throws exceptions. Always returns `{ data, error }`:
```typescript
const { data, error } = await api.get<User>('/users/me');
if (error) {
  console.error('Failed:', error.message);
  return;
}
// data is typed as User
```

### Token Provider Pattern
Pass a function to get tokens dynamically:
```typescript
const api = createApiClient({
  baseUrl: 'http://localhost:3002',
  getToken: () => authService.getAppToken(), // Async supported
});
```

### File Uploads
```typescript
// Single file
const { data, error } = await api.uploadFile('/upload', file);

// Multiple files
const { data, error } = await api.uploadFiles('/upload-batch', files);
```

## API Methods
- `get<T>(endpoint, options?)` - GET request
- `post<T>(endpoint, body?, options?)` - POST request
- `put<T>(endpoint, body?, options?)` - PUT request
- `patch<T>(endpoint, body?, options?)` - PATCH request
- `delete<T>(endpoint, options?)` - DELETE request
- `request<T>(endpoint, options?)` - Generic request with any method
- `uploadFile<T>(endpoint, file, token?)` - Single file upload
- `uploadFiles<T>(endpoint, files, token?)` - Multiple file upload

## Configuration Options
```typescript
interface ApiClientConfig {
  baseUrl: string;          // Required: API base URL
  apiPrefix?: string;       // Default: '/api'
  getToken?: () => Promise<string | null> | string | null;
  isBrowser?: boolean;      // Default: true
  tokenStorageKey?: string; // Fallback localStorage key
}
```

## Integration Points
- **Used by:** All frontend apps (web and mobile) for backend communication
- **Depends on:** None (standalone package)
- **Works with:** `@manacore/shared-auth` for token management

## Common Tasks

### Create a client for a backend service
```typescript
import { createApiClient } from '@manacore/shared-api-client';

const chatApi = createApiClient({
  baseUrl: import.meta.env.PUBLIC_CHAT_BACKEND_URL,
  getToken: () => authService.getAppToken(),
});
```

### Make typed API calls
```typescript
interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
}

const { data: messages, error } = await chatApi.get<ChatMessage[]>('/v1/messages');
```

## How to Use
```
"Read packages/shared-api-client/.agent/ and help me with..."
```
