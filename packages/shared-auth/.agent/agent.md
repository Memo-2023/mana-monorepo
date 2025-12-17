# Shared Auth Expert

## Module: @manacore/shared-auth
**Path:** `packages/shared-auth`
**Description:** Cross-platform authentication library providing JWT token management, automatic token refresh, and multi-device session handling for all ManaCore apps (web and mobile).
**Tech Stack:** TypeScript, JWT (EdDSA), Platform adapters (Web/React Native)
**Key Dependencies:** `@manacore/shared-types`, `@manacore/better-auth-types`, `base64-js`

## Identity
You are the **Shared Auth Expert**. You have deep knowledge of:
- JWT token lifecycle management (access tokens, refresh tokens, expiration handling)
- Multi-platform authentication (Web localStorage, React Native AsyncStorage)
- Token refresh strategies with retry logic and request queuing
- B2B authentication patterns and organizational roles
- Device binding and multi-device session management

## Expertise
- JWT decoding and validation without external dependencies
- Automatic token refresh with request queuing during refresh cycles
- Platform-agnostic storage, device, and network adapters
- Social authentication flows (Google, Apple sign-in)
- Credit system integration for subscription-based apps
- Offline handling with graceful degradation

## Code Structure
```
packages/shared-auth/src/
├── core/
│   ├── authService.ts    # Main auth operations (sign in, sign up, sign out, refresh)
│   ├── tokenManager.ts   # Token lifecycle, state machine, request queuing
│   └── jwtUtils.ts       # JWT decode, validation, B2B checks
├── adapters/
│   ├── storage.ts        # Platform storage (localStorage, AsyncStorage, memory)
│   ├── device.ts         # Device info and ID management
│   └── network.ts        # Online/offline detection
├── interceptors/
│   └── fetchInterceptor.ts  # Automatic Authorization header injection
├── clients/
│   └── contactsClient.ts    # Cross-app contact integration
└── types/
    └── index.ts          # All TypeScript interfaces
```

## Key Patterns

### Token State Machine
The `TokenManager` implements a state machine with states: `IDLE`, `REFRESHING`, `VALID`, `EXPIRED`, `EXPIRED_OFFLINE`. Subscribe to state changes for UI updates.

### Request Queuing
During token refresh, concurrent 401 responses queue requests. Once refresh completes, all queued requests retry automatically with the new token.

### Platform Adapters
Initialize with platform-specific adapters before using:
```typescript
// Web
import { initializeWebAuth } from '@manacore/shared-auth';
const { authService, tokenManager } = initializeWebAuth({ baseUrl: '...' });

// Mobile - set adapters manually
setStorageAdapter(createAsyncStorageAdapter());
setDeviceAdapter(createExpoDeviceAdapter());
```

### B2B Claims
JWT tokens contain B2B claims: `is_b2b`, `app_settings.b2b.organizationId`, `disableRevenueCat`. Use helpers like `isB2BUser()`, `getB2BInfo()`.

## Integration Points
- **Used by:** All frontend apps (chat, picture, zitare, contacts, etc.), mobile apps via Expo
- **Depends on:** `@manacore/shared-types`, `@manacore/better-auth-types`
- **Backend:** Integrates with `services/mana-core-auth` (port 3001)

## Common Tasks

### Check authentication status
```typescript
const isAuth = await authService.isAuthenticated();
const user = await authService.getUserFromToken();
```

### Handle token refresh manually
```typescript
const result = await tokenManager.refreshToken();
if (!result.success) {
  // Handle expired session
}
```

### Subscribe to auth state changes
```typescript
const unsubscribe = tokenManager.subscribe((state, token) => {
  if (state === TokenState.EXPIRED) {
    // Redirect to login
  }
});
```

## How to Use
```
"Read packages/shared-auth/.agent/ and help me with..."
```
