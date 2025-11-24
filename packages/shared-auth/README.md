# @manacore/shared-auth

Shared authentication utilities for Manacore apps. This package provides a configurable authentication service that can be used across React Native (Expo) and web apps.

## Features

- **Configurable Auth Service**: Create auth services with custom base URLs and endpoints
- **Token Manager**: Handle token refresh, queueing, and state management
- **JWT Utilities**: Decode tokens, check expiration, extract user data
- **Fetch Interceptor**: Automatically attach tokens and handle 401 responses
- **Platform Adapters**: Pluggable storage, device, and network adapters

## Installation

```bash
pnpm add @manacore/shared-auth
```

## Quick Start

### Web (SvelteKit, React, etc.)

```typescript
import { initializeWebAuth } from '@manacore/shared-auth';

const { authService, tokenManager } = initializeWebAuth({
  baseUrl: 'https://api.example.com',
});

// Sign in
const result = await authService.signIn('user@example.com', 'password');
if (result.success) {
  console.log('Signed in!');
}

// Get current user
const user = await authService.getUserFromToken();
console.log(user?.email);

// Sign out
await authService.signOut();
```

### React Native (Expo)

```typescript
import {
  createAuthService,
  createTokenManager,
  setStorageAdapter,
  setDeviceAdapter,
  setNetworkAdapter,
  setupFetchInterceptor,
} from '@manacore/shared-auth';
import * as SecureStore from 'expo-secure-store';

// Create storage adapter for Expo
const expoStorageAdapter = {
  async getItem<T = string>(key: string): Promise<T | null> {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

// Set up adapters
setStorageAdapter(expoStorageAdapter);
setDeviceAdapter(yourDeviceAdapter);
setNetworkAdapter(yourNetworkAdapter);

// Create services
const authService = createAuthService({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});
const tokenManager = createTokenManager(authService);

// Set up fetch interceptor
setupFetchInterceptor(authService, tokenManager);
```

## API Reference

### createAuthService(config)

Creates an authentication service instance.

```typescript
const authService = createAuthService({
  baseUrl: 'https://api.example.com',
  storageKeys: {
    APP_TOKEN: '@auth/appToken',
    REFRESH_TOKEN: '@auth/refreshToken',
    USER_EMAIL: '@auth/userEmail',
  },
  endpoints: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    // ... other endpoints
  },
});
```

### createTokenManager(authService, config?)

Creates a token manager for handling token refresh and state.

```typescript
const tokenManager = createTokenManager(authService, {
  maxQueueSize: 50,
  queueTimeoutMs: 30000,
  maxRefreshAttempts: 3,
  refreshCooldownMs: 5000,
});

// Subscribe to state changes
const unsubscribe = tokenManager.subscribe((state, token) => {
  console.log('Token state:', state);
});

// Get valid token (refreshes if needed)
const token = await tokenManager.getValidToken();
```

### JWT Utilities

```typescript
import {
  decodeToken,
  isTokenValidLocally,
  getUserFromToken,
  isB2BUser,
  getB2BInfo,
} from '@manacore/shared-auth';

const payload = decodeToken(token);
const isValid = isTokenValidLocally(token);
const user = getUserFromToken(token);
const isB2B = isB2BUser(token);
```

### Adapters

The package uses adapters for platform-specific functionality:

- **StorageAdapter**: For storing tokens securely
- **DeviceAdapter**: For getting device information
- **NetworkAdapter**: For checking network connectivity

```typescript
import {
  setStorageAdapter,
  setDeviceAdapter,
  setNetworkAdapter,
} from '@manacore/shared-auth';

setStorageAdapter(myStorageAdapter);
setDeviceAdapter(myDeviceAdapter);
setNetworkAdapter(myNetworkAdapter);
```

## Migration from Existing Auth

To migrate from existing auth implementations:

1. Install the package
2. Set up the adapters for your platform
3. Replace direct authService calls with the shared service
4. Update token manager usage

### Before

```typescript
// memoro/apps/mobile/features/auth/services/authService.ts
import { authService } from './authService';
await authService.signIn(email, password);
```

### After

```typescript
// Use the shared auth service
import { authService } from '@/services/auth'; // Your configured instance
await authService.signIn(email, password);
```

## Token States

The token manager tracks these states:

- `IDLE`: Initial state
- `VALID`: Token is valid
- `REFRESHING`: Token refresh in progress
- `EXPIRED`: Token has expired
- `EXPIRED_OFFLINE`: Token expired while offline (preserves auth)

## Contributing

1. Make changes to the source files in `src/`
2. Run `pnpm run type-check` to validate TypeScript
3. Run `pnpm run build` to compile
