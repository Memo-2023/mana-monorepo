# @manacore/shared-nestjs-auth

Shared authentication utilities for NestJS backends in the Mana Core ecosystem.

## Installation

```bash
pnpm add @manacore/shared-nestjs-auth
```

## Usage

### 1. Configure Environment Variables

```env
# Required: Mana Core Auth service URL
MANA_CORE_AUTH_URL=http://localhost:3001

# Optional: Development mode auth bypass
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=your-test-user-id
```

### 2. Use in Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api')
export class MyController {
  // Public endpoint
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  // Protected endpoint
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };
  }
}
```

### 3. Apply Guard Globally (Optional)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
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
```

## API

### JwtAuthGuard

A NestJS guard that validates JWT tokens via the Mana Core Auth service.

- Extracts Bearer token from `Authorization` header
- Calls `POST /api/v1/auth/validate` on auth service
- Attaches user data to request object
- Supports `DEV_BYPASS_AUTH=true` for development

### CurrentUser Decorator

Parameter decorator to extract the authenticated user from the request.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: CurrentUserData) {
  return user;
}
```

### CurrentUserData Interface

```typescript
interface CurrentUserData {
  userId: string;      // User ID (from JWT sub claim)
  email: string;       // User email
  role: string;        // User role (user, admin, service)
  sessionId?: string;  // Session ID (optional)
}
```

## How It Works

1. Client sends request with `Authorization: Bearer <token>` header
2. JwtAuthGuard extracts the token
3. Guard calls Mana Core Auth service to validate token
4. On success, user data is attached to `request.user`
5. Controller receives user via `@CurrentUser()` decorator

```
┌─────────────┐     ┌─────────────┐     ┌────────────────┐
│   Client    │────>│  Your API   │────>│ mana-core-auth │
│             │     │  (NestJS)   │     │   (port 3001)  │
└─────────────┘     └─────────────┘     └────────────────┘
      │                   │                     │
      │ Bearer token      │ POST /validate      │
      │                   │ {token}             │
      │                   │<────────────────────│
      │                   │ {valid, payload}    │
      │<──────────────────│                     │
      │ Response          │                     │
```

## Development Mode

Set `DEV_BYPASS_AUTH=true` in development to skip token validation:

```env
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=17cb0be7-058a-4964-9e18-1fe7055fd014
```

This will use a mock user for all authenticated requests.

## Related Packages

- `@manacore/shared-auth` - Client-side auth for web/mobile apps
- `@manacore/shared-types` - Shared TypeScript types
