# Mana Core Auth Integration Guide - Chat Project

This guide explains how to integrate the Chat project with the new **Mana Core Auth** system, replacing Supabase Auth.

## Overview

The Chat project currently uses **Supabase Auth** across all apps. We're migrating to **Mana Core Auth**, our centralized authentication system with built-in credit management.

### Benefits

- ✅ **Unified Authentication** - Single auth system for all Mana Core apps
- ✅ **Built-in Credits** - Automatic credit balance management (150 signup bonus + 5 daily)
- ✅ **Better Security** - RS256 JWT, refresh token rotation, optimistic locking
- ✅ **Cost Savings** - Self-hosted, no per-user charges
- ✅ **Full Control** - Complete ownership of user data and auth flow

## Architecture

```
Chat Apps (Web, Mobile, Landing)
    ↓
@manacore/shared-auth (Client Library)
    ↓
Mana Core Auth Service (NestJS)
    ↓
PostgreSQL (Users, Sessions, Credits)
```

## What Changed

### 1. Shared Auth Package Updated ✅

The `@manacore/shared-auth` package has been updated to work with Mana Core Auth endpoints:

**Updated endpoints:**

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Email/password login
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/credits/balance` - Get credit balance

**Response format changes:**

- Login returns: `{ accessToken, refreshToken, user, expiresIn, tokenType }`
- Credits balance returns: `{ balance, freeCreditsRemaining, totalEarned, totalSpent }`

## Step-by-Step Integration

### Step 1: Update Environment Variables

#### Backend `.env`

```env
# Remove Supabase variables
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=...

# Add Mana Core Auth URL
MANA_CORE_AUTH_URL=http://localhost:3001
```

#### Web App `.env`

```env
# Remove
# PUBLIC_SUPABASE_URL=...
# PUBLIC_SUPABASE_ANON_KEY=...

# Add
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

#### Mobile App `.env`

```env
# Remove
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Add
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

### Step 2: Update Backend (NestJS)

#### 2.1 Install Dependencies

```bash
cd chat/backend
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

#### 2.2 Create JWT Auth Guard

Create `chat/backend/src/common/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			// Get public key from Mana Core Auth
			const authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL');
			const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (!response.ok) {
				throw new UnauthorizedException('Invalid token');
			}

			const { valid, payload } = await response.json();

			if (!valid) {
				throw new UnauthorizedException('Invalid token');
			}

			// Attach user to request
			request.user = {
				userId: payload.sub,
				email: payload.email,
				role: payload.role,
			};

			return true;
		} catch (error) {
			throw new UnauthorizedException('Invalid token');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
```

#### 2.3 Update Controllers

Replace Supabase guards with JWT Auth guard:

```typescript
// Before
import { UseGuards } from '@nestjs/common';
import { SupabaseGuard } from './guards/supabase.guard';

@UseGuards(SupabaseGuard)

// After
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
```

### Step 3: Update Web App (SvelteKit)

#### 3.1 Update Auth Store

Edit `chat/apps/web/src/lib/stores/auth.svelte.ts`:

```typescript
import { initializeWebAuth } from '@manacore/shared-auth';

const MANA_AUTH_URL = import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Initialize Mana Core Auth
const { authService, tokenManager } = initializeWebAuth({
	baseUrl: MANA_AUTH_URL,
});

class AuthStore {
	user = $state<UserData | null>(null);
	isLoading = $state(true);

	async initialize() {
		this.isLoading = true;
		try {
			const authenticated = await authService.isAuthenticated();
			if (authenticated) {
				const userData = await authService.getUserFromToken();
				this.user = userData;
			}
		} finally {
			this.isLoading = false;
		}
	}

	async signIn(email: string, password: string) {
		const result = await authService.signIn(email, password);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			this.user = userData;
		}
		return result;
	}

	async signUp(email: string, password: string) {
		const result = await authService.signUp(email, password);
		// After signup, automatically sign in
		if (result.success) {
			return this.signIn(email, password);
		}
		return result;
	}

	async signOut() {
		await authService.signOut();
		this.user = null;
	}

	async resetPassword(email: string) {
		return authService.forgotPassword(email);
	}
}

export const authStore = new AuthStore();
```

#### 3.2 Update Server Hooks

Edit `chat/apps/web/src/hooks.server.ts`:

```typescript
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Get token from cookies
	const token = event.cookies.get('auth_token');

	if (token) {
		try {
			// Validate token with Mana Core Auth
			const authUrl = process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
			const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (response.ok) {
				const { valid, payload } = await response.json();
				if (valid) {
					event.locals.user = {
						id: payload.sub,
						email: payload.email,
						role: payload.role,
					};
				}
			}
		} catch (error) {
			console.error('Error validating token:', error);
		}
	}

	return resolve(event);
};
```

### Step 4: Update Mobile App (Expo)

#### 4.1 Update AuthProvider

Edit `chat/apps/mobile/context/AuthProvider.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  createAuthService,
  createTokenManager,
  setStorageAdapter,
  setDeviceAdapter,
  setNetworkAdapter,
  type UserData,
} from '@manacore/shared-auth';
import { createSecureStoreAdapter } from '@manacore/shared-auth/native'; // You may need to create this

const MANA_AUTH_URL = process.env.EXPO_PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Initialize auth service
const authService = createAuthService({ baseUrl: MANA_AUTH_URL });
const tokenManager = createTokenManager(authService);

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        const userData = await authService.getUserFromToken();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const result = await authService.signIn(email, password);
    if (result.success) {
      const userData = await authService.getUserFromToken();
      setUser(userData);
    } else {
      throw new Error(result.error || 'Sign in failed');
    }
  }

  async function signUp(email: string, password: string) {
    const result = await authService.signUp(email, password);
    if (result.success) {
      // Auto sign in after signup
      await signIn(email, password);
    } else {
      throw new Error(result.error || 'Sign up failed');
    }
  }

  async function signOut() {
    await authService.signOut();
    setUser(null);
  }

  async function resetPassword(email: string) {
    const result = await authService.forgotPassword(email);
    if (!result.success) {
      throw new Error(result.error || 'Password reset failed');
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Step 5: Remove Supabase Dependencies

#### 5.1 Web App

```bash
cd chat/apps/web
pnpm remove @supabase/ssr @supabase/supabase-js
```

Delete or update these files:

- `src/lib/services/supabase.ts` (no longer needed)

#### 5.2 Mobile App

```bash
cd chat/apps/mobile
pnpm remove @supabase/supabase-js
```

Delete or update these files:

- `utils/supabase.ts` (no longer needed)

#### 5.3 Backend

```bash
cd chat/backend
pnpm remove @supabase/supabase-js
```

### Step 6: Test the Integration

#### 6.1 Start Mana Core Auth

```bash
# From monorepo root
cd mana-core-auth
pnpm start:dev
```

Service should be running at `http://localhost:3001`

#### 6.2 Start Chat Backend

```bash
cd chat/backend
pnpm start:dev
```

#### 6.3 Start Web App

```bash
cd chat/apps/web
pnpm dev
```

#### 6.4 Test Flow

1. **Register a new user**
   - Go to `/register`
   - Enter email and password
   - Should redirect to login

2. **Login**
   - Enter credentials
   - Should receive tokens and redirect to app

3. **Check credits**
   - User should have 150 initial credits
   - Call `authService.getUserCredits()` to verify

4. **Protected routes**
   - Try accessing `/chat` or other protected routes
   - Should work with valid token

5. **Logout**
   - Click logout
   - Tokens should be cleared
   - Should redirect to login

## API Compatibility

### Mana Core Auth vs Supabase

| Feature            | Supabase Auth | Mana Core Auth | Status   |
| ------------------ | ------------- | -------------- | -------- |
| Email/Password     | ✅            | ✅             | Migrated |
| OAuth (Google)     | ✅            | 🚧             | TODO     |
| OAuth (Apple)      | ✅            | 🚧             | TODO     |
| Password Reset     | ✅            | 🚧             | TODO     |
| Email Verification | ✅            | 🚧             | TODO     |
| Credits            | ❌            | ✅             | New!     |
| Session Management | ✅            | ✅             | Migrated |
| JWT Tokens         | ✅            | ✅             | Migrated |

## Credits System

Mana Core Auth includes a built-in credit system:

```typescript
// Get credit balance
const credits = await authService.getUserCredits();
console.log(credits);
// {
//   credits: 150,  // balance + freeCreditsRemaining
//   maxCreditLimit: 1000,
//   userId: "user-id"
// }
```

### Default Credit Allocation

- **Signup Bonus:** 150 free credits
- **Daily Free:** 5 credits every 24 hours
- **Pricing:** 100 mana = €1.00

## Troubleshooting

### "Connection refused" to Mana Core Auth

**Solution:** Make sure Mana Core Auth is running:

```bash
cd mana-core-auth
pnpm start:dev
```

### "Invalid token" errors

**Solution:** Clear stored tokens and login again:

```typescript
await authService.clearAuthStorage();
```

### CORS errors

**Solution:** Add Chat app URLs to Mana Core Auth `.env`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

## Next Steps

1. ✅ Update `@manacore/shared-auth` package
2. ⏳ Integrate into Chat backend
3. ⏳ Update Chat web app
4. ⏳ Update Chat mobile app
5. ⏳ Test end-to-end
6. 🔜 Add OAuth providers
7. 🔜 Add email verification
8. 🔜 Add password reset

## Resources

- **Mana Core Auth README:** `/mana-core-auth/README.md`
- **Shared Auth Package:** `/packages/shared-auth/`
- **API Documentation:** `/mana-core-auth/README.md#api-endpoints`
- **Quick Start:** `/mana-core-auth/QUICKSTART.md`

---

**Status:** 🚧 Integration Guide Complete - Implementation Pending

**Date:** 2025-11-25
