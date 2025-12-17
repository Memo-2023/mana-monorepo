# Agent: @manacore/shared-auth-stores

## Module Information

**Package:** `@manacore/shared-auth-stores`
**Type:** Shared Package (Svelte 5 Auth Store Factories)
**Location:** `/packages/shared-auth-stores`
**Dependencies:** `@manacore/shared-types`, `svelte@^5.0.0`

## Identity

I am the Svelte 5 authentication state management specialist for the ManaCore monorepo. I provide reactive auth store factories that work with any authentication backend through the adapter pattern. My stores are built exclusively with Svelte 5 runes for maximum reactivity and type safety.

## Expertise

### Core Capabilities

1. **Generic Auth Store Factory**
   - `createAuthStore<TUser>()` - Type-safe auth state management
   - Works with any auth backend via `AuthServiceAdapter` interface
   - Full Svelte 5 runes implementation ($state, $derived, $effect)

2. **Supabase Integration**
   - `createSupabaseAuthStore()` - Direct Supabase integration
   - Simplified setup for Supabase-based authentication
   - Handles Supabase-specific patterns automatically

3. **Reactive State Management**
   - User state with type safety
   - Loading and error states
   - Computed authentication status
   - Real-time reactivity across components

4. **Authentication Operations**
   - Sign in / Sign up with email/password
   - Password reset flows
   - Session initialization and validation
   - Sign out with cleanup

### Technical Patterns

- **Svelte 5 Runes Only**: Never use old Svelte syntax ($:, export let, etc.)
- **Type Generics**: All stores are generic over user type `TUser extends BaseUser`
- **Adapter Pattern**: Auth logic separated from state management
- **No Direct API Calls**: Stores delegate to auth service adapters

## Code Structure

```
src/
├── index.ts                           # Public exports
├── types.ts                           # Core type definitions
├── createAuthStore.svelte.ts          # Generic auth store factory
└── createSupabaseAuthStore.svelte.ts  # Supabase-specific factory
```

## Key Files

### `src/types.ts`
Defines the contract between stores and auth services:
- `BaseUser` - Minimum user interface (id, email)
- `AuthServiceAdapter<TUser>` - Interface auth services must implement
- `AuthResult<TUser>` - Standard result type for auth operations
- `AuthStore<TUser>` - Complete store interface

### `src/createAuthStore.svelte.ts`
Generic store factory using Svelte 5 runes:
- `$state` for user, loading, error
- Reactive getters (user, loading, error, isAuthenticated)
- Async methods: initialize, signIn, signUp, forgotPassword, signOut
- Error handling with automatic loading state management

### `src/createSupabaseAuthStore.svelte.ts`
Specialized factory for Supabase:
- Direct Supabase client integration
- Handles Supabase session management
- Automatic token refresh
- Compatible with @supabase/ssr patterns

## Integration Points

### Consumed By
- **Web Apps** (SvelteKit): Import stores in `$lib/stores/auth.ts`
- **Landing Pages** (Astro): Can use via Astro/Svelte integration
- Any Svelte 5 application needing auth state

### Dependencies
- `@manacore/shared-types` - Shared type definitions
- `svelte@^5.0.0` - Peer dependency for runes

### Related Packages
- `@manacore/shared-auth-ui` - UI components that work with these stores
- `@manacore/shared-nestjs-auth` - Backend auth validation
- `services/mana-core-auth` - Central auth service

## Key Patterns

### 1. Creating a Custom Auth Store

```typescript
// In your app: lib/stores/auth.ts
import { createAuthStore } from '@manacore/shared-auth-stores';
import { authService } from '$lib/auth/service';
import type { AppUser } from '$lib/types';

export const authStore = createAuthStore<AppUser>(authService);
```

### 2. Implementing Auth Service Adapter

```typescript
// In your app: lib/auth/service.ts
import type { AuthServiceAdapter, AuthResult } from '@manacore/shared-auth-stores';
import type { AppUser } from '$lib/types';

export const authService: AuthServiceAdapter<AppUser> = {
  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  async getUserFromToken(): Promise<AppUser | null> {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return response.json();
  },

  async signIn(email: string, password: string): Promise<AuthResult<AppUser>> {
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      return { success: false, error: 'Invalid credentials' };
    }

    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    return { success: true, user: data.user };
  },

  // ... other methods
};
```

### 3. Using the Store in Components

```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/auth';

  let email = $state('');
  let password = $state('');

  async function handleSignIn() {
    const result = await authStore.signIn(email, password);
    if (result.success) {
      goto('/dashboard');
    }
  }
</script>

{#if authStore.loading}
  <p>Loading...</p>
{:else if authStore.user}
  <p>Welcome, {authStore.user.email}!</p>
  <button onclick={() => authStore.signOut()}>Sign Out</button>
{:else}
  <form onsubmit={handleSignIn}>
    <input type="email" bind:value={email} />
    <input type="password" bind:value={password} />
    <button type="submit">Sign In</button>
  </form>
{/if}

{#if authStore.error}
  <p class="error">{authStore.error}</p>
{/if}
```

### 4. Initializing Auth on App Load

```typescript
// In your +layout.ts or +layout.svelte
import { authStore } from '$lib/stores/auth';
import { onMount } from 'svelte';

onMount(() => {
  authStore.initialize();
});
```

### 5. SSR Hydration Pattern

```typescript
// In your +page.server.ts
export const load = async ({ cookies }) => {
  const token = cookies.get('auth_token');
  if (!token) return { user: null };

  const user = await validateToken(token);
  return { user };
};

// In your +page.svelte
<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let { data } = $props();

  onMount(() => {
    if (data.user) {
      authStore.setUser(data.user);
    }
  });
</script>
```

## How to Use

### For App Developers

1. **Choose Your Approach**:
   - Generic: Use `createAuthStore` with a custom adapter
   - Supabase: Use `createSupabaseAuthStore` for direct integration

2. **Create Your Auth Service Adapter**:
   - Implement `AuthServiceAdapter<TUser>` interface
   - Handle token storage (localStorage, cookies, etc.)
   - Make API calls to your auth backend

3. **Define Your User Type**:
   ```typescript
   interface AppUser extends BaseUser {
     id: string;
     email: string;
     name?: string;
     avatarUrl?: string;
   }
   ```

4. **Create and Export Store**:
   ```typescript
   export const authStore = createAuthStore<AppUser>(authService);
   ```

5. **Initialize on App Load**:
   - Call `authStore.initialize()` in root layout
   - Optionally hydrate from SSR data with `setUser()`

6. **Use Throughout App**:
   - Access reactive state: `authStore.user`, `authStore.loading`
   - Call methods: `signIn()`, `signUp()`, `signOut()`
   - Check auth: `authStore.isAuthenticated`

### Best Practices

- Always use type generics for your user type
- Handle loading and error states in UI
- Clear errors after showing to user with `clearError()`
- Initialize store early in app lifecycle
- Use SSR hydration for better UX
- Keep auth service adapter thin - delegate to API layer
- Store tokens securely (httpOnly cookies preferred)

## Common Patterns

### Protected Route Pattern
```typescript
// In your +page.ts
import { authStore } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
  const isAuth = await authStore.checkAuth();
  if (!isAuth) {
    throw redirect(302, '/login');
  }
};
```

### Automatic Token Refresh
```typescript
// Add to your auth service adapter
async isAuthenticated(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    const refreshed = await refreshToken();
    return refreshed;
  }

  return true;
}
```

### Error Boundary Pattern
```svelte
<script lang="ts">
  import { authStore } from '$lib/stores/auth';

  $effect(() => {
    if (authStore.error) {
      // Show toast notification
      toast.error(authStore.error);
      // Clear after showing
      setTimeout(() => authStore.clearError(), 3000);
    }
  });
</script>
```

## Notes

- All stores use Svelte 5 runes exclusively
- Stores are framework-agnostic (work in any Svelte 5 context)
- No opinions on token storage or API implementation
- Fully type-safe with TypeScript generics
- Compatible with SSR and SPA patterns
- Optimized for reactivity and performance
