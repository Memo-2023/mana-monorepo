# Frontend Authentication Flow with Middleware and Supabase

This document outlines how to authenticate your frontend applications (web, React Native, etc.) with the middleware service that issues Supabase-compatible JWTs.

## Overview

The authentication flow works as follows:

1. Frontend app authenticates with middleware service
2. Middleware issues a Supabase-compatible JWT token
3. Frontend sets this token as the Supabase session
4. All Supabase operations now respect RLS policies

## Integration Steps

### 1. Set Up Supabase Client

```javascript
// For React Native
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom storage adapter for React Native
const AsyncStorageAdapter = {
  getItem: async (key) => await AsyncStorage.getItem(key),
  setItem: async (key, value) => await AsyncStorage.setItem(key, value),
  removeItem: async (key) => await AsyncStorage.removeItem(key),
};

// Initialize Supabase client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorageAdapter, // For React Native
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// For Web applications, you can use built-in storage
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

### 2. Implement Authentication with Middleware

```javascript
// Sign in with middleware service
export const signInWithMiddleware = async (email, password) => {
  try {
    // 1. Authenticate with middleware
    const response = await fetch('https://your-middleware-api.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    // 2. Get Supabase-compatible JWT
    const { token, refreshToken } = await response.json();
    
    // 3. Set the Supabase session
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken || '',
    });
    
    if (error) throw error;
    
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
};
```

### 3. Session Management

```javascript
// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

// Get current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
};

// Refresh token when needed
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error refreshing session:', error.message);
    return null;
  }
};
```

### 4. Auth State Management

```javascript
// React Hook for auth state
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user || null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return { user, loading, signIn: signInWithMiddleware, signOut };
};
```

### 5. Complete Example in React Native

```jsx
import React from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useAuth } from './auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { user, loading, signIn, signOut } = useAuth();

  const handleLogin = async () => {
    try {
      setError(null);
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      {user ? (
        <View>
          <Text>Logged in as: {user.email}</Text>
          <Button title="Sign Out" onPress={signOut} />
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ marginBottom: 10, padding: 10, borderWidth: 1 }}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 10, padding: 10, borderWidth: 1 }}
          />
          <Button title="Sign In" onPress={handleLogin} />
        </View>
      )}
      
      {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
    </View>
  );
}
```

## Middleware Requirements

The middleware service must:

1. Issue JWT tokens that are compatible with Supabase:
   - Include standard claims: `sub` (user ID), `email`, etc.
   - Include an `exp` claim for token expiration
   - Sign the token with the same JWT secret configured in Supabase

2. Optionally provide refresh tokens for extended sessions

3. Security considerations:
   - Tokens should have appropriate expiration times
   - Refresh tokens should be rotated and revocable
   - Proper validation of credentials before issuing tokens

## Troubleshooting

Common issues and solutions:

1. **"Invalid JWT" errors**: Ensure your middleware is generating tokens with the exact format Supabase expects and signing them with the correct secret.

2. **RLS policies not applying**: Make sure your token includes the `sub` claim with the user ID that matches your database.

3. **Token expiration issues**: Add token refresh logic to handle expired tokens gracefully.

4. **Authorization headers not being sent**: Verify that your Supabase client is properly configured with the auth session.

## Advanced Usage

### Social Authentication

For social authentication, you can:

1. Implement the OAuth flow in your middleware
2. Convert the OAuth provider's tokens to your Supabase-compatible JWT
3. Set the session in your frontend app

### Custom Claims

To include custom claims in your JWT:

1. Add them to the token payload when generated by the middleware
2. Access them in RLS policies using `auth.jwt.your_claim_name`

### Handling Token Refresh

For long-lived sessions, implement refresh token logic:

1. Store refresh tokens securely in your database
2. Create a `/refresh` endpoint in your middleware
3. Implement client-side token refresh logic that detects expired tokens
4. Exchange refresh tokens for new access tokens

## Security Best Practices

1. Use HTTPS for all API communications
2. Set appropriate token expiration times
3. Implement CORS policies on your middleware
4. Consider rate limiting for authentication endpoints
5. Encrypt sensitive data in storage
6. Use secure, HTTP-only cookies for web applications when possible