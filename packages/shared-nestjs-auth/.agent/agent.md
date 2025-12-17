# Agent: @manacore/shared-nestjs-auth

## Module Information

**Package:** `@manacore/shared-nestjs-auth`
**Type:** Shared Package (NestJS Auth Utilities)
**Location:** `/packages/shared-nestjs-auth`
**Dependencies:** `@manacore/better-auth-types`, `@nestjs/common@^10-11`, `@nestjs/config@^3-4`

## Identity

I am the NestJS authentication specialist for the ManaCore monorepo. I provide guards, decorators, and utilities for protecting NestJS backend routes with JWT authentication. I validate tokens via the central Mana Core Auth service and extract user information for use in controllers and services.

## Expertise

### Core Capabilities

1. **JWT Authentication Guard**
   - `JwtAuthGuard` - Validates JWT tokens via Mana Core Auth
   - Protects routes and controller methods
   - Development mode bypass for local testing
   - Automatic user data extraction

2. **Current User Decorator**
   - `@CurrentUser()` - Extract authenticated user from request
   - Type-safe with `CurrentUserData` interface
   - Works seamlessly with `JwtAuthGuard`

3. **Token Validation**
   - Validates tokens against Mana Core Auth service
   - Extracts user ID, email, role, session ID
   - Handles token expiration and invalid tokens
   - Returns standardized user data structure

4. **Development Helpers**
   - Bypass authentication in development mode
   - Configurable dev user ID for testing
   - No token required when bypassed

### Technical Patterns

- **Guard-Based Protection**: Use NestJS guards for route protection
- **Decorator-Based Access**: Extract user data with parameter decorators
- **Centralized Validation**: All validation via Mana Core Auth service
- **Type-Safe**: Full TypeScript support with strict types
- **ConfigService Integration**: Environment-based configuration

## Code Structure

```
src/
├── index.ts                         # Public exports
├── types/
│   └── index.ts                     # Type definitions and re-exports
├── guards/
│   └── jwt-auth.guard.ts            # JWT validation guard
└── decorators/
    └── current-user.decorator.ts    # User extraction decorator
```

## Key Files

### `src/guards/jwt-auth.guard.ts`
Main authentication guard:
- Implements `CanActivate` interface
- Extracts Bearer token from Authorization header
- Validates token with Mana Core Auth service (`POST /api/v1/auth/validate`)
- Attaches user data to request object
- Supports development bypass (`DEV_BYPASS_AUTH=true`)
- Configurable dev user ID (`DEV_USER_ID`)
- Throws `UnauthorizedException` for invalid/missing tokens

### `src/decorators/current-user.decorator.ts`
Parameter decorator for user extraction:
- Uses `createParamDecorator` from NestJS
- Extracts `request.user` from execution context
- Returns `CurrentUserData` type
- Must be used with `JwtAuthGuard`

### `src/types/index.ts`
Type definitions:
- Re-exports from `@manacore/better-auth-types`:
  - `CurrentUserData` - User data interface (userId, email, role, sessionId)
  - `JWTPayload` - Raw JWT payload structure
  - `TokenValidationResponse` - Auth service response
  - `UserRole` - User role enum
  - `OrganizationRole` - Organization role enum
- `AuthModuleConfig` - Configuration interface for auth setup

## Integration Points

### Consumed By
- **Backend Apps** (NestJS): Import guard and decorator in controllers
- All NestJS services in monorepo
- `apps/*/backend` - All app backends

### Dependencies
- `@manacore/better-auth-types` - Centralized auth type definitions
- `@nestjs/common` - NestJS core (guards, decorators, exceptions)
- `@nestjs/config` - Environment variable management

### Related Packages
- `@manacore/shared-auth-stores` - Frontend auth state management
- `@manacore/shared-auth-ui` - Frontend auth UI components
- `services/mana-core-auth` - Central auth service (validates tokens)

### Integration with Mana Core Auth

This package communicates with the central auth service:
- **Endpoint**: `POST /api/v1/auth/validate`
- **Payload**: `{ token: string }`
- **Response**: `TokenValidationResponse` with user data
- **URL**: Configured via `MANA_CORE_AUTH_URL` env var (default: `http://localhost:3001`)

## Key Patterns

### 1. Basic Route Protection

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
  }
}
```

### 2. Protecting Specific Endpoints

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api/posts')
export class PostsController {
  // Public endpoint - no guard
  @Get()
  getAllPosts() {
    return this.postsService.findAll();
  }

  // Protected endpoint - requires authentication
  @Post()
  @UseGuards(JwtAuthGuard)
  createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.postsService.create(createPostDto, user.userId);
  }
}
```

### 3. Using User Data in Services

```typescript
import { Injectable } from '@nestjs/common';
import { CurrentUserData } from '@manacore/shared-nestjs-auth';

@Injectable()
export class PostsService {
  async create(createPostDto: CreatePostDto, userId: string) {
    return this.db.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
    });
  }

  async update(postId: string, updatePostDto: UpdatePostDto, user: CurrentUserData) {
    // Check ownership
    const post = await this.db.post.findUnique({ where: { id: postId } });
    if (post.authorId !== user.userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.db.post.update({
      where: { id: postId },
      data: updatePostDto,
    });
  }
}
```

### 4. Custom Role-Based Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserData = request.user;

    return requiredRoles.includes(user.role);
  }
}

// Usage:
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // Only accessible to admin users
}
```

### 5. Development Mode Bypass

```bash
# .env.development
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=550e8400-e29b-41d4-a716-446655440000
MANA_CORE_AUTH_URL=http://localhost:3001
```

```typescript
// Guard automatically bypasses auth and returns dev user
@Controller('api/test')
@UseGuards(JwtAuthGuard)
export class TestController {
  @Get()
  test(@CurrentUser() user: CurrentUserData) {
    // In dev mode with bypass, user will be the dev user
    return user; // { userId: '550e8400...', email: 'dev@example.com', ... }
  }
}
```

### 6. Global Guard Setup

```typescript
// In your main.ts or app.module.ts
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

// Now all routes are protected by default
// Use @Public() decorator (create your own) to mark public routes
```

### 7. Error Handling

```typescript
import { Controller, Get, UseGuards, HttpException } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get('settings')
  async getSettings(@CurrentUser() user: CurrentUserData) {
    try {
      return await this.userService.getSettings(user.userId);
    } catch (error) {
      throw new HttpException('Failed to load settings', 500);
    }
  }
}

// Guard automatically throws UnauthorizedException for:
// - Missing token
// - Invalid token
// - Expired token
// - Auth service unavailable
```

### 8. Multi-Tenant Pattern

```typescript
@Controller('api/organizations/:orgId')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  @Get('projects')
  async getProjects(
    @Param('orgId') orgId: string,
    @CurrentUser() user: CurrentUserData
  ) {
    // Check if user has access to this organization
    const hasAccess = await this.orgService.userHasAccess(orgId, user.userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return this.projectService.findByOrganization(orgId);
  }
}
```

## How to Use

### For Backend Developers

1. **Install Package**:
   ```bash
   # Already available in monorepo
   # Just import from @manacore/shared-nestjs-auth
   ```

2. **Configure Environment Variables**:
   ```bash
   # .env or .env.development
   MANA_CORE_AUTH_URL=http://localhost:3001

   # Optional: for development
   NODE_ENV=development
   DEV_BYPASS_AUTH=true
   DEV_USER_ID=your-test-user-id
   ```

3. **Import in Controllers**:
   ```typescript
   import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
   ```

4. **Protect Routes**:
   ```typescript
   @UseGuards(JwtAuthGuard)
   ```

5. **Access User Data**:
   ```typescript
   @CurrentUser() user: CurrentUserData
   ```

6. **Pass to Services**:
   ```typescript
   this.myService.doSomething(user.userId);
   ```

### Frontend Integration

Frontend apps must send tokens in Authorization header:

```typescript
// In your frontend API client
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Token Flow

1. User signs in via frontend (using `@manacore/shared-auth-ui` or custom UI)
2. Frontend receives JWT token from Mana Core Auth
3. Frontend stores token (localStorage, cookie, etc.)
4. Frontend includes token in Authorization header for API requests
5. Backend `JwtAuthGuard` extracts and validates token
6. Guard calls Mana Core Auth to validate token
7. If valid, user data attached to request
8. Controller receives user data via `@CurrentUser()` decorator

### Environment Setup

Each backend needs these environment variables:

```bash
# Required
MANA_CORE_AUTH_URL=http://localhost:3001

# Optional - for development
DEV_BYPASS_AUTH=true              # Bypass auth validation
DEV_USER_ID=your-dev-user-id      # Custom dev user ID
NODE_ENV=development              # Enable dev features
```

### Best Practices

- Always use `@UseGuards(JwtAuthGuard)` for protected routes
- Extract user data with `@CurrentUser()` decorator
- Pass `user.userId` to services, not entire user object
- Validate ownership/permissions in services, not controllers
- Use development bypass for local testing without auth setup
- Set `MANA_CORE_AUTH_URL` in environment files
- Never bypass auth in production
- Log authentication errors for debugging
- Handle `UnauthorizedException` in frontend with redirects
- Keep token validation logic centralized in guard

### Common Issues

**Issue**: Token validation fails with "Auth service unavailable"
**Solution**: Ensure `mana-core-auth` service is running on port 3001

**Issue**: User data is undefined in controller
**Solution**: Make sure `@UseGuards(JwtAuthGuard)` is applied

**Issue**: Development bypass not working
**Solution**: Check `NODE_ENV=development` and `DEV_BYPASS_AUTH=true` are set

**Issue**: Token appears valid but validation fails
**Solution**: Verify token was issued by Mana Core Auth, not another service

## Type Definitions

### CurrentUserData
```typescript
interface CurrentUserData {
  userId: string;        // Unique user identifier
  email: string;         // User's email address
  role: UserRole;        // User role (user, admin, etc.)
  sessionId: string;     // Session identifier
}
```

### TokenValidationResponse
```typescript
interface TokenValidationResponse {
  valid: boolean;                  // Whether token is valid
  payload?: JWTPayload;            // Decoded JWT payload if valid
  error?: string;                  // Error message if invalid
}
```

### JWTPayload
```typescript
interface JWTPayload {
  sub: string;           // Subject (user ID)
  email: string;         // User email
  role: UserRole;        // User role
  sessionId?: string;    // Session ID
  sid?: string;          // Alternative session ID field
  iat?: number;          // Issued at timestamp
  exp?: number;          // Expiration timestamp
}
```

## Notes

- All authentication flows centralized via Mana Core Auth service
- Guards are stateless and validate on every request
- Development bypass useful for testing without full auth setup
- Type-safe with full TypeScript support
- Compatible with NestJS 10 and 11
- Works with both HTTP and WebSocket contexts
- Follows NestJS best practices for guards and decorators
- No database queries - pure token validation
- Fast validation via HTTP call to auth service
