# Security Engineer - Voxel-Lava

## Role Overview

As the Security Engineer for Voxel-Lava, you ensure the game's backend API, authentication system, and data handling are secure. You protect against common vulnerabilities, validate user input, enforce authorization rules, and integrate with the Mana Core Auth Service.

## Responsibilities

### Authentication & Authorization
- Integrate Mana Core Auth Service (EdDSA JWT tokens)
- Validate JWT tokens on protected endpoints
- Enforce level ownership rules (update/delete own levels only)
- Protect spawn points from unauthorized deletion
- Implement rate limiting for level creation

### Input Validation
- Sanitize and validate all user inputs
- Validate voxel data structure (JSONB)
- Prevent malicious level data injection
- Limit level size and complexity
- Validate block types against allowed list

### API Security
- Implement CORS policies
- Add request rate limiting
- Prevent SQL injection (Drizzle ORM)
- Protect against XSS attacks
- Secure error messages (no sensitive data leakage)

### Data Protection
- Ensure user privacy (level ownership, likes)
- Protect against data exfiltration
- Implement proper database indexing
- Monitor for abuse patterns
- Audit logging for sensitive operations

## Authentication Integration

### Mana Core Auth Service

Voxel-Lava uses the centralized Mana Core Auth Service for user authentication.

**Architecture**:
```
Frontend (Web)
    ↓ (Login/Register)
Mana Core Auth Service (port 3001)
    ↓ (Returns JWT token)
Frontend stores token
    ↓ (API requests with Bearer token)
Voxel-Lava Backend (port 3010)
    ↓ (Validates JWT)
Mana Core Auth Service (public key verification)
```

### Backend JWT Validation

#### Guard Implementation
```typescript
// apps/backend/src/common/guards/jwt-auth.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      // Verify with Mana Core Auth public key
      const publicKey = await this.getPublicKey();
      const payload = verify(token, publicKey, {
        algorithms: ['EdDSA'], // Mana Core Auth uses EdDSA
      });

      request.user = payload; // Attach user info to request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async getPublicKey(): Promise<string> {
    const MANA_CORE_AUTH_URL = process.env.MANA_CORE_AUTH_URL;
    const response = await fetch(`${MANA_CORE_AUTH_URL}/api/public-key`);
    const data = await response.json();
    return data.publicKey;
  }
}
```

#### Current User Decorator
```typescript
// apps/backend/src/common/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  // Add other fields from JWT payload
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### Usage in Controllers
```typescript
// apps/backend/src/level/level.controller.ts

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('levels')
export class LevelController {
  constructor(private levelService: LevelService) {}

  // Public endpoint (no auth)
  @Get('public')
  async getPublicLevels(@Query() dto: GetPublicLevelsDto) {
    return this.levelService.findPublicLevels(dto.page, dto.limit);
  }

  // Protected endpoint (requires auth)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserLevels(@CurrentUser() user: CurrentUserData) {
    return this.levelService.findUserLevels(user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createLevel(
    @Body() dto: CreateLevelDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.levelService.create(dto, user.userId);
  }
}
```

### Frontend Token Management

```typescript
// apps/web/src/lib/services/AuthService.ts

// Store token after login
export function storeToken(token: string) {
  localStorage.setItem('auth_token', token);
}

// Get token for API requests
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Remove token on logout
export function clearToken() {
  localStorage.removeItem('auth_token');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Optionally: Decode and check expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
```

```typescript
// apps/web/src/lib/api/client.ts

import { getToken } from '../services/AuthService';

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    clearToken();
    window.location.href = '/login';
  }

  return response;
}
```

## Authorization Rules

### Level Ownership

**Business Rules**:
- Users can only update/delete levels they created
- Users can view all public levels
- Users can view all their own levels (public or private)
- Anonymous users can view public levels

**Implementation**:
```typescript
// apps/backend/src/level/level.service.ts

async update(id: string, dto: UpdateLevelDto, userId: string) {
  const level = await this.findById(id);

  // Authorization check
  if (level.userId !== userId) {
    throw new ForbiddenException('You can only update your own levels');
  }

  // Proceed with update
  const [updated] = await this.db
    .update(levels)
    .set({ ...dto, updatedAt: new Date() })
    .where(eq(levels.id, id))
    .returning();

  return updated;
}

async delete(id: string, userId: string) {
  const level = await this.findById(id);

  // Authorization check
  if (level.userId !== userId) {
    throw new ForbiddenException('You can only delete your own levels');
  }

  // Proceed with deletion
  await this.db.delete(levels).where(eq(levels.id, id));

  return { success: true };
}
```

### Like Authorization

**Business Rules**:
- Users can like any public level
- Users can unlike levels they previously liked
- Users cannot like their own levels (optional - implement if desired)

**Implementation**:
```typescript
async toggleLike(levelId: string, userId: string) {
  // Check if level exists and is public
  const level = await this.findById(levelId);
  if (!level.isPublic) {
    throw new ForbiddenException('Cannot like private levels');
  }

  // Optional: Prevent self-liking
  if (level.userId === userId) {
    throw new ForbiddenException('Cannot like your own levels');
  }

  // Check if already liked
  const [existingLike] = await this.db
    .select()
    .from(levelLikes)
    .where(and(
      eq(levelLikes.levelId, levelId),
      eq(levelLikes.userId, userId)
    ));

  if (existingLike) {
    // Unlike
    await this.db.delete(levelLikes).where(eq(levelLikes.id, existingLike.id));
    await this.db
      .update(levels)
      .set({ likesCount: sql`${levels.likesCount} - 1` })
      .where(eq(levels.id, levelId));
    return { liked: false };
  } else {
    // Like
    await this.db.insert(levelLikes).values({ levelId, userId });
    await this.db
      .update(levels)
      .set({ likesCount: sql`${levels.likesCount} + 1` })
      .where(eq(levels.id, levelId));
    return { liked: true };
  }
}
```

## Input Validation

### DTO Validation (NestJS)

Use `class-validator` for automatic validation:

```typescript
// apps/backend/src/level/dto/create-level.dto.ts

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  MaxLength,
  MinLength,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// Nested DTO for position validation
class PositionDto {
  @IsNumber()
  @Min(-100)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  y: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  z: number;
}

export class CreateLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsObject()
  voxelData: Record<string, string>;

  @ValidateNested()
  @Type(() => PositionDto)
  spawnPoint: PositionDto;

  @ValidateNested()
  @Type(() => PositionDto)
  worldSize: PositionDto;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;
}
```

### Voxel Data Validation

**Security Concerns**:
- Prevent excessively large levels (DoS attack)
- Validate block types against allowed list
- Ensure position keys are valid format
- Limit number of blocks per level

**Implementation**:
```typescript
// Custom validation pipe
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { BLOCK_TYPES } from '../../../web/src/lib/BlockTypes'; // Shared types

@Injectable()
export class ValidateVoxelDataPipe implements PipeTransform {
  private readonly MAX_VOXELS = 1000; // Prevent abuse
  private readonly ALLOWED_BLOCK_TYPES = Object.keys(BLOCK_TYPES);

  transform(dto: CreateLevelDto) {
    const voxelData = dto.voxelData;

    // Check size
    const voxelCount = Object.keys(voxelData).length;
    if (voxelCount > this.MAX_VOXELS) {
      throw new BadRequestException(
        `Level too large. Maximum ${this.MAX_VOXELS} blocks allowed.`
      );
    }

    if (voxelCount === 0) {
      throw new BadRequestException('Level must contain at least one block');
    }

    // Validate each voxel
    for (const [key, blockType] of Object.entries(voxelData)) {
      // Validate key format "x,y,z"
      const parts = key.split(',');
      if (parts.length !== 3) {
        throw new BadRequestException(`Invalid voxel key format: ${key}`);
      }

      const [x, y, z] = parts.map(Number);
      if (parts.some(isNaN) || !Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) {
        throw new BadRequestException(`Invalid coordinates in key: ${key}`);
      }

      // Validate coordinates are within bounds
      if (Math.abs(x) > 100 || Math.abs(y) > 100 || Math.abs(z) > 100) {
        throw new BadRequestException(`Coordinates out of bounds: ${key}`);
      }

      // Validate block type
      if (!this.ALLOWED_BLOCK_TYPES.includes(blockType)) {
        throw new BadRequestException(`Invalid block type: ${blockType}`);
      }
    }

    // Validate spawn point exists
    const hasSpawn = Object.values(voxelData).includes('spawn');
    if (!hasSpawn) {
      throw new BadRequestException('Level must contain at least one spawn block');
    }

    // Validate goal exists
    const hasGoal = Object.values(voxelData).includes('goal');
    if (!hasGoal) {
      throw new BadRequestException('Level must contain at least one goal block');
    }

    return dto;
  }
}

// Use in controller
@Post()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
async createLevel(
  @Body(ValidateVoxelDataPipe) dto: CreateLevelDto,
  @CurrentUser() user: CurrentUserData
) {
  return this.levelService.create(dto, user.userId);
}
```

### Frontend Validation

Always validate on backend, but also provide good UX with frontend validation:

```typescript
// apps/web/src/lib/components/level/SaveLevelModal.svelte

function validateLevelData(blocks: Block[]): string[] {
  const errors: string[] = [];

  // Check for spawn point
  const hasSpawn = blocks.some(b => b.type === 'spawn');
  if (!hasSpawn) {
    errors.push('Level must have at least one spawn point');
  }

  // Check for goal
  const hasGoal = blocks.some(b => b.type === 'goal');
  if (!hasGoal) {
    errors.push('Level must have at least one goal block');
  }

  // Check size
  if (blocks.length > 1000) {
    errors.push('Level too large (max 1000 blocks)');
  }

  if (blocks.length === 0) {
    errors.push('Level must contain at least one block');
  }

  return errors;
}
```

## Rate Limiting

Prevent abuse by limiting API requests:

```typescript
// apps/backend/src/main.ts

import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global rate limit: 100 requests per 15 minutes
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
    })
  );

  await app.listen(3010);
}
```

**Endpoint-specific rate limits**:
```typescript
// More restrictive for level creation
import { Throttle } from '@nestjs/throttler';

@Post()
@UseGuards(JwtAuthGuard)
@Throttle(5, 60) // 5 levels per minute max
async createLevel(
  @Body() dto: CreateLevelDto,
  @CurrentUser() user: CurrentUserData
) {
  return this.levelService.create(dto, user.userId);
}
```

## SQL Injection Prevention

Using Drizzle ORM provides protection, but follow best practices:

```typescript
// ✅ SAFE: Parameterized queries via Drizzle
const [level] = await this.db
  .select()
  .from(levels)
  .where(eq(levels.id, levelId)); // Parameterized

// ❌ DANGEROUS: Never construct raw SQL with user input
const query = `SELECT * FROM levels WHERE id = '${levelId}'`; // DON'T DO THIS

// ✅ SAFE: Even with raw SQL, use parameters
const [level] = await this.db.execute(
  sql`SELECT * FROM levels WHERE id = ${levelId}` // Drizzle escapes
);
```

## XSS Prevention

### Backend
- Return JSON only (Content-Type: application/json)
- Never render user input in HTML responses
- Sanitize strings before storage (if needed)

### Frontend
Svelte automatically escapes HTML:

```svelte
<!-- ✅ SAFE: Svelte escapes by default -->
<h1>{level.name}</h1>

<!-- ❌ DANGEROUS: Only use @html for trusted content -->
<div>{@html userInput}</div> <!-- DON'T DO THIS with user input -->

<!-- ✅ SAFE: Sanitize if you must use HTML -->
<div>{@html DOMPurify.sanitize(userInput)}</div>
```

## CORS Configuration

```typescript
// apps/backend/src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5180',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3010);
}
```

## Error Handling

Never leak sensitive information in error messages:

```typescript
// ❌ BAD: Exposes database structure
catch (error) {
  throw new InternalServerErrorException(error.message);
}

// ✅ GOOD: Generic message, log details server-side
catch (error) {
  this.logger.error('Failed to create level', error); // Log internally
  throw new InternalServerErrorException('Failed to create level');
}

// ✅ GOOD: Specific error for user-fixable issues
if (!level.isPublic) {
  throw new ForbiddenException('Cannot like private levels');
}
```

## Database Security

### Indexing
Add indexes for queries to prevent slow queries (DoS):

```typescript
// apps/backend/src/db/schema/levels.schema.ts

export const levels = pgTable(
  'levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // ...
  },
  (table) => ({
    userIdIdx: index('user_id_idx').on(table.userId),
    isPublicIdx: index('is_public_idx').on(table.isPublic),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  })
);
```

### Row-Level Security (Future Enhancement)
Consider PostgreSQL RLS for multi-tenant data isolation.

## Security Checklist

### Authentication
- [ ] JWT tokens validated on all protected endpoints
- [ ] Tokens have reasonable expiration time (not too long)
- [ ] Public key fetched securely from Mana Core Auth
- [ ] Logout clears tokens from frontend storage

### Authorization
- [ ] Users can only modify their own levels
- [ ] Level ownership checked before update/delete
- [ ] Private levels not accessible by other users
- [ ] Admin roles handled correctly (if applicable)

### Input Validation
- [ ] All DTOs have validation decorators
- [ ] Voxel data validated (size, format, block types)
- [ ] Position coordinates bounded
- [ ] String lengths limited
- [ ] Block type whitelist enforced

### Rate Limiting
- [ ] Global rate limit configured
- [ ] Level creation rate limited
- [ ] Login attempts rate limited (in Mana Core Auth)
- [ ] API abuse monitored

### Data Protection
- [ ] Sensitive data not logged
- [ ] Error messages don't leak info
- [ ] Database queries use parameters
- [ ] CORS properly configured
- [ ] HTTPS enforced in production

### Frontend Security
- [ ] Tokens stored in localStorage (not cookies for XSS protection)
- [ ] User input escaped in UI
- [ ] API client handles 401 gracefully
- [ ] No sensitive data in URLs or logs

## Threat Modeling

### Threat 1: Malicious Level Data
**Attack**: User creates huge level or uses invalid block types to crash server.
**Mitigation**: Validate voxel data size and block types, limit to 1000 blocks.

### Threat 2: Unauthorized Level Modification
**Attack**: User modifies or deletes another user's level.
**Mitigation**: Check level ownership before update/delete operations.

### Threat 3: Token Theft
**Attack**: Attacker steals JWT token via XSS or network interception.
**Mitigation**: HTTPS in production, short token expiration, HttpOnly cookies (future).

### Threat 4: API Abuse
**Attack**: Automated bot creates thousands of levels.
**Mitigation**: Rate limiting, CAPTCHA on registration (Mana Core Auth).

### Threat 5: SQL Injection
**Attack**: Inject SQL via user input fields.
**Mitigation**: Use Drizzle ORM parameterized queries, never raw SQL with user input.

## Monitoring & Logging

```typescript
// Log security events
import { Logger } from '@nestjs/common';

export class LevelService {
  private readonly logger = new Logger(LevelService.name);

  async delete(id: string, userId: string) {
    this.logger.log(`User ${userId} attempting to delete level ${id}`);

    const level = await this.findById(id);

    if (level.userId !== userId) {
      this.logger.warn(
        `Unauthorized delete attempt: User ${userId} tried to delete level ${id} owned by ${level.userId}`
      );
      throw new ForbiddenException('You can only delete your own levels');
    }

    await this.db.delete(levels).where(eq(levels.id, id));
    this.logger.log(`Level ${id} deleted by user ${userId}`);

    return { success: true };
  }
}
```

## Security Updates

- Regularly update dependencies (npm audit)
- Monitor Mana Core Auth for security patches
- Review NestJS security advisories
- Test authentication flows after updates

## Notes

- Security is layered: validate on frontend AND backend
- Never trust user input
- Log suspicious activity for monitoring
- Keep secrets in environment variables, never in code
- Regularly review and test security measures
