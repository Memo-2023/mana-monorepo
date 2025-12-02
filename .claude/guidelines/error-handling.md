# Error Handling Guidelines

## Philosophy: Go-Style Error Handling

We use **explicit error handling** inspired by Go's error handling pattern. Instead of throwing exceptions everywhere, we return `Result<T>` types that force callers to handle errors explicitly.

### Why?
1. **Explicit over implicit** - Errors are part of the function signature
2. **No surprise exceptions** - You know exactly what can fail
3. **Consistent error codes** - Same codes across frontend and backend
4. **Better error messages** - Structured errors with codes and context

## Package: @manacore/shared-errors

The error handling system is implemented in `packages/shared-errors/`. Import from it:

```typescript
import {
  // Result type and helpers
  Result, AsyncResult, ok, err, isOk, isErr,
  unwrap, unwrapOr, map, andThen, match,
  tryCatch, tryCatchAsync, combine,

  // Error codes
  ErrorCode, ERROR_CODE_TO_HTTP_STATUS,

  // Error classes
  AppError, ValidationError, NotFoundError,
  AuthError, CreditError, ServiceError,
  RateLimitError, NetworkError, DatabaseError,

  // Type guards
  isAppError, isValidationError, isNotFoundError,
  hasErrorCode, isRetryable, getHttpStatus,

  // Utilities
  wrap, toAppError,
} from '@manacore/shared-errors';
```

## Core Types

### Result Type

```typescript
// Result represents success or failure
export type Result<T, E extends AppError = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// Async version for async functions
export type AsyncResult<T, E extends AppError = AppError> = Promise<Result<T, E>>;

// Create success result
const user = ok({ id: '123', name: 'John' });

// Create failure result
const error = err(new NotFoundError('User', userId));
```

### Error Classes

```typescript
// Base error class
class AppError extends Error {
  code: ErrorCode;
  context?: ErrorContext;
  cause?: Error;
}

// Specialized error classes
ValidationError.invalidInput('email', 'must be valid email');
NotFoundError.user(userId);
AuthError.tokenExpired();
CreditError.insufficient(required, available);
ServiceError.generation('AI generation failed');
RateLimitError.exceeded(retryAfter);
NetworkError.timeout();
DatabaseError.constraint('unique_email');
```

## Error Codes

All error codes are defined in `@manacore/shared-errors`:

```typescript
export enum ErrorCode {
  // Validation (400)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Authentication (401)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization (403)
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_OWNED = 'RESOURCE_NOT_OWNED',

  // Not Found (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Payment/Credit (402)
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

  // Conflict (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Service Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### HTTP Status Mapping

```typescript
import { ERROR_CODE_TO_HTTP_STATUS, getHttpStatus } from '@manacore/shared-errors';

// Get HTTP status for an error code
const status = ERROR_CODE_TO_HTTP_STATUS[ErrorCode.RESOURCE_NOT_FOUND]; // 404

// Or use helper function
const status = getHttpStatus(error); // Returns appropriate HTTP status
```

### Retryable Errors

```typescript
import { isRetryable } from '@manacore/shared-errors';

// Check if an error is worth retrying
if (isRetryable(error)) {
  await delay(1000);
  return retry(operation);
}
```

## Backend Usage

### Service Layer

```typescript
// src/files/file.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  AsyncResult, ok, err, isOk,
  NotFoundError, DatabaseError, ValidationError
} from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { files, File, NewFile } from '../db/schema';

@Injectable()
export class FileService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async findById(id: string, userId: string): AsyncResult<File> {
    try {
      const [file] = await this.db
        .select()
        .from(files)
        .where(and(
          eq(files.id, id),
          eq(files.userId, userId),
          eq(files.isDeleted, false)
        ));

      if (!file) {
        return err(new NotFoundError('File', id));
      }

      return ok(file);
    } catch (error) {
      return err(DatabaseError.query('Failed to fetch file', error));
    }
  }

  async create(userId: string, dto: CreateFileDto): AsyncResult<File> {
    // Validation
    if (!dto.name?.trim()) {
      return err(ValidationError.required('name'));
    }

    try {
      const newFile: NewFile = {
        userId,
        name: dto.name.trim(),
        mimeType: dto.mimeType,
        size: dto.size,
        storagePath: dto.storagePath,
        storageKey: dto.storageKey,
        parentFolderId: dto.folderId,
      };

      const [created] = await this.db.insert(files).values(newFile).returning();
      return ok(created);
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        return err(DatabaseError.constraint('A file with this name already exists'));
      }
      return err(DatabaseError.query('Failed to create file', error));
    }
  }

  async delete(id: string, userId: string): AsyncResult<void> {
    const fileResult = await this.findById(id, userId);
    if (!isOk(fileResult)) {
      return fileResult;  // Propagate error
    }

    try {
      await this.db
        .update(files)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(files.id, id));

      return ok(undefined);
    } catch (error) {
      return err(DatabaseError.query('Failed to delete file', error));
    }
  }
}
```

### Controller Layer

```typescript
// src/files/file.controller.ts
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { isOk, unwrap } from '@manacore/shared-errors';
import { FileService } from './file.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.findById(id, user.userId);

    if (!isOk(result)) {
      throw result.error;  // AppError extends Error, caught by exception filter
    }

    return { file: result.value };
  }

  @Post()
  async createFile(
    @Body() dto: CreateFileDto,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.create(user.userId, dto);

    if (!isOk(result)) {
      throw result.error;
    }

    return { file: result.value };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    // Alternative: use unwrap() which throws on error
    unwrap(await this.fileService.delete(id, user.userId));

    return { success: true };
  }
}
```

### Exception Filter

The package provides a ready-to-use exception filter:

```typescript
// In main.ts or app.module.ts
import { AppExceptionFilter } from '@manacore/shared-errors/nestjs';

// Apply globally
app.useGlobalFilters(new AppExceptionFilter());
```

The filter automatically:
- Maps `ErrorCode` to HTTP status codes
- Returns consistent JSON error format
- Logs server errors (5xx)

Custom filter example:

```typescript
// src/common/filters/app-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AppError, isAppError, getHttpStatus } from '@manacore/shared-errors';

@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AppException');

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = getHttpStatus(exception);

    // Log server errors
    if (status >= 500) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      ok: false,
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }
}
```

## Frontend Usage

### API Client

```typescript
// lib/api/client.ts
import { Result, err, ErrorCode, AppError } from '@manacore/shared-errors';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: AppError;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<Result<T>> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const json: ApiResponse<T> = await response.json();

    if (!json.ok || json.error) {
      return {
        ok: false,
        error: json.error ?? {
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Request failed',
        },
      };
    }

    return { ok: true, data: json.data as T };
  } catch (error) {
    return err(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Network request failed');
  }
}

// Typed API methods
export const api = {
  files: {
    get: (id: string) => apiRequest<File>(`/files/${id}`),
    list: (folderId?: string) => apiRequest<File[]>(`/files?folderId=${folderId ?? ''}`),
    create: (data: CreateFileDto) => apiRequest<File>('/files', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest<void>(`/files/${id}`, { method: 'DELETE' }),
  },
};
```

### Component Usage (Svelte 5)

```svelte
<script lang="ts">
  import { api } from '$lib/api/client';
  import { ErrorCode } from '@manacore/shared-errors';

  let files = $state<File[]>([]);
  let error = $state<string | null>(null);
  let loading = $state(false);

  async function loadFiles() {
    loading = true;
    error = null;

    const result = await api.files.list();

    if (!result.ok) {
      // Handle specific error codes
      switch (result.error.code) {
        case ErrorCode.UNAUTHORIZED:
          goto('/login');
          break;
        case ErrorCode.FORBIDDEN:
          error = 'You do not have permission to view these files';
          break;
        default:
          error = result.error.message;
      }
    } else {
      files = result.data;
    }

    loading = false;
  }

  async function deleteFile(id: string) {
    const result = await api.files.delete(id);

    if (!result.ok) {
      showToast({ type: 'error', message: result.error.message });
      return;
    }

    files = files.filter(f => f.id !== id);
    showToast({ type: 'success', message: 'File deleted' });
  }
</script>
```

### Component Usage (React Native)

```typescript
// hooks/useFiles.ts
import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { ErrorCode, Result, AppError } from '@manacore/shared-errors';

export function useFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await api.files.list();

    if (!result.ok) {
      setError(result.error);
    } else {
      setFiles(result.data);
    }

    setLoading(false);
  }, []);

  const deleteFile = useCallback(async (id: string): Promise<boolean> => {
    const result = await api.files.delete(id);

    if (!result.ok) {
      return false;
    }

    setFiles(prev => prev.filter(f => f.id !== id));
    return true;
  }, []);

  return { files, loading, error, loadFiles, deleteFile };
}
```

## Error Chaining

### Wrapping Errors with Context

```typescript
async function processUpload(userId: string, file: File): Promise<Result<FileRecord>> {
  // Validate file
  const validationResult = validateFile(file);
  if (!validationResult.ok) {
    return validationResult;  // Return validation error as-is
  }

  // Upload to storage
  const uploadResult = await storageService.upload(file);
  if (!uploadResult.ok) {
    // Add context to storage error
    return err(
      ErrorCode.UPLOAD_FAILED,
      `Failed to upload file: ${uploadResult.error.message}`,
      { originalError: uploadResult.error }
    );
  }

  // Save to database
  const saveResult = await fileService.create(userId, {
    name: file.name,
    storagePath: uploadResult.data.path,
  });

  if (!saveResult.ok) {
    // Cleanup on failure
    await storageService.delete(uploadResult.data.path);
    return saveResult;
  }

  return saveResult;
}
```

## Logging Errors

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async create(userId: string, dto: CreateFileDto): Promise<Result<File>> {
    try {
      // ... operation
    } catch (error) {
      // Log full error for debugging
      this.logger.error('Failed to create file', {
        userId,
        fileName: dto.name,
        error: error.message,
        stack: error.stack,
      });

      // Return user-friendly error
      return err(ErrorCode.DATABASE_ERROR, 'Failed to create file');
    }
  }
}
```

## Best Practices

### Do's

1. **Always check result.ok before accessing data**
2. **Use specific error codes** rather than generic ones
3. **Include helpful messages** for debugging
4. **Log errors at the service layer**
5. **Return early on errors** to avoid nested conditions

### Don'ts

1. **Don't throw exceptions in services** - use Result instead
2. **Don't expose internal error details** to users
3. **Don't use try-catch for flow control**
4. **Don't ignore error results** - always handle them
5. **Don't use string error codes** - use the ErrorCode enum
