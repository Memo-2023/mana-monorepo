# Authentication Guidelines

## Overview

All authentication is handled by **Mana Core Auth**, a centralized authentication service using **Better Auth** with **EdDSA JWT** tokens.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Web/Mobile    │────>│  Backend API    │────>│  mana-core-auth  │
│     Client      │     │    (NestJS)     │     │   (port 3001)    │
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │                       │
        │ 1. Login              │                       │
        │─────────────────────────────────────────────>│
        │                       │                       │
        │ 2. JWT Token          │                       │
        │<─────────────────────────────────────────────│
        │                       │                       │
        │ 3. API Request        │                       │
        │  + Bearer Token       │                       │
        │──────────────────────>│                       │
        │                       │                       │
        │                       │ 4. Validate Token     │
        │                       │──────────────────────>│
        │                       │                       │
        │                       │ 5. {valid, payload}   │
        │                       │<──────────────────────│
        │                       │                       │
        │ 6. Response           │                       │
        │<──────────────────────│                       │
```

## Token Structure (EdDSA JWT)

```json
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "role": "user",
  "sid": "session-id-456",
  "iat": 1701234567,
  "exp": 1701238167,
  "iss": "manacore",
  "aud": "manacore"
}
```

**Important**: Keep claims minimal. Do NOT include:
- Credit balance (changes frequently)
- Organization data (use API instead)
- Feature flags
- Other dynamic data

## Shared Packages

| Package | Purpose | Use Case |
|---------|---------|----------|
| `@manacore/shared-nestjs-auth` | NestJS guards/decorators | Backend APIs |
| `@mana-core/nestjs-integration` | Auth + Credits integration | Backends with credits |
| `@manacore/shared-auth` | Client auth service | Web/Mobile apps |

## Backend Integration

### Option 1: Simple Auth Only

Use `@manacore/shared-nestjs-auth` for JWT validation:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // No auth module needed - guards handle it
  ],
})
export class AppModule {}
```

```typescript
// file.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('files')
@UseGuards(JwtAuthGuard)  // Apply to all routes
export class FileController {
  @Get()
  async listFiles(@CurrentUser() user: CurrentUserData) {
    // user.userId, user.email, user.role available
    return this.fileService.findAll(user.userId);
  }
}
```

### Option 2: Auth + Credits

Use `@mana-core/nestjs-integration` for full integration:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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

```typescript
// generation.controller.ts
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
import { CreditClientService } from '@mana-core/nestjs-integration';

@Controller('generations')
@UseGuards(AuthGuard)
export class GenerationController {
  constructor(private creditClient: CreditClientService) {}

  @Post()
  async generate(@CurrentUser() user: any, @Body() dto: GenerateDto) {
    // Check and consume credits
    const result = await this.creditClient.consumeCredits(
      user.sub,
      'ai_generation',
      10,
      'AI image generation'
    );

    if (!result.ok) {
      throw new AppException(result.error);
    }

    // Proceed with generation
    return this.generationService.generate(user.sub, dto);
  }
}
```

## Environment Variables

```env
# Required for all backends
MANA_CORE_AUTH_URL=http://localhost:3001

# Development bypass (optional)
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=dev-user-123

# For credit operations (when using nestjs-integration)
MANA_CORE_SERVICE_KEY=your-service-key
APP_ID=your-app-id
```

## Client Integration (Web)

### Setup

```typescript
// src/lib/stores/auth.svelte.ts
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { initializeWebAuth } from '@manacore/shared-auth';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

const AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Lazy initialize to avoid SSR issues
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;

function getAuthService() {
  if (!browser) return null;
  if (!_authService) {
    const auth = initializeWebAuth({ baseUrl: AUTH_URL });
    _authService = auth.authService;
  }
  return _authService;
}

// State
let user = $state<User | null>(null);
let token = $state<string | null>(null);
let loading = $state(true);

// Initialize on app start
async function initialize() {
  if (!browser) return;

  const authService = getAuthService();
  if (!authService) return;

  const currentUser = await authService.getCurrentUser();
  if (currentUser) {
    user = currentUser;
    token = await authService.getAccessToken();
  }

  loading = false;
}

// Actions
async function login(email: string, password: string): Promise<boolean> {
  const authService = getAuthService();
  if (!authService) return false;

  try {
    const result = await authService.signIn({ email, password });
    user = result.user;
    token = result.accessToken;
    return true;
  } catch {
    return false;
  }
}

async function logout() {
  const authService = getAuthService();
  if (authService) {
    await authService.signOut();
  }
  user = null;
  token = null;
  goto('/login');
}

export const authStore = {
  get user() { return user; },
  get token() { return token; },
  get loading() { return loading; },
  get isAuthenticated() { return !!token; },
  initialize,
  login,
  logout,
};
```

### Protected Routes

```svelte
<!-- src/routes/(protected)/+layout.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    authStore.initialize();
  });

  $effect(() => {
    if (browser && !authStore.loading && !authStore.isAuthenticated) {
      goto('/login');
    }
  });
</script>

{#if authStore.loading}
  <LoadingScreen />
{:else if authStore.isAuthenticated}
  {@render children()}
{/if}
```

### API Requests with Token

```typescript
// src/lib/api/client.ts
import { authStore } from '$lib/stores/auth.svelte';
import { goto } from '$app/navigation';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<Result<T>> {
  const token = authStore.token;

  const response = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Handle 401 - session expired
  if (response.status === 401) {
    authStore.logout();
    goto('/login');
    return { ok: false, error: { code: 'ERR_2000', message: 'Session expired' } };
  }

  const json = await response.json();
  return json.ok ? { ok: true, data: json.data } : { ok: false, error: json.error };
}
```

## Client Integration (Mobile)

### Auth Provider

```tsx
// context/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initializeMobileAuth } from '@manacore/shared-auth';
import Constants from 'expo-constants';

const AUTH_URL = Constants.expoConfig?.extra?.authUrl ?? 'http://localhost:3001';
const TOKEN_KEY = 'mana_auth_token';
const USER_KEY = 'mana_auth_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        // Validate token is still valid
        const isValid = await validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token expired, clear storage
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${AUTH_URL}/api/v1/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      return result.valid === true;
    } catch {
      return false;
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.accessToken && result.user) {
        await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
        setToken(result.accessToken);
        setUser(result.user);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
```

## Auth Endpoints

### Mana Core Auth API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login, returns JWT |
| `/api/v1/auth/logout` | POST | Logout, invalidates session |
| `/api/v1/auth/validate` | POST | Validate JWT token |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/auth/jwks` | GET | Get JWKS for token verification |

### Request/Response Examples

**Register**
```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}

Response:
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "..."
}
```

**Login**
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "..."
}
```

**Validate Token**
```bash
POST /api/v1/auth/validate
{
  "token": "eyJ..."
}

Response:
{
  "valid": true,
  "payload": {
    "sub": "user-id",
    "email": "user@example.com",
    "role": "user",
    "sid": "session-id"
  }
}
```

## Development Bypass

For local development, you can bypass auth:

```env
DEV_BYPASS_AUTH=true
DEV_USER_ID=dev-user-123
```

The guard will inject a mock user:

```typescript
// From JwtAuthGuard when bypass is enabled
request.user = {
  userId: process.env.DEV_USER_ID || 'dev-user',
  email: 'dev@example.com',
  role: 'user',
};
```

## Testing with Auth

### Unit Tests

```typescript
// Mock the guard
const module = await Test.createTestingModule({
  controllers: [FileController],
  providers: [FileService],
})
  .overrideGuard(JwtAuthGuard)
  .useValue({ canActivate: () => true })
  .compile();

// Mock user in controller tests
const mockUser = { userId: 'test-user', email: 'test@example.com', role: 'user' };
await controller.listFiles(mockUser);
```

### E2E Tests

```typescript
// Get a real token
const loginResponse = await request(app.getHttpServer())
  .post('/api/v1/auth/login')
  .send({ email: 'test@example.com', password: 'password' });

const token = loginResponse.body.accessToken;

// Use token in requests
await request(app.getHttpServer())
  .get('/api/v1/files')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

## Security Considerations

1. **Store tokens securely**
   - Web: HttpOnly cookies or memory (not localStorage)
   - Mobile: SecureStore (not AsyncStorage)

2. **Token refresh**
   - Access tokens expire in 1 hour
   - Use refresh tokens to get new access tokens
   - Handle 401 responses gracefully

3. **CORS configuration**
   - Only allow known origins
   - Include credentials for cookie-based auth

4. **Never trust client data**
   - Always validate token server-side
   - Use `@CurrentUser()` decorator, not request body

## Debugging

### Token not validating?

```bash
# 1. Check algorithm (should be EdDSA)
echo $TOKEN | cut -d'.' -f1 | base64 -d

# 2. Check JWKS endpoint
curl http://localhost:3001/api/v1/auth/jwks

# 3. Check issuer/audience
# Should match between signing and validation
```

### 401 errors?

1. Check token exists in Authorization header
2. Check token format: `Bearer <token>`
3. Check token hasn't expired
4. Check MANA_CORE_AUTH_URL is correct
