# Mana Core NestJS Integration Guide

This document provides a comprehensive guide on how the `@mana-core/nestjs-integration` package was integrated into the Storyteller project. Use this guide to integrate the same authentication and credit system into your own NestJS application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [Credit Management](#credit-management)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Mana Core NestJS integration package provides:
- **Complete Authentication System**: Email/password, Google OAuth, Apple Sign-in
- **JWT Token Management**: Automatic validation, refresh, and storage
- **Credit Management**: Pre-flight validation and consumption with app-level tracking
- **Guards & Decorators**: `AuthGuard`, `@CurrentUser()`, `@RequireRoles()`
- **Multi-Device Support**: Device tracking and management
- **Service Auth**: Service-to-service authentication

### Architecture

```
Frontend (React Native/Web)
    ↓ HTTP Requests with JWT
Backend (NestJS)
    ↓ Token Validation & Credit Checks
Mana Core Service
    ↓ Authentication & Credit Management
```

---

## Prerequisites

Before integrating Mana Core, ensure you have:

1. **Mana Core Credentials**:
   - `MANA_SERVICE_URL`: URL of your Mana Core instance
   - `APP_ID`: Your application ID from Mana Core
   - `MANA_SUPABASE_SECRET_KEY`: Service key for backend operations (optional but recommended)

2. **NestJS Application**:
   - NestJS v10 or higher
   - `@nestjs/config` installed
   - Environment variable management setup

3. **Node.js & npm**:
   - Node.js v18 or higher
   - npm or yarn package manager

---

## Installation

### Step 1: Install the Package

The package is currently hosted on GitHub. Install it using npm:

```bash
cd backend
npm install @mana-core/nestjs-integration
```

Or from the GitHub repository directly:

```bash
npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git
```

**Storyteller uses**: `git+https://github.com/Memo-2023/mana-core-nestjs-package.git`

### Step 2: Verify Installation

Check your `package.json`:

```json
{
  "dependencies": {
    "@mana-core/nestjs-integration": "git+https://github.com/Memo-2023/mana-core-nestjs-package.git",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^4.0.0",
    // ... other dependencies
  }
}
```

---

## Backend Integration

### Step 1: Configure Environment Variables

Create or update your `.env` file in the backend directory:

```env
# Node Environment
NODE_ENV=development
PORT=3002

# Mana Core Configuration
MANA_SERVICE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
APP_ID=your-app-id-from-mana-core
MANA_SUPABASE_SECRET_KEY=your-service-role-key

# Optional: Signup redirect URL
SIGNUP_REDIRECT_URL=https://yourapp.com/welcome
```

**Important Notes**:
- `MANA_SERVICE_URL`: Your Mana Core instance URL
- `APP_ID`: Obtained from Mana Core admin panel
- `MANA_SUPABASE_SECRET_KEY`: Required for credit operations and service-level auth
- `SIGNUP_REDIRECT_URL`: Optional redirect after successful signup

### Step 2: Import and Configure the Module

In your `app.module.ts`, import and configure `ManaCoreModule`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    // Global config module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema, // Optional: Joi validation
    }),

    // Mana Core Module - async configuration
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Required: Mana service URL
        manaServiceUrl: 'https://mana-core-middleware-111768794939.europe-west3.run.app',

        // Required: Your app ID
        appId: '8d2f5ddb-e251-4b3b-8802-84022a7ac77f',

        // Recommended: Service key for backend operations
        serviceKey: configService.get<string>('MANA_SUPABASE_SECRET_KEY', ''),

        // Optional: Signup redirect URL
        signupRedirectUrl: configService.get<string>('SIGNUP_REDIRECT_URL', ''),

        // Optional: Enable debug logging in development
        debug: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Your other modules
    CharacterModule,
    StoryModule,
    // ...
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Configuration Options**:
- `manaServiceUrl` (required): URL of your Mana Core service
- `appId` (required): Your application ID
- `serviceKey` (recommended): Service role key for backend operations
- `signupRedirectUrl` (optional): URL to redirect users after signup
- `debug` (optional): Enable debug logging (default: false)

### Step 3: Protect Routes with AuthGuard

Use the `AuthGuard` to protect routes that require authentication:

```typescript
import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  AuthGuard,
  CurrentUser,
  CreditClientService,
  InsufficientCreditsException,
} from '@mana-core/nestjs-integration';
import { JwtPayload } from '../types/jwt-payload.interface';

@Controller('story')
@UseGuards(AuthGuard) // Protect all routes in this controller
export class StoryController {
  constructor(
    private readonly creditClient: CreditClientService,
  ) {}

  @Get()
  async getStories(@CurrentUser() user: JwtPayload) {
    console.log(`Fetching stories for user ${user.email} (${user.sub})`);
    // user.sub = user ID
    // user.email = user email
    // user.role = user role
    return { data: [] };
  }
}
```

### Step 4: Extract User Information

Use the `@CurrentUser()` decorator to extract authenticated user data:

```typescript
// Get entire user object
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) {
  return {
    id: user.sub,
    email: user.email,
    role: user.role,
  };
}

// Get specific field
@Get('email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}

// Get user ID
@Get('id')
async getId(@CurrentUser('sub') userId: string) {
  return { userId };
}
```

**JwtPayload Interface**:
```typescript
export interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: string;       // User role (e.g., 'user', 'admin')
  iat?: number;       // Issued at timestamp
  exp?: number;       // Expiration timestamp
}
```

### Step 5: Custom Token Decorator (Optional)

Storyteller uses a custom `@UserToken()` decorator to extract the raw JWT token for Row Level Security (RLS) with Supabase:

Create `backend/src/decorators/user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.token;
  },
);
```

**Usage with RLS**:
```typescript
@Get()
async getCharacters(
  @CurrentUser() user: JwtPayload,
  @UserToken() token: string, // Raw JWT for RLS
) {
  // Use token with Supabase client for RLS
  const characters = await this.supabaseService.getUserCharacters(
    user.sub,
    token,
  );
  return { data: characters };
}
```

---

## Frontend Integration

### Step 1: Configure API Client

Create an API utility that handles authentication:

**`mobile/src/utils/api.ts`**:

```typescript
import { Platform } from 'react-native';
import { tokenManager } from '../services/tokenManager';

// Configure backend URL
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL;

  if (envUrl) {
    return envUrl;
  }

  // Default to localhost for development
  if (Platform.OS === 'ios') {
    return 'http://localhost:3002';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3002'; // Android emulator special IP
  }

  return 'http://localhost:3002';
};

export const API_BASE_URL = getApiBaseUrl();

// Authenticated fetch function
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get valid token (handles refresh automatically)
  let appToken = await tokenManager.getValidToken();

  if (!appToken) {
    throw new Error('Not authenticated');
  }

  // Add token to request
  const authenticatedOptions: RequestInit = {
    method: options.method || 'GET',
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${appToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Make request
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    authenticatedOptions,
  );

  // Handle 401 (token expired)
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await tokenManager.refreshToken();
    if (refreshed) {
      // Retry with new token
      appToken = await tokenManager.getValidToken();
      authenticatedOptions.headers = {
        ...authenticatedOptions.headers,
        'Authorization': `Bearer ${appToken}`,
      };
      return fetch(`${API_BASE_URL}${endpoint}`, authenticatedOptions);
    }
    throw new Error('Authentication failed');
  }

  return response;
}
```

### Step 2: Authentication Service

Create an authentication service:

**`mobile/src/services/authService.ts`**:

```typescript
import { DeviceManager } from '../utils/deviceManager';

const BACKEND_URL = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002';

export const authService = {
  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    try {
      // Get device info for multi-device support
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${BACKEND_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      const data = await response.json();

      // Store tokens
      await storage.setItem('@auth/appToken', data.appToken);
      await storage.setItem('@auth/refreshToken', data.refreshToken);
      await storage.setItem('@auth/userEmail', email);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign up new user
   */
  signUp: async (email: string, password: string) => {
    try {
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    try {
      const appToken = await storage.getItem('@auth/appToken');

      if (appToken) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${appToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear stored tokens
      await storage.removeItem('@auth/appToken');
      await storage.removeItem('@auth/refreshToken');
      await storage.removeItem('@auth/userEmail');
    }
  },
};
```

### Step 3: Token Manager

Create a token manager to handle automatic token refresh:

**`mobile/src/services/tokenManager.ts`**:

```typescript
import * as jwt from 'jwt-decode';
import { storage } from '../utils/storage';
import { DeviceManager } from '../utils/deviceManager';

const BACKEND_URL = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002';

export const tokenManager = {
  /**
   * Get a valid token, refreshing if necessary
   */
  getValidToken: async (): Promise<string | null> => {
    let appToken = await storage.getItem('@auth/appToken');

    if (!appToken) {
      return null;
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const decoded = jwt.jwtDecode(appToken);
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (expiresAt - now < bufferTime) {
      console.log('Token expired or expiring soon, refreshing...');
      const refreshed = await this.refreshToken();
      if (refreshed) {
        appToken = await storage.getItem('@auth/appToken');
      } else {
        return null;
      }
    }

    return appToken;
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = await storage.getItem('@auth/refreshToken');
      if (!refreshToken) {
        return false;
      }

      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken, deviceInfo }),
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        await storage.removeItem('@auth/appToken');
        await storage.removeItem('@auth/refreshToken');
        return false;
      }

      const data = await response.json();

      // Store new tokens
      await storage.setItem('@auth/appToken', data.appToken);
      await storage.setItem('@auth/refreshToken', data.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },
};
```

### Step 4: Making Authenticated Requests

Use the `fetchWithAuth` function for authenticated API calls:

```typescript
import { fetchWithAuth } from '../utils/api';

// Get user's characters
const response = await fetchWithAuth('/character', {
  method: 'GET',
});

if (response.ok) {
  const data = await response.json();
  console.log('Characters:', data.data);
}

// Create a new story
const response = await fetchWithAuth('/story', {
  method: 'POST',
  body: JSON.stringify({
    characters: [characterId],
    storyDescription: 'A magical adventure',
    authorId: 'author-1',
    illustratorId: 'illustrator-1',
  }),
});

if (response.ok) {
  const data = await response.json();
  console.log('Story created:', data.storyData);
}
```

---

## Credit Management

The Mana Core package includes a complete credit consumption system for tracking and billing user operations.

### Step 1: Inject CreditClientService

Inject the `CreditClientService` into your controller or service:

```typescript
import {
  CreditClientService,
  InsufficientCreditsException,
} from '@mana-core/nestjs-integration';

@Controller('character')
@UseGuards(AuthGuard)
export class CharacterController {
  constructor(
    private readonly creditClient: CreditClientService,
  ) {}
}
```

### Step 2: Pre-flight Credit Validation

Always validate credits BEFORE performing expensive operations:

```typescript
@Post('generate-images')
async generateCharacterImages(
  @Body('description') description: string,
  @Body('name') name: string,
  @CurrentUser() user: JwtPayload,
) {
  try {
    // Pre-flight credit check (20 credits required)
    const creditValidation = await this.creditClient.validateCredits(
      user.sub,              // User ID
      'character_creation',  // Operation type
      20,                    // Required credits
    );

    if (!creditValidation.hasCredits) {
      this.logger.warn(
        `User ${user.sub} has insufficient credits. Required: 20, Available: ${creditValidation.availableCredits}`,
      );
      return {
        error: 'insufficient_credits',
        message: `Insufficient credits. Required: 20, Available: ${creditValidation.availableCredits}`,
        requiredCredits: 20,
        availableCredits: creditValidation.availableCredits,
      };
    }

    // Proceed with operation...
    const result = await this.performExpensiveOperation(description, name);

    // SUCCESS: Consume credits after successful operation
    await this.creditClient.consumeCredits(
      user.sub,
      'character_creation',
      20,
      `Created character: ${name}`,
      {
        characterId: result.id,
        characterName: name,
        description,
      },
    );

    return { data: result };
  } catch (error) {
    // Handle insufficient credits error
    if (error instanceof InsufficientCreditsException) {
      return {
        error: 'insufficient_credits',
        message: error.message,
        requiredCredits: error.details.requiredCredits,
        availableCredits: error.details.availableCredits,
      };
    }
    throw error;
  }
}
```

### Step 3: Credit Operations in Storyteller

**Character Creation** (20 credits):
```typescript
// Validate
const validation = await this.creditClient.validateCredits(
  user.sub,
  'character_creation',
  20,
);

// ... create character ...

// Consume
await this.creditClient.consumeCredits(
  user.sub,
  'character_creation',
  20,
  `Created character: ${name}`,
  { characterId, characterName: name, description },
);
```

**Story Creation** (100 credits):
```typescript
// Validate
const validation = await this.creditClient.validateCredits(
  user.sub,
  'story_creation',
  100,
);

// ... create story ...

// Consume
await this.creditClient.consumeCredits(
  user.sub,
  'story_creation',
  100,
  `Created story: ${storyTitle}`,
  { storyId, characterId, storyDescription },
);
```

### Step 4: Check Credit Balance

Get a user's current credit balance:

```typescript
@Get('balance')
async getCreditBalance(@CurrentUser('sub') userId: string) {
  const balance = await this.creditClient.getCreditBalance(userId);
  return {
    balance: balance.balance,
  };
}
```

### Step 5: Custom Operation Types

Define your own operation types based on your application:

```typescript
type MyAppOperations =
  | 'character_creation'    // 20 credits
  | 'story_creation'        // 100 credits
  | 'image_generation'      // 10 credits
  | 'api_call'              // 5 credits
  | 'transcription'         // Variable
  | 'analysis';             // Variable

// Use in credit operations
await this.creditClient.consumeCredits(
  userId,
  'image_generation',
  10,
  'Generated AI image',
  { imageSize: '1024x1024', model: 'dalle-3' },
);
```

---

## Error Handling

### Frontend Error Handling

Handle credit errors in your frontend:

```typescript
import { parseApiError, isInsufficientCreditsError } from '../types/errors';

try {
  const response = await fetchWithAuth('/character/generate-images', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });

  const data = await response.json();

  if (data.error === 'insufficient_credits') {
    // Show credit purchase modal
    navigation.navigate('PurchaseCredits', {
      required: data.requiredCredits,
      available: data.availableCredits,
    });
    return;
  }

  // Success
  console.log('Character created:', data.data);
} catch (error) {
  console.error('Character creation error:', error);
}
```

### Backend Error Handling

Use the `InsufficientCreditsException` for credit errors:

```typescript
import { InsufficientCreditsException } from '@mana-core/nestjs-integration';
import { BadRequestException } from '@nestjs/common';

try {
  // Validate credits
  const validation = await this.creditClient.validateCredits(
    userId,
    'operation',
    100,
  );

  if (!validation.hasCredits) {
    throw new BadRequestException({
      error: 'insufficient_credits',
      message: `Insufficient credits. Required: 100, Available: ${validation.availableCredits}`,
      requiredCredits: 100,
      availableCredits: validation.availableCredits,
    });
  }

  // ... operation ...
} catch (error) {
  if (error instanceof InsufficientCreditsException) {
    this.logger.error('Insufficient credits:', {
      required: error.details.requiredCredits,
      available: error.details.availableCredits,
      operation: error.details.operation,
    });

    throw new BadRequestException({
      error: 'insufficient_credits',
      message: error.message,
      requiredCredits: error.details.requiredCredits,
      availableCredits: error.details.availableCredits,
    });
  }
  throw error;
}
```

---

## Testing

### Unit Testing

Mock the Mana Core services in your tests:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CreditClientService } from '@mana-core/nestjs-integration';

describe('CharacterController', () => {
  let controller: CharacterController;
  let creditClient: CreditClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharacterController],
      providers: [
        {
          provide: CreditClientService,
          useValue: {
            validateCredits: jest.fn().mockResolvedValue({
              hasCredits: true,
              availableCredits: 100,
            }),
            consumeCredits: jest.fn().mockResolvedValue({
              success: true,
              transactionId: 'txn_123',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<CharacterController>(CharacterController);
    creditClient = module.get<CreditClientService>(CreditClientService);
  });

  it('should validate credits before character creation', async () => {
    await controller.generateCharacterImages('Test', 'A character', mockUser);

    expect(creditClient.validateCredits).toHaveBeenCalledWith(
      mockUser.sub,
      'character_creation',
      20,
    );
  });
});
```

### Integration Testing

Test with the Mana Core module:

```typescript
import { ManaCoreModule } from '@mana-core/nestjs-integration';

describe('CharacterController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ManaCoreModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            manaServiceUrl: configService.get('MANA_SERVICE_URL'),
            appId: configService.get('APP_ID'),
            serviceKey: configService.get('MANA_SUPABASE_SECRET_KEY'),
            debug: true,
          }),
          inject: [ConfigService],
        }),
        CharacterModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/character (GET) should require authentication', () => {
    return request(app.getHttpServer())
      .get('/character')
      .expect(401);
  });

  it('/character (GET) should return characters with valid token', () => {
    return request(app.getHttpServer())
      .get('/character')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Module not found: @mana-core/nestjs-integration"

**Solution**: Ensure the package is installed correctly:

```bash
npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git
```

#### 2. "401 Unauthorized" on Protected Routes

**Causes**:
- Invalid or expired token
- Token not included in request headers
- Service key not configured

**Solution**:
```typescript
// Check token in request
console.log('Authorization header:', request.headers.authorization);

// Check token expiration
const decoded = jwt.jwtDecode(token);
console.log('Token expires at:', new Date(decoded.exp * 1000));

// Refresh token if expired
const refreshed = await tokenManager.refreshToken();
```

#### 3. Credit Validation Fails

**Causes**:
- User has insufficient credits
- Service key not configured
- App ID not matching

**Solution**:
```typescript
// Check user's balance
const balance = await this.creditClient.getCreditBalance(userId);
console.log('Available credits:', balance.balance);

// Verify service key is set
console.log('Service key configured:', !!process.env.MANA_SUPABASE_SECRET_KEY);

// Check app ID
console.log('App ID:', process.env.APP_ID);
```

#### 4. Token Refresh Not Working

**Causes**:
- Refresh token expired
- Device info not sent
- Backend URL misconfigured

**Solution**:
```typescript
// Log refresh attempt
console.log('Refreshing token with:', {
  refreshToken: refreshToken.substring(0, 10) + '...',
  deviceInfo,
});

// Check backend URL
console.log('Backend URL:', BACKEND_URL);

// Verify device info structure
console.log('Device info:', deviceInfo);
```

### Debug Logging

Enable debug mode to see detailed logs:

```typescript
ManaCoreModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    manaServiceUrl: configService.get('MANA_SERVICE_URL'),
    appId: configService.get('APP_ID'),
    serviceKey: configService.get('MANA_SUPABASE_SECRET_KEY'),
    debug: true, // Enable debug logging
  }),
  inject: [ConfigService],
}),
```

### Support Resources

- **Mana Core Documentation**: https://docs.mana-core.com
- **GitHub Issues**: https://github.com/Memo-2023/mana-core-nestjs-package/issues
- **Storyteller Example**: Check this repository for working examples

---

## Summary

### What You Achieved

After following this guide, your application now has:

1. ✅ **Complete Authentication System**
   - Email/password sign-in and sign-up
   - Google OAuth and Apple Sign-in support
   - Automatic token refresh
   - Multi-device support

2. ✅ **Protected API Routes**
   - Guards to protect sensitive endpoints
   - Decorators to extract user information
   - Custom token extraction for RLS

3. ✅ **Credit Management**
   - Pre-flight credit validation
   - Post-operation credit consumption
   - App-level tracking
   - Error handling for insufficient credits

4. ✅ **Frontend Integration**
   - Authenticated API client
   - Token management with auto-refresh
   - Device info tracking

5. ✅ **Production-Ready**
   - Error handling
   - Logging
   - Testing support

### Next Steps

1. **Customize Operation Types**: Define credit costs for your specific operations
2. **Add Role-Based Access Control**: Use `@RequireRoles()` for advanced permissions
3. **Implement Space Credits**: If your app supports teams/organizations
4. **Monitor Credit Usage**: Add analytics and reporting
5. **Purchase Flow**: Integrate a payment system for credit purchases

### Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/app.module.ts` | Mana Core module configuration |
| `backend/src/character/character.controller.ts` | Example of AuthGuard and CreditClientService usage |
| `backend/src/story/story.controller.ts` | Example of credit validation and consumption |
| `backend/src/decorators/user.decorator.ts` | Custom @UserToken() decorator |
| `mobile/src/utils/api.ts` | Frontend API client with authentication |
| `mobile/src/services/authService.ts` | Frontend authentication service |
| `mobile/src/services/tokenManager.ts` | Token management with auto-refresh |

---

## Questions?

If you have questions or run into issues:

1. Check the [Mana Core Documentation](https://docs.mana-core.com)
2. Review the Storyteller codebase for working examples
3. Open an issue on the [GitHub repository](https://github.com/Memo-2023/mana-core-nestjs-package)

Good luck with your integration! 🚀
