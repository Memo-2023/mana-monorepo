# Authentication Guidelines

## Overview

All authentication is handled by **Mana Core Auth**, a centralized authentication service using **Better Auth** with **EdDSA JWT** tokens.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Web/Mobile    │────>│  Compute Server │────>│    mana-auth     │
│     Client      │     │  (Hono/Bun)     │     │   (port 3001)    │
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

## User ID Format

**CRITICAL**: Mana Core Auth uses Better Auth, which generates **non-UUID user IDs**.

```
Example user ID: otUe1YrfENPdHnrF3g1vSBfpkQfambCZ
```

**Format details:**
- 32 characters
- Base62 alphabet (a-z, A-Z, 0-9)
- ~190 bits of entropy (more than UUID's 122 bits)
- NOT a valid UUID format

**Database schema implications:**

```typescript
// CORRECT - use text for user_id
userId: text('user_id').notNull(),

// WRONG - will cause "invalid input syntax for type uuid" errors
userId: uuid('user_id').notNull(),
```

Always use `text` type for `user_id` columns in all database schemas.

## Token Structure (EdDSA JWT)

```json
{
  "sub": "otUe1YrfENPdHnrF3g1vSBfpkQfambCZ",
  "email": "user@example.com",
  "role": "user",
  "sid": "session-id-456",
  "iat": 1701234567,
  "exp": 1701238167,
  "iss": "manacore",
  "aud": "manacore"
}
```

**Note**: The `sub` claim contains the Better Auth user ID (not a UUID).

**Important**: Keep claims minimal. Do NOT include:
- Credit balance (changes frequently)
- Organization data (use API instead)
- Feature flags
- Other dynamic data

## Shared Packages

| Package | Purpose | Use Case |
|---------|---------|----------|
| `@manacore/shared-hono` | Hono auth middleware + helpers | All compute servers (Hono/Bun) |
| `@manacore/shared-auth` | Client auth service | Web/Mobile apps |

## Server Integration (Hono/Bun)

All compute servers use `@manacore/shared-hono`:

```typescript
import { Hono } from 'hono';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';

const app = new Hono();
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.route('/health', healthRoute('my-server'));

// Protect all /api/* routes
app.use('/api/*', authMiddleware());

// Access user in route handlers
app.get('/api/v1/data', (c) => {
  const userId = c.get('userId');   // Better Auth user ID (not UUID)
  const email = c.get('userEmail');
  return c.json({ userId });
});
```

## Environment Variables

```env
# Required for all servers
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

### Runtime URL Injection (Recommended for Docker)

For Docker deployments, use runtime URL injection instead of build-time environment variables:

**Step 1: Server Hook (`hooks.server.ts`)**

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace(
        '%RUNTIME_ENV%',
        `<script>
          window.__PUBLIC_AUTH_URL__ = "${env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001'}";
          window.__PUBLIC_BACKEND_URL__ = "${env.PUBLIC_BACKEND_URL || 'http://localhost:3000'}";
        </script>`
      ),
  });
};
```

**Step 2: Update `app.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    %sveltekit.head%
    %RUNTIME_ENV%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

**Step 3: URL Helper (`url.ts`)**

```typescript
// src/lib/config/url.ts
import { browser } from '$app/environment';
import { PUBLIC_MANA_CORE_AUTH_URL, PUBLIC_BACKEND_URL } from '$env/static/public';

declare global {
  interface Window {
    __PUBLIC_AUTH_URL__?: string;
    __PUBLIC_BACKEND_URL__?: string;
  }
}

export function getAuthUrl(): string {
  if (browser && window.__PUBLIC_AUTH_URL__) {
    return window.__PUBLIC_AUTH_URL__;
  }
  return PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}

export function getBackendUrl(): string {
  if (browser && window.__PUBLIC_BACKEND_URL__) {
    return window.__PUBLIC_BACKEND_URL__;
  }
  return PUBLIC_BACKEND_URL || 'http://localhost:3000';
}
```

### Standard Auth Store Pattern (Svelte 5)

```typescript
// src/lib/stores/auth.svelte.ts
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { initializeWebAuth } from '@manacore/shared-auth';
import { getAuthUrl } from '$lib/config/url';

// Lazy initialization - only create when needed (browser only)
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;

function getAuthService() {
  if (!browser) return null;
  if (!_authService) {
    const auth = initializeWebAuth({ baseUrl: getAuthUrl() });
    _authService = auth.authService;
  }
  return _authService;
}

// Svelte 5 reactive state
let user = $state<User | null>(null);
let accessToken = $state<string | null>(null);
let loading = $state(true);
let initialized = $state(false);

// Initialize auth on app start
async function initialize() {
  if (!browser || initialized) return;

  const authService = getAuthService();
  if (!authService) {
    loading = false;
    return;
  }

  try {
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      user = currentUser;
      // Use getValidToken() for auto-refresh, NOT getAccessToken()
      accessToken = await authService.getValidToken();
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    user = null;
    accessToken = null;
  } finally {
    loading = false;
    initialized = true;
  }
}

// Get a valid token (with auto-refresh if expired)
async function getValidToken(): Promise<string | null> {
  const authService = getAuthService();
  if (!authService) return null;

  try {
    return await authService.getValidToken();
  } catch {
    // Token refresh failed, user needs to re-login
    await logout();
    return null;
  }
}

// DEPRECATED: Use getValidToken() instead
function getAccessToken(): string | null {
  console.warn('getAccessToken() is deprecated. Use getValidToken() for auto-refresh.');
  return accessToken;
}

async function login(email: string, password: string): Promise<boolean> {
  const authService = getAuthService();
  if (!authService) return false;

  try {
    const result = await authService.signIn({ email, password });
    user = result.user;
    accessToken = result.accessToken;
    return true;
  } catch {
    return false;
  }
}

async function logout() {
  const authService = getAuthService();
  if (authService) {
    try {
      await authService.signOut();
    } catch {
      // Ignore logout errors
    }
  }
  user = null;
  accessToken = null;
  goto('/login');
}

export const authStore = {
  // Getters (reactive)
  get user() { return user; },
  get loading() { return loading; },
  get isAuthenticated() { return !!accessToken && !!user; },
  get initialized() { return initialized; },

  // Methods
  initialize,
  login,
  logout,
  getValidToken,      // RECOMMENDED
  getAccessToken,     // DEPRECATED
};
```

### Key Best Practices

| Practice | Description |
|----------|-------------|
| **Lazy Initialization** | Only create auth service when needed (browser check) |
| **Use `getValidToken()`** | Auto-refreshes expired tokens, unlike `getAccessToken()` |
| **Runtime URL Injection** | Enables Docker deployments without rebuild |
| **SSR Guard** | Always check `browser` before accessing auth service |
| **Initialized Flag** | Prevents double initialization |

### Basic Setup (Static URLs)

For simpler deployments without Docker, use static environment variables:

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

## Server-Side Tier Gating

The JWT carries a `tier` claim (`guest | public | beta | alpha | founder`) sourced from `auth.users.access_tier`. Client-side `AuthGate` enforcement is not enough — a user can still call the API directly with their token. For any endpoint that consumes shared infrastructure (LLM calls, external search, image/video generation), add a server-side `requireTier` gate on top of `authMiddleware`.

```typescript
import { authMiddleware, requireTier } from '@mana/shared-hono';

app.use('/api/*', authMiddleware());
app.use('/api/v1/research/*', requireTier('beta'));
app.use('/api/v1/picture/*', requireTier('beta'));
```

Rules:
- Apply at the module-group level in `index.ts`, not inside handlers — easy to audit in one place.
- `requireTier` always runs after `authMiddleware`; it relies on the `userTier` context variable the middleware sets.
- Missing / unknown `tier` claims default to `public`, so a malformed JWT cannot accidentally grant `alpha`.
- Pure CRUD modules that only expose a user's own records don't need a tier gate — the access check is ownership, not tier.
- `DEV_BYPASS_AUTH=true` sets `userTier=founder` by default; override with `DEV_USER_TIER=<tier>` when testing rejection paths locally.

## Development Bypass

For local development, you can bypass auth:

```env
DEV_BYPASS_AUTH=true
DEV_USER_ID=dev-user-123
DEV_USER_TIER=founder   # optional — defaults to founder
```

The guard will inject a mock user:

```typescript
// From JwtAuthGuard when bypass is enabled
request.user = {
  userId: process.env.DEV_USER_ID || 'dev-user',
  email: 'dev@example.com',
  role: 'user',
  tier: process.env.DEV_USER_TIER || 'founder',
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

## SvelteKit Auth Routes Checklist

When creating a new SvelteKit web app, **ALL** of the following auth routes MUST be implemented:

### Required Routes (in `src/routes/(auth)/`)

| Route | Page | Component | Store Method |
|-------|------|-----------|-------------|
| `/login` | `login/+page.svelte` | `LoginPage` from `@manacore/shared-auth-ui` | `authStore.signIn()` |
| `/register` | `register/+page.svelte` | `RegisterPage` from `@manacore/shared-auth-ui` | `authStore.signUp()` |
| `/forgot-password` | `forgot-password/+page.svelte` | `ForgotPasswordPage` from `@manacore/shared-auth-ui` | `authStore.resetPassword()` |
| `/reset-password` | `reset-password/+page.svelte` | Custom form (token from URL) | `authStore.resetPasswordWithToken()` |

### Required Auth Store Methods

The `auth.svelte.ts` store MUST implement these methods using `@manacore/shared-auth`:

| Method | Shared Auth Method | Purpose |
|--------|-------------------|---------|
| `signIn(email, password)` | `authService.signIn()` | Login |
| `signUp(email, password)` | `authService.signUp()` | Register |
| `signOut()` | `authService.signOut()` | Logout |
| `resetPassword(email)` | `authService.forgotPassword()` | Send reset email |
| `resetPasswordWithToken(token, pw)` | `authService.resetPassword()` | Reset with token |
| `resendVerificationEmail(email)` | `authService.resendVerificationEmail()` | Resend verification |
| `getValidToken()` | `tokenManager.getValidToken()` | Get valid JWT |
| `getAuthHeaders()` | Direct localStorage read | Get `Authorization` header |

### Login Page Template

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { LoginPage } from '@manacore/shared-auth-ui';
  import { getLoginTranslations } from '@manacore/shared-i18n';
  import { YourAppLogo } from '@manacore/shared-branding';
  import { authStore } from '$lib/stores/auth.svelte';

  const translations = getLoginTranslations('en');

  async function handleSignIn(email: string, password: string) {
    return authStore.signIn(email, password);
  }
</script>

<LoginPage
  appName="YourApp"
  logo={YourAppLogo}
  primaryColor="#your-color"
  onSignIn={handleSignIn}
  {goto}
  forgotPasswordPath="/forgot-password"
  registerPath="/register"
  {translations}
/>
```

### Forgot Password Page Template

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
  import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
  import { YourAppLogo } from '@manacore/shared-branding';
  import { authStore } from '$lib/stores/auth.svelte';

  const translations = getForgotPasswordTranslations('en');

  async function handleForgotPassword(email: string) {
    return authStore.resetPassword(email);
  }
</script>

<ForgotPasswordPage
  appName="YourApp"
  logo={YourAppLogo}
  primaryColor="#your-color"
  onForgotPassword={handleForgotPassword}
  {goto}
  loginPath="/login"
  {translations}
/>
```

### Reset Password Page

The reset password page is a **custom implementation** (not a shared component) because it handles token validation from URL params. See `apps/calendar/apps/web/src/routes/(auth)/reset-password/+page.svelte` as reference.

Key requirements:
- Read `token` from `$page.url.searchParams`
- Validate password length (min 8 chars) and match
- Call `authStore.resetPasswordWithToken(token, password)`
- Show success state and redirect to `/login` after 3 seconds
- Show invalid token state with link to `/forgot-password`

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

---

## Auth UX Patterns

### Email Verification Flow

**Rule: Distinguish all email-related error states, never show a generic error.**

| User Action | State | Expected UX |
|-------------|-------|-------------|
| Register with new email | `needsVerification: true` | Green "Check your email" panel + Resend button |
| Register with existing **unverified** email | `EMAIL_ALREADY_REGISTERED` | Amber warning panel + Resend button + "Sign in instead" link |
| Register with existing **verified** email | `EMAIL_ALREADY_REGISTERED` | Same amber panel — user should click "Sign in instead" |
| Login with unverified email | `EMAIL_NOT_VERIFIED` | Inline error + Resend button (not generic "invalid credentials") |
| Login with wrong password | `INVALID_CREDENTIALS` | Inline error — no resend button |

**Implementation:**

- Backend (`auth.ts`): catch `USER_ALREADY_EXISTS` from Better Auth → return `{ code: 'EMAIL_ALREADY_REGISTERED' }` (409)
- Backend (`auth.ts`): catch `EMAIL_NOT_VERIFIED` / `status: 'FORBIDDEN'` on login → return `{ code: 'EMAIL_NOT_VERIFIED' }` (403)
- `authService.ts`: map both codes to typed error strings, never swallow as generic error
- `RegisterPage`: `emailAlreadyRegistered` state triggers amber panel with dual CTAs
- `LoginPage`: `showEmailNotVerified` state triggers resend button below error message

**Key principle:** A user who registered but never verified should always be able to request a new verification email, from *both* the login and register pages, without knowing which page to go to.

### Verification Email Redirect

The verification email must redirect back to the source app, not to `auth.mana.how/`.

- `sourceAppStore.set(email, sourceAppUrl)` is called before `signUpEmail` and before `sendVerificationEmail`
- The `sendVerificationEmail` callback in `better-auth.config.ts` sets **`callbackURL`** (not `redirectTo`) on the verification URL
- Better Auth uses `callbackURL` for the post-verification redirect; `redirectTo` is ignored
- `sourceAppUrl` comes from `window.location.origin` in the browser (set by `createManaAuthStore`)
