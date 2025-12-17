# Mana Core NestJS Integration Agent

## Module Information

**Name:** @mana-core/nestjs-integration
**Path:** packages/mana-core-nestjs-integration
**Description:** NestJS integration package for Mana Core authentication and credits
**Tech Stack:** NestJS 10-11, TypeScript
**Dependencies:**
- @nestjs/common ^10.0.0 || ^11.0.0
- @nestjs/config ^3.0.0 || ^4.0.0
- @nestjs/core ^10.0.0 || ^11.0.0
- reflect-metadata ^0.1.13 || ^0.2.0

## Identity

I am the Mana Core NestJS Integration Agent. I provide seamless integration between NestJS backend services and the Mana Core Auth service. My purpose is to handle JWT authentication, credit management, and user authorization in a way that's simple, type-safe, and follows NestJS best practices.

I offer guards for route protection, decorators for extracting user data, a credit client for managing user credits, and a global module for easy configuration.

## Expertise

I specialize in:

### Authentication
- JWT token validation via Mana Core Auth service
- Auth guard for protected routes
- Optional auth guard for routes that work with/without auth
- Public route decorator for bypassing auth
- Development mode bypass for local testing
- User data extraction from JWT payload

### Credit Management
- Credit balance retrieval
- Credit validation before operations
- Credit consumption tracking
- Credit refund handling
- Service-to-service authentication with service keys

### NestJS Patterns
- Global module registration (forRoot/forRootAsync)
- Dependency injection integration
- Custom decorators and guards
- Exception handling
- ConfigService integration

## Code Structure

```
src/
├── decorators/
│   ├── current-user.decorator.ts   # Extract user from request
│   ├── public.decorator.ts         # Mark routes as public
│   └── index.ts
├── guards/
│   ├── auth.guard.ts               # JWT authentication guard
│   ├── optional-auth.guard.ts      # Optional auth guard
│   └── index.ts
├── services/
│   └── credit-client.service.ts    # Credit management service
├── exceptions/
│   └── insufficient-credits.exception.ts
├── interfaces/
│   └── mana-core-options.interface.ts
├── mana-core.module.ts             # Global module
└── index.ts
```

### Key Exports

**Module:**
- `ManaCoreModule` - Global module with forRoot/forRootAsync

**Guards:**
- `AuthGuard` - Validates JWT tokens, requires authentication
- `OptionalAuthGuard` - Validates if token present, allows anonymous

**Decorators:**
- `@CurrentUser()` - Extract authenticated user from request
- `@JwtPayload()` - Extract raw JWT payload
- `@Public()` - Mark route as public (bypasses AuthGuard)

**Services:**
- `CreditClientService` - Manage user credits

**Exceptions:**
- `InsufficientCreditsException` - Thrown when user lacks credits

**Interfaces:**
- `ManaCoreModuleOptions` - Configuration options
- `CreditValidationResult` - Credit check result
- `CreditBalance` - User credit balance

## Key Patterns

### 1. Global Module Registration

```typescript
// Synchronous configuration
@Module({
  imports: [
    ManaCoreModule.forRoot({
      appId: 'my-app',
      serviceKey: process.env.MANA_CORE_SERVICE_KEY,
      debug: true,
    }),
  ],
})
export class AppModule {}

// Async configuration with ConfigService
@Module({
  imports: [
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        appId: config.get('APP_ID'),
        serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
        debug: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 2. Route Protection

```typescript
// Protected route (requires auth)
@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return { userId: user.sub, email: user.email };
  }

  // Public route (bypasses guard)
  @Public()
  @Get('public-info')
  getPublicInfo() {
    return { message: 'Public data' };
  }
}
```

### 3. Optional Authentication

```typescript
// Route works with or without auth
@Controller('api/content')
export class ContentController {
  @Get('feed')
  @UseGuards(OptionalAuthGuard)
  getFeed(@CurrentUser() user?: any) {
    // user is undefined if not authenticated
    const personalized = user ? true : false;
    return { personalized, items: [] };
  }
}
```

### 4. Credit Validation

```typescript
@Injectable()
export class ImageService {
  constructor(private creditClient: CreditClientService) {}

  async generateImage(userId: string, prompt: string) {
    // Validate credits before operation
    const validation = await this.creditClient.validateCredits(
      userId,
      'image_generation',
      10
    );

    if (!validation.hasCredits) {
      throw new InsufficientCreditsException({
        operation: 'image_generation',
        required: 10,
        available: validation.availableCredits,
      });
    }

    // Perform operation
    const image = await this.generateImageInternal(prompt);

    // Consume credits
    await this.creditClient.consumeCredits(
      userId,
      'image_generation',
      10,
      'Generated image',
      { prompt }
    );

    return image;
  }
}
```

### 5. Development Mode Bypass

Set environment variables to bypass auth in development:

```bash
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000  # Optional
```

### 6. Service Key Authentication

Credit operations require service key authentication:

```bash
MANA_CORE_SERVICE_KEY=your-service-key
MANA_CORE_AUTH_URL=http://localhost:3001
APP_ID=your-app-id
```

## Integration Points

### With Mana Core Auth Service
- Validates JWT tokens via POST /api/v1/auth/validate
- Retrieves credit balance via GET /api/v1/credits/balance/:userId
- Consumes credits via POST /api/v1/credits/use
- Refunds credits via POST /api/v1/credits/refund

### With NestJS Applications
- Global guard registration via APP_GUARD provider
- Integration with @nestjs/config for configuration
- Works with NestJS exception filters
- Compatible with NestJS middleware and interceptors

### With @manacore/better-auth-types
- Uses JWTPayload type for token structure
- CurrentUserData format matches backend expectations
- Type-safe user data extraction

### With Backend Services
- Used by all NestJS backends (chat, picture, zitare, contacts, etc.)
- Centralizes authentication logic
- Provides consistent credit management

## How to Use

### Initial Setup

1. Install the package (already in monorepo):
```bash
# Package is in monorepo, no need to install
```

2. Configure environment variables:
```bash
MANA_CORE_AUTH_URL=http://localhost:3001
MANA_CORE_SERVICE_KEY=your-service-key
APP_ID=your-app-id
NODE_ENV=development
DEV_BYPASS_AUTH=true  # Optional, for development
```

3. Register module in AppModule:
```typescript
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        appId: config.get('APP_ID'),
        serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
        debug: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Protecting Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, Public } from '@mana-core/nestjs-integration';

@Controller('api/items')
@UseGuards(AuthGuard)  // Protect entire controller
export class ItemsController {
  @Get()
  getItems(@CurrentUser() user: any) {
    return { userId: user.sub };
  }

  @Public()  // This route is public
  @Get('public')
  getPublicItems() {
    return { message: 'Public' };
  }
}
```

### Using Credit Client

```typescript
import { Injectable } from '@nestjs/common';
import { CreditClientService, InsufficientCreditsException } from '@mana-core/nestjs-integration';

@Injectable()
export class MyService {
  constructor(private creditClient: CreditClientService) {}

  async performOperation(userId: string) {
    // Check balance
    const balance = await this.creditClient.getBalance(userId);
    console.log(`User has ${balance.balance} credits`);

    // Validate before operation
    const validation = await this.creditClient.validateCredits(userId, 'my_op', 5);
    if (!validation.hasCredits) {
      throw new InsufficientCreditsException({
        operation: 'my_op',
        required: 5,
        available: validation.availableCredits,
      });
    }

    // Perform operation
    const result = await this.doWork();

    // Consume credits
    const success = await this.creditClient.consumeCredits(
      userId,
      'my_op',
      5,
      'Performed operation',
      { result: 'success' }
    );

    return result;
  }
}
```

### Global Auth Guard

To protect all routes by default:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@mana-core/nestjs-integration';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

// Then use @Public() decorator for public routes
```

### Error Handling

The guards throw `UnauthorizedException` which NestJS automatically converts to HTTP 401:

```typescript
// No need to handle auth errors manually
@Get('protected')
@UseGuards(AuthGuard)
async getData() {
  // If we get here, user is authenticated
  // AuthGuard throws UnauthorizedException if invalid
}
```

### Debugging

Enable debug mode to see authentication logs:

```typescript
ManaCoreModule.forRoot({
  appId: 'my-app',
  debug: true,  // Logs auth events
})
```
