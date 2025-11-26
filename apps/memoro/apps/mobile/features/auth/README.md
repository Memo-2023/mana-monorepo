# Memoro Authentication Integration

This document provides an overview of the authentication integration implemented in the Memoro app. It covers how the app integrates with the middleware authentication system and Supabase.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [File Structure](#file-structure)
4. [Key Components](#key-components)
5. [Platform-Specific Implementations](#platform-specific-implementations)
6. [Token Management](#token-management)
7. [Middleware API Endpoints](#middleware-api-endpoints)
8. [Row Level Security (RLS)](#row-level-security-rls)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Overview

The Memoro app uses a middleware authentication system as a bridge between the frontend and Supabase, providing a secure and centralized authentication solution. The middleware issues compatible JWT tokens that work with Supabase's Row Level Security (RLS) policies.

```
┌─────────────┐     ┌────────────────┐     ┌─────────────┐
│   Memoro    │────▶│   Middleware   │────▶│   Supabase  │
│     App     │◀────│ Authentication │◀────│   Backend   │
└─────────────┘     └────────────────┘     └─────────────┘
```

### Key Features

- **Application Tokens**: The middleware issues app-specific JWT tokens (appTokens) that are compatible with Supabase's auth system
- **Token Refresh**: Implements secure token refresh mechanism to maintain session persistence
- **Role-Based Access**: Supports role-based access control in the JWT claims
- **Secure Storage**: Uses secure storage for all authentication tokens
- **Email Persistence**: Maintains email data even when tokens don't contain it
- **Cross-Platform**: Supports both web and native mobile platforms

## Authentication Flow

The standard authentication flow works as follows:

1. User enters credentials in the app (login.tsx or register.tsx)
2. The app sends credentials to the middleware with the appId
3. Middleware validates credentials and returns three tokens:
   - `manaToken`: Core authentication token for the middleware
   - `appToken`: Supabase-compatible JWT with appropriate claims
   - `refreshToken`: Used to get new tokens when the appToken expires
4. The app stores these tokens securely using the safeStorage utility (platform-specific)
5. User information is extracted from the token and stored in the AuthContext
6. The Supabase client is configured to use the appToken for all requests
7. All subsequent database operations are subject to RLS policies based on the JWT claims

## File Structure

```
features/
  auth/
    components/
      AuthErrorDisplay.tsx  - Component for displaying authentication errors
      index.ts              - Export file for components
    contexts/
      AuthContext.tsx       - React Context for global auth state management
      index.ts              - Export file for contexts
    index.ts                - Main export file for auth feature
    lib/
      index.ts              - Export file for libraries
      supabaseClient.ts     - Supabase client configuration with JWT integration
    services/
      authService.ts        - Core authentication service with API integrations
      index.ts              - Export file for services
    utils/
      index.ts              - Export file for utilities
      safeStorage.ts        - Secure storage utility for tokens (React Native)
      safeStorage.web.ts    - Web-specific storage utility using localStorage
    README.md               - This documentation file
```

## Key Components

### AuthContext

The `AuthContext` provides a global authentication state and methods for authentication:

```typescript
// Key properties and methods
{
  isAuthenticated: boolean;     // Whether the user is authenticated
  user: User | null;            // Current user information
  loading: boolean;             // Loading state for async operations
  signIn: (email, password) => Promise<Result>; // Sign in with email/password
  signUp: (email, password) => Promise<Result>; // Register a new user
  signOut: () => Promise<void>; // Sign out the current user
}
```

### authService

The `authService` provides core authentication functionality:

```typescript
// Key methods
{
  signIn: (email, password) => Promise<Result>;    // Sign in with credentials
  signUp: (email, password) => Promise<Result>;    // Register a new user
  signOut: () => Promise<void>;                    // Sign out
  refreshTokens: (refreshToken) => Promise<Tokens>; // Refresh expired tokens
  validateToken: () => Promise<boolean>;           // Validate current token
  getUserFromToken: () => Promise<UserData>;       // Extract user data from token
  isAuthenticated: () => Promise<boolean>;         // Check authentication status
  clearAuthStorage: () => Promise<void>;           // Clear all auth data
}
```

### Supabase Integration

The `supabaseClient.ts` file configures Supabase to work with our authentication system:

- Creates a Supabase client with custom auth handling
- Adds JWT to all API requests
- Handles token refresh and session persistence
- Configures realtime subscriptions with authentication

## Platform-Specific Implementations

The authentication system uses platform-specific implementations for certain components to support both web and native mobile platforms.

### Web Platform

For web platforms, the system uses:

- `safeStorage.web.ts`: Storage implementation using browser's localStorage
- Synchronous token retrieval

Example web storage implementation:

```typescript
// Web storage implementation (safeStorage.web.ts)
export const safeStorage = {
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data', e);
    }
  },
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = localStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data', e);
      return null;
    }
  },
  // ... other methods
};
```

### React Native Platform

For native mobile platforms, the system uses:

- `safeStorage.ts`: Storage implementation using React Native's AsyncStorage
- Asynchronous token retrieval and storage

Example native storage implementation:

```typescript
// React Native storage implementation (safeStorage.ts)
export const safeStorage = {
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data', e);
    }
  },
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data', e);
      return null;
    }
  },
  // ... other methods
};
```

## Token Management

### Storage

All tokens are stored securely using the `safeStorage` utility:

```typescript
// Keys used for token storage
const STORAGE_KEYS = {
  MANA_TOKEN: '@auth/manaToken',
  APP_TOKEN: '@auth/appToken',
  REFRESH_TOKEN: '@auth/refreshToken',
  USER_EMAIL: '@auth/userEmail', // Email is stored separately to handle tokens without email
};
```

### Token Refresh

Token refresh happens automatically when:

1. The current token is validated and found to be expired
2. The `authService.validateToken()` method is called
3. The `authService.isAuthenticated()` method is called

When a token is refreshed:
1. New tokens are obtained from the middleware
2. Tokens are stored securely
3. User data is extracted and the AuthContext is updated
4. Supabase client is reconfigured with the new token

### Email Persistence

To handle cases where the refreshed token does not contain the email field:

1. The user's email is stored separately in secure storage during login/registration
2. When decoding a token that doesn't have the email field, the email is retrieved from storage
3. This ensures user information remains complete even after token refresh

## Middleware API Endpoints

The middleware service provides the following endpoints for authentication:

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/auth/signin` | POST | Authenticate with email/password | `email`, `password`, `appId` |
| `/auth/google-signin` | POST | Authenticate with Google | `token` (Google ID token), `appId` |
| `/auth/refresh` | POST | Refresh an expired token | `refreshToken`, `appId` |
| `/auth/validate` | POST | Validate an existing token | `appToken`, `appId` |
| `/auth/logout` | POST | Log out and revoke refresh token | `refreshToken` |

## Row Level Security (RLS)

Supabase uses Row Level Security (RLS) policies to restrict access to data. The middleware-issued JWTs contain claims that RLS policies can use to determine access rights.

### Example RLS Policies

```sql
-- Enable RLS on a table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Basic policy: Users can only access their own data
CREATE POLICY "Users can only access their own data"
ON your_table
FOR ALL
TO authenticated
USING ((current_setting('request.jwt.claims', true)::json->>'sub')::text = user_id);

-- Role-based policy: Admins can access all data
CREATE POLICY "Admins can access all data"
ON your_table
FOR ALL
TO authenticated
USING ((current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin');
```

### Key JWT Claims Used in RLS

- `sub`: The subject claim containing the user ID
- `role`: The user's role for role-based access control
- `app_id`: The application ID that the token was issued for
- Custom claims: Additional claims can be added to the token for specific application needs

## Security Considerations

1. **Token Storage**:
   - Uses the safeStorage utility which is platform-aware
   - Web platform: Uses localStorage
   - Mobile platforms: Uses AsyncStorage
   - Both implementations are wrapped with error handling and consistent API

2. **Token Expiration**:
   - Tokens expire after 1 hour by default
   - Automatic token refresh is implemented
   - Handles graceful redirection to login on refresh failures

3. **Automatic Cleanup**:
   - Auth storage is automatically cleared on:
     - Manual logout
     - Token refresh failures
     - Authentication errors

4. **Loading States**:
   - Login/register buttons are disabled during authentication
   - Loading indicators prevent multiple simultaneous authentication attempts

5. **HTTPS**:
   - Always use HTTPS for all API communications
   - Never transmit tokens over insecure connections

## Troubleshooting

### Common Issues

1. **"Lost user email/ID on settings page"**
   - This can happen when tokens are refreshed and the new token doesn't contain the email field
   - Solution: The app now stores email separately and retrieves it when needed

2. **"Multiple authentication attempts"**
   - Previously possible to trigger multiple sign-in attempts
   - Solution: Login/register buttons are now disabled during authentication

3. **"Authentication state inconsistency"**
   - Can occur if token refresh fails but app state isn't updated
   - Solution: Auth storage is now cleared on refresh failures with redirection to login

4. **"Invalid JWT" errors with Supabase**
   - Ensure the middleware is generating tokens with the correct format
   - Verify the JWT secret used by the middleware matches your Supabase project

5. **"Authentication works but data access fails"**
   - Check that RLS policies are configured correctly
   - Ensure the JWT claims match what your RLS policies expect (especially user ID)

6. **"Web platform errors"**
   - Check that the web implementation is being loaded correctly
   - Verify that the `window` object is defined before accessing localStorage
   - Ensure metro.config.js is properly configured to prioritize .web.ts files

### Debugging Tips

1. Check browser console or app logs for authentication errors
2. Use the AuthErrorDisplay component to show authentication errors
3. Verify network requests to the middleware service
4. Check that tokens are properly stored in secure storage
5. Verify that the loading state is properly managed during auth operations
6. Use JWT.io to decode and inspect your tokens during development
7. For web-specific issues, check browser console and network tab for errors
8. For native-specific issues, check the Expo/React Native logs

## References

- [Supabase JWT Integration Blueprint](/ReadMe/AuthIntegration.md) - Original integration blueprint
- [Audio Recording Documentation](/ReadMe/AudioRecording.md) - Documentation for audio recording features
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) - Official Supabase auth documentation
- [JWT.io](https://jwt.io) - For decoding and inspecting JWT tokens