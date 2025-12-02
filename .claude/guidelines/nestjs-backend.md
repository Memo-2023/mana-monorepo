# NestJS Backend Guidelines

## Overview

All backend services use NestJS with a consistent architecture. This guide covers controllers, services, DTOs, modules, and integration with the error handling system.

## Project Structure

```
apps/{project}/apps/backend/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── db/
│   │   ├── schema/                # Drizzle schemas
│   │   ├── connection.ts          # DB singleton
│   │   ├── database.module.ts     # NestJS module
│   │   └── migrations/            # Migration files
│   ├── common/
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Custom guards
│   │   └── decorators/            # Custom decorators
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── {feature}/
│       ├── {feature}.controller.ts
│       ├── {feature}.service.ts
│       ├── {feature}.module.ts
│       ├── {feature}.spec.ts
│       └── dto/
│           ├── create-{feature}.dto.ts
│           └── update-{feature}.dto.ts
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
├── drizzle.config.ts
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## Bootstrap (main.ts)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
  ];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true,           // Auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AppExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
}

bootstrap();
```

## App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { FileModule } from './file/file.module';
import { FolderModule } from './folder/folder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    FileModule,
    FolderModule,
  ],
})
export class AppModule {}
```

## Controllers

### Basic Pattern

```typescript
// src/file/file.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AppException } from '@manacore/shared-errors';
import { FileService } from './file.service';
import { CreateFileDto, UpdateFileDto, QueryFilesDto } from './dto';

@Controller('files')
@UseGuards(JwtAuthGuard)  // Apply to all routes in controller
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query() query: QueryFilesDto
  ) {
    const result = await this.fileService.findAll(user.userId, query);
    if (!result.ok) throw new AppException(result.error);
    return { files: result.data };
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.findById(id, user.userId);
    if (!result.ok) throw new AppException(result.error);
    return { file: result.data };
  }

  @Post()
  async create(
    @Body() dto: CreateFileDto,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.create(user.userId, dto);
    if (!result.ok) throw new AppException(result.error);
    return { file: result.data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFileDto,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.update(id, user.userId, dto);
    if (!result.ok) throw new AppException(result.error);
    return { file: result.data };
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.fileService.delete(id, user.userId);
    if (!result.ok) throw new AppException(result.error);
    return { success: true };
  }
}
```

### Public Endpoints (No Auth)

```typescript
@Controller('public')
export class PublicController {
  @Get('shares/:token')  // No @UseGuards - public access
  async getSharedItem(@Param('token') token: string) {
    const result = await this.shareService.findByToken(token);
    if (!result.ok) throw new AppException(result.error);
    return { item: result.data };
  }
}
```

## Services

### Basic Pattern with Result Types

```typescript
// src/file/file.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, ok, err, ErrorCode } from '@manacore/shared-errors';
import { DATABASE_CONNECTION, Database } from '../db/database.module';
import { files, File, NewFile } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreateFileDto, UpdateFileDto, QueryFilesDto } from './dto';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async findAll(userId: string, query: QueryFilesDto): Promise<Result<File[]>> {
    try {
      const conditions = [
        eq(files.userId, userId),
        eq(files.isDeleted, false),
      ];

      if (query.folderId) {
        conditions.push(eq(files.parentFolderId, query.folderId));
      }

      const result = await this.db
        .select()
        .from(files)
        .where(and(...conditions))
        .orderBy(desc(files.createdAt))
        .limit(query.limit ?? 50)
        .offset(query.offset ?? 0);

      return ok(result);
    } catch (error) {
      this.logger.error('Failed to fetch files', { userId, error: error.message });
      return err(ErrorCode.DATABASE_ERROR, 'Failed to fetch files');
    }
  }

  async findById(id: string, userId: string): Promise<Result<File>> {
    try {
      const [file] = await this.db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, id),
            eq(files.userId, userId),
            eq(files.isDeleted, false)
          )
        );

      if (!file) {
        return err(ErrorCode.FILE_NOT_FOUND, `File ${id} not found`);
      }

      return ok(file);
    } catch (error) {
      this.logger.error('Failed to fetch file', { id, userId, error: error.message });
      return err(ErrorCode.DATABASE_ERROR, 'Failed to fetch file');
    }
  }

  async create(userId: string, dto: CreateFileDto): Promise<Result<File>> {
    // Validation
    if (!dto.name?.trim()) {
      return err(ErrorCode.MISSING_REQUIRED_FIELD, 'File name is required');
    }

    try {
      const newFile: NewFile = {
        userId,
        name: dto.name.trim(),
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        storagePath: dto.storagePath,
        storageKey: dto.storageKey,
        parentFolderId: dto.folderId ?? null,
      };

      const [created] = await this.db.insert(files).values(newFile).returning();
      return ok(created);
    } catch (error) {
      if (error.code === '23505') {
        return err(ErrorCode.DUPLICATE_ENTRY, 'A file with this name already exists');
      }
      this.logger.error('Failed to create file', { userId, error: error.message });
      return err(ErrorCode.DATABASE_ERROR, 'Failed to create file');
    }
  }

  async update(id: string, userId: string, dto: UpdateFileDto): Promise<Result<File>> {
    // Check ownership first
    const existingResult = await this.findById(id, userId);
    if (!existingResult.ok) return existingResult;

    try {
      const [updated] = await this.db
        .update(files)
        .set({
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.parentFolderId !== undefined && { parentFolderId: dto.parentFolderId }),
          updatedAt: new Date(),
        })
        .where(eq(files.id, id))
        .returning();

      return ok(updated);
    } catch (error) {
      this.logger.error('Failed to update file', { id, error: error.message });
      return err(ErrorCode.DATABASE_ERROR, 'Failed to update file');
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    // Check ownership first
    const existingResult = await this.findById(id, userId);
    if (!existingResult.ok) return existingResult;

    try {
      await this.db
        .update(files)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(files.id, id));

      return ok(undefined);
    } catch (error) {
      this.logger.error('Failed to delete file', { id, error: error.message });
      return err(ErrorCode.DATABASE_ERROR, 'Failed to delete file');
    }
  }
}
```

### Service with External Dependencies

```typescript
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database,
    private readonly storageService: StorageService,
    private readonly fileService: FileService
  ) {}

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    folderId?: string
  ): Promise<Result<File>> {
    // 1. Upload to storage
    const storageResult = await this.storageService.upload(
      generateStorageKey(userId, file.originalname),
      file.buffer,
      { contentType: file.mimetype }
    );

    if (!storageResult.ok) {
      return err(ErrorCode.UPLOAD_FAILED, 'Failed to upload file to storage');
    }

    // 2. Create database record
    const createResult = await this.fileService.create(userId, {
      name: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: storageResult.data.path,
      storageKey: storageResult.data.key,
      folderId,
    });

    if (!createResult.ok) {
      // Cleanup on failure
      await this.storageService.delete(storageResult.data.key);
      return createResult;
    }

    return createResult;
  }
}
```

## DTOs

### Create DTO

```typescript
// src/file/dto/create-file.dto.ts
import { IsString, IsOptional, IsNumber, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @MaxLength(500)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalName?: string;

  @IsString()
  @MaxLength(255)
  mimeType: string;

  @IsNumber()
  @Min(0)
  size: number;

  @IsString()
  @MaxLength(1000)
  storagePath: string;

  @IsString()
  @MaxLength(500)
  storageKey: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;
}
```

### Update DTO (Partial)

```typescript
// src/file/dto/update-file.dto.ts
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @IsOptional()
  @IsUUID()
  parentFolderId?: string | null;
}
```

### Query DTO

```typescript
// src/file/dto/query-files.dto.ts
import { IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryFilesDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
```

### DTO Index

```typescript
// src/file/dto/index.ts
export * from './create-file.dto';
export * from './update-file.dto';
export * from './query-files.dto';
```

## Modules

```typescript
// src/file/file.module.ts
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { UploadService } from './upload.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [FileController],
  providers: [FileService, UploadService],
  exports: [FileService],  // Export for use in other modules
})
export class FileModule {}
```

## Exception Filter

```typescript
// src/common/filters/app-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException, ERROR_STATUS_MAP, ErrorCode } from '@manacore/shared-errors';

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = ERROR_STATUS_MAP[exception.error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    // Log server errors
    if (status >= 500) {
      this.logger.error('Server error', {
        code: exception.error.code,
        message: exception.error.message,
        details: exception.error.details,
      });
    }

    response.status(status).json({
      ok: false,
      error: {
        code: exception.error.code,
        message: exception.error.message,
        ...(process.env.NODE_ENV === 'development' && {
          details: exception.error.details,
        }),
      },
    });
  }
}
```

## File Upload

```typescript
// src/file/file.controller.ts
import { UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
      })
    )
    file: Express.Multer.File,
    @Query('folderId') folderId: string | undefined,
    @CurrentUser() user: CurrentUserData
  ) {
    const result = await this.uploadService.uploadFile(user.userId, file, folderId);
    if (!result.ok) throw new AppException(result.error);
    return { file: result.data };
  }
}
```

## Health Check

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DATABASE_CONNECTION, Database } from '../db/database.module';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  @Get()
  async check() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}
```

## API Response Format

### Success Responses

```typescript
// Single resource
{ file: { id: '...', name: '...', ... } }

// Multiple resources
{ files: [...] }

// With pagination
{ files: [...], total: 100, page: 1, limit: 20 }

// Action success
{ success: true }

// Action with data
{ success: true, message: 'File moved', file: {...} }
```

### Error Responses

```typescript
{
  ok: false,
  error: {
    code: 'ERR_4003',
    message: 'File not found'
  }
}
```

## Environment Variables

```env
# Required
NODE_ENV=development
PORT=3016
DATABASE_URL=postgresql://user:pass@localhost:5432/db
MANA_CORE_AUTH_URL=http://localhost:3001

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Optional - Development bypass
DEV_BYPASS_AUTH=true
DEV_USER_ID=dev-user-123
```
