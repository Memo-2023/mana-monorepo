# Google Sign-In Complete Implementation Guide

## Overview

This guide documents the complete Google Sign-In implementation for the Memoro SvelteKit web application. Unlike Apple Sign-In which requires complex redirect flows and multiple callback URLs, Google Sign-In uses a simpler popup-based flow.

**Status:** ✅ **FULLY IMPLEMENTED AND WORKING**

---

## ⚠️ CRITICAL REQUIREMENTS

Before deploying Google Sign-In, you MUST configure these in Google Cloud Console:

1. **Authorized JavaScript origins:**
   - `http://localhost:5173` (local dev)
   - `http://localhost:4173` (preview)
   - `https://app.memoro.ai` (production)

2. **Authorized redirect URIs:** ⚠️ **Required even for popup flow!**
   - `https://auth.expo.io/@memoro/memoro` (mobile app)
   - `https://smenuelzskphnphaaetp.supabase.co/auth/v1/callback` (Supabase)
   - `https://app.memoro.ai/auth/apple-callback` (multi-provider support)
   - `https://app.memoro.ai/auth/apple-callback-handler` (multi-provider support)

**Why redirect URIs are needed:** Even though Google Sign-In uses popup mode (not redirect), Google requires these URIs for cross-platform authentication (web + mobile), Supabase integration, and OAuth consent screen domains. **Missing these will cause the popup to close immediately without signing in.**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Code Implementation](#code-implementation)
4. [Environment Configuration](#environment-configuration)
5. [How It Works](#how-it-works)
6. [Comparison with Apple Sign-In](#comparison-with-apple-sign-in)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

---

## Architecture Overview

### Authentication Flow

```
┌─────────────────┐
│   Login Page    │
│  (SvelteKit)    │
└────────┬────────┘
         │
         │ 1. User clicks "Continue with Google"
         ▼
┌─────────────────────────┐
│ Google Identity Services│
│   (Popup Window)        │
└────────┬────────────────┘
         │
         │ 2. Google returns ID Token (JWT)
         ▼
┌──────────────────────────┐
│ GoogleSignInButton.svelte│
│  handleGoogleSignIn()    │
└────────┬─────────────────┘
         │
         │ 3. Send ID Token to middleware
         ▼
┌──────────────────────────┐
│  Mana Middleware API     │
│ POST /auth/google-signin │
└────────┬─────────────────┘
         │
         │ 4. Return appToken + refreshToken
         ▼
┌──────────────────────────┐
│   Auth Store             │
│ Store tokens, update state│
└────────┬─────────────────┘
         │
         │ 5. Navigate to dashboard
         ▼
┌──────────────────────────┐
│   Dashboard Page         │
│  (Authenticated)         │
└──────────────────────────┘
```

### Key Components

1. **Google Identity Services SDK** - Official Google library loaded from CDN
2. **googleAuth.ts** - Helper utilities for SDK integration
3. **GoogleSignInButton.svelte** - UI component with token callback
4. **Auth Store** - Manages authentication state and tokens
5. **Mana Middleware** - Backend service for token exchange

---

## Google Cloud Console Setup

### Step 1: Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application**

### Step 2: Configure OAuth Client

**Application type:** Web application

**Name:** `Memoro Web App` (or your preferred name)

**Authorized JavaScript origins:** (Add all environments)
```
http://localhost:5173
http://localhost:4173
https://app.memoro.ai
```

**Authorized redirect URIs:** ⚠️ **IMPORTANT: Required even for popup flow**

Even though Google Sign-In uses popup mode (not redirect), you MUST add these redirect URIs to the OAuth client configuration. Google automatically adds these domains to your OAuth consent screen and authorized domains.

**Add all of these:**
```
https://auth.expo.io/@memoro/memoro
https://smenuelzskphnphaaetp.supabase.co/auth/v1/callback
https://app.memoro.ai/auth/apple-callback
https://app.memoro.ai/auth/apple-callback-handler
```

**Why these are needed:**
1. `https://auth.expo.io/@memoro/memoro` - For mobile app Google Sign-In (Expo)
2. `https://smenuelzskphnphaaetp.supabase.co/auth/v1/callback` - For Supabase OAuth integration
3. `https://app.memoro.ai/auth/apple-callback` - Shared OAuth configuration (multi-provider support)
4. `https://app.memoro.ai/auth/apple-callback-handler` - Shared OAuth configuration (multi-provider support)

**Note:** While popup flow doesn't use these URIs directly, Google requires them for:
- Cross-platform authentication (web + mobile)
- OAuth consent screen domains
- Supabase integration
- Multi-provider OAuth support

### Step 3: Get Client ID

After creating the OAuth client, copy the **Client ID**:
- Format: `xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- This is your `PUBLIC_GOOGLE_CLIENT_ID`

### Step 4: Enable Required APIs

Make sure these APIs are enabled in your project:
- **Google+ API** (for user profile data)
- **Google Identity Toolkit API** (for authentication)

---

## Code Implementation

### 1. Google SDK Loading (`src/app.html`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Google Identity Services -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

### 2. Google Auth Utilities (`src/lib/utils/googleAuth.ts`)

```typescript
/**
 * Google Identity Services integration
 * Provides helper functions for Google Sign-In on web
 */

import { env } from '$lib/config/env';

// TypeScript definitions for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
          // ... other methods
        };
      };
    };
  }
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: 'popup' | 'redirect';
}

interface CredentialResponse {
  credential: string; // JWT ID token
  select_by: string;
  clientId?: string;
}

/**
 * Initialize Google Identity Services
 * @param callback Function to call when user signs in with Google
 */
export function initializeGoogleAuth(callback: (idToken: string) => void) {
  if (typeof window === 'undefined') {
    console.warn('Google Auth: Cannot initialize on server-side');
    return;
  }

  if (!window.google) {
    console.warn('Google Identity Services not loaded yet');
    return;
  }

  const clientId = env.oauth.googleClientId;
  if (!clientId) {
    console.error('Google Client ID not configured');
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => {
        // response.credential is the JWT ID token
        callback(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup'
    });
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
  }
}

/**
 * Render Google Sign-In button
 * @param element HTML element to render button into
 * @param options Button configuration options
 */
export function renderGoogleButton(
  element: HTMLElement,
  options?: Partial<GsiButtonConfiguration>
) {
  if (typeof window === 'undefined' || !window.google) {
    console.warn('Google Identity Services not available');
    return;
  }

  const defaultOptions: GsiButtonConfiguration = {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left'
  };

  try {
    window.google.accounts.id.renderButton(element, {
      ...defaultOptions,
      ...options
    });
  } catch (error) {
    console.error('Error rendering Google button:', error);
  }
}

/**
 * Wait for Google Identity Services to load
 * @param timeout Maximum time to wait in milliseconds (default: 10000ms)
 */
export function waitForGoogleAuth(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleAuthLoaded()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isGoogleAuthLoaded()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Google Identity Services failed to load'));
      }
    }, 100);
  });
}

export function isGoogleAuthLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.id;
}
```

### 3. Google Sign-In Button Component (`src/lib/components/GoogleSignInButton.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { initializeGoogleAuth, renderGoogleButton, waitForGoogleAuth } from '$lib/utils/googleAuth';

  // Props
  interface Props {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }

  let { onSuccess, onError }: Props = $props();

  // State
  let buttonContainer: HTMLDivElement;
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Handle Google Sign-In callback
  async function handleGoogleSignIn(idToken: string) {
    isLoading = true;
    error = null;

    try {
      console.log('Google Sign-In successful, received ID token');

      // Call auth store's signInWithGoogle method
      const result = await auth.signInWithGoogle(idToken);

      if (!result.success) {
        throw new Error(result.error || 'Failed to authenticate with Google');
      }

      console.log('Successfully authenticated with middleware');

      // Navigate to dashboard
      goto('/dashboard');

      onSuccess?.();
    } catch (err) {
      console.error('Error during Google Sign-In:', err);
      error = err instanceof Error ? err.message : 'Google Sign-In failed';
      onError?.(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      isLoading = false;
    }
  }

  // Initialize Google Sign-In on mount
  onMount(async () => {
    try {
      // Wait for Google Identity Services to load
      await waitForGoogleAuth();

      // Initialize with callback
      initializeGoogleAuth(handleGoogleSignIn);

      // Render the button
      if (buttonContainer) {
        renderGoogleButton(buttonContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular'
        });
      }
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
      error = 'Failed to load Google Sign-In';
    }
  });
</script>

<div class="space-y-3">
  {#if error}
    <div class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
      {error}
    </div>
  {/if}

  <!-- Google button container -->
  <div bind:this={buttonContainer} class="relative w-full">
    {#if isLoading}
      <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-800/80">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    {/if}
  </div>

  <!-- Fallback message if Google SDK doesn't load -->
  <noscript>
    <div class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
      Please enable JavaScript to use Google Sign-In
    </div>
  </noscript>
</div>
```

### 4. Login Page Integration (`src/routes/(public)/login/+page.svelte`)

```svelte
<script lang="ts">
  import GoogleSignInButton from '$lib/components/GoogleSignInButton.svelte';
  import AppleSignInButton from '$lib/components/AppleSignInButton.svelte';
  // ... other imports
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="card w-full max-w-md">
    <h1 class="mb-6 text-center text-3xl font-bold">Welcome to Memoro</h1>

    <!-- Email/Password Form -->
    <form onsubmit={handleSubmit}>
      <!-- ... form fields ... -->
      <button type="submit" class="btn-primary w-full">Sign In</button>
    </form>

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Or continue with
        </span>
      </div>
    </div>

    <!-- Social Sign-In Buttons -->
    <GoogleSignInButton />
    <AppleSignInButton />
  </div>
</div>
```

---

## Environment Configuration

### Local Development (`.env`)

```bash
# Google OAuth (Web Client ID from Google Cloud Console)
PUBLIC_GOOGLE_CLIENT_ID=624477741877-67or55qpi440mlg1t46e178ta2gmcll9.apps.googleusercontent.com
```

### Production (Netlify Environment Variables)

Add to Netlify Dashboard > Site settings > Environment variables:

```
PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
```

### Environment Configuration File (`src/lib/config/env.ts`)

```typescript
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

export const env = {
  oauth: {
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    // ... other OAuth configs
  },
  // ... other env configs
};

// Startup logging (client-side only)
if (typeof window !== 'undefined') {
  console.log('🔧 Memoro Environment Configuration:', {
    googleOAuth: !!env.oauth.googleClientId ? '✅ Configured' : '❌ Missing',
    // ... other checks
  });

  if (!env.oauth.googleClientId) {
    console.warn('⚠️  Google Sign-In not configured. Set PUBLIC_GOOGLE_CLIENT_ID');
  }
}
```

---

## How It Works

### Step-by-Step Flow

1. **Page Load**
   - Google Identity Services SDK loads asynchronously from CDN
   - `GoogleSignInButton` component mounts and waits for SDK

2. **SDK Initialization**
   - `waitForGoogleAuth()` polls until `window.google` is available
   - `initializeGoogleAuth()` configures SDK with Client ID and callback
   - `renderGoogleButton()` renders Google's official branded button

3. **User Clicks Button**
   - Google opens popup window for authentication
   - User selects account and grants permissions
   - Popup closes automatically on success

4. **Google Returns ID Token**
   - Callback receives `CredentialResponse` with JWT ID token
   - Token contains user's email, name, profile picture, etc.
   - `handleGoogleSignIn(idToken)` is called

5. **Token Exchange with Middleware**
   - Component calls `auth.signInWithGoogle(idToken)`
   - Auth store sends POST to middleware: `/auth/google-signin?appId=APP_ID`
   - Middleware validates Google token and creates session

6. **Middleware Response**
   - Returns three tokens:
     - `manaToken`: Mana middleware authentication token
     - `appToken`: Supabase-compatible JWT for RLS
     - `refreshToken`: For token refresh flow

7. **Token Storage & Navigation**
   - Tokens stored in localStorage (web) or secure storage (mobile)
   - Auth state updated with user info
   - Redirect to `/dashboard`

### Middleware Integration

The Google Sign-In flow integrates with Mana Middleware:

```typescript
// Auth store signInWithGoogle method
async function signInWithGoogle(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${PUBLIC_MANA_MIDDLEWARE_URL}/auth/google-signin?appId=${PUBLIC_MIDDLEWARE_APP_ID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to authenticate with middleware');
    }

    const { manaToken, appToken, refreshToken } = await response.json();

    // Store tokens
    localStorage.setItem('manaToken', manaToken);
    localStorage.setItem('appToken', appToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update auth state
    await loadUserFromToken();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Comparison with Apple Sign-In

| Feature | Google Sign-In | Apple Sign-In |
|---------|---------------|---------------|
| **Flow Type** | Popup | Redirect (form_post) |
| **Token Type** | ID Token (JWT) | Authorization Code + ID Token |
| **SDK Loading** | Async script in `app.html` | Async script in `app.html` |
| **Callback Routes** | ❌ None needed | ✅ Required (`/auth/apple-callback`, `/auth/apple-callback-handler`) |
| **Server Handler** | ❌ Not needed | ✅ Required (`+server.ts` for POST) |
| **CSRF Protection** | ❌ Not needed (popup) | ✅ Required (state parameter) |
| **Configuration Complexity** | ⭐ Simple (Client ID only) | ⭐⭐⭐ Complex (3 return URLs) |
| **Google Cloud Console** | OAuth 2.0 Client ID | N/A |
| **Apple Developer Portal** | N/A | Service ID + Return URLs |
| **Supabase Callback** | ❌ Not needed | ✅ Required in Apple portal |
| **Custom CSRF Middleware** | ❌ Not needed | ✅ Required (`hooks.server.ts`) |
| **Response Mode** | Popup callback | Form POST |
| **State Management** | Direct callback | URL params + sessionStorage |
| **Email Privacy** | Standard email | Hide My Email option |
| **Implementation Files** | 2 files | 5+ files |

### Why Google is Simpler

1. **Popup Flow** - No redirect, no callback URLs needed
2. **Direct Token** - ID token returned immediately to JavaScript
3. **Same Origin** - Popup stays on your domain, no CSRF issues
4. **Single Configuration** - Just Client ID, no redirect URIs

### Why Apple is More Complex

1. **Redirect Flow** - Requires server-side POST callback
2. **Form POST** - Apple posts to your server, needs handler endpoint
3. **CSRF Protection** - Cross-origin POST requires custom middleware
4. **Multiple URLs** - Handler, page, AND Supabase callback all required
5. **SvelteKit Routing** - Can't have +page.svelte and +server.ts together (405 error)

---

## Testing Checklist

### Local Development

- [ ] Google SDK loads in browser console (check for `window.google`)
- [ ] Google button renders on login page
- [ ] Click button opens Google account picker popup
- [ ] Select account and grant permissions
- [ ] Popup closes automatically
- [ ] Browser console shows: "Google Sign-In successful, received ID token"
- [ ] Browser console shows: "Successfully authenticated with middleware"
- [ ] Redirects to `/dashboard`
- [ ] User info displays correctly
- [ ] Tokens stored in localStorage: `manaToken`, `appToken`, `refreshToken`
- [ ] Page refresh maintains auth state (tokens valid)

### Production (app.memoro.ai)

- [ ] Environment variable `PUBLIC_GOOGLE_CLIENT_ID` set in Netlify
- [ ] Google button visible on login page
- [ ] Click button opens Google popup (not blocked by browser)
- [ ] OAuth flow completes successfully
- [ ] Production middleware URL responds correctly
- [ ] User redirected to dashboard after sign-in
- [ ] Check browser console for any errors
- [ ] Verify tokens are stored correctly
- [ ] Test logout and re-login flow

### Cross-Browser Testing

- [ ] Chrome/Chromium
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Edge Cases

- [ ] User cancels Google popup
- [ ] User denies permissions
- [ ] Network error during token exchange
- [ ] Middleware returns error
- [ ] Invalid Client ID (check error message)
- [ ] Google SDK fails to load (check fallback message)
- [ ] Third-party cookies blocked
- [ ] Ad blocker interfering with Google SDK

---

## Troubleshooting

### Issue: Google Button Doesn't Render

**Symptoms:** Empty space where button should be

**Possible Causes:**
1. Google SDK not loaded yet
2. Invalid Client ID
3. Client ID not set in environment

**Solution:**
```typescript
// Check browser console for errors
console.log('Google loaded?', !!window.google);
console.log('Client ID:', env.oauth.googleClientId);

// Verify SDK loaded
if (!window.google) {
  console.error('Google Identity Services SDK not loaded');
}
```

### Issue: "Google Identity Services not configured"

**Symptoms:** Error in console on page load

**Solution:**
1. Check `.env` file has `PUBLIC_GOOGLE_CLIENT_ID`
2. Restart dev server after adding env variable
3. Verify Client ID format: `xxx.apps.googleusercontent.com`

### Issue: Popup Opens but Immediately Closes

**Possible Causes:**
1. Invalid Client ID
2. JavaScript origin not authorized
3. **Missing redirect URIs** (most common!)
4. Third-party cookies blocked

**Solution:**
1. ⚠️ **CRITICAL:** Add redirect URIs to OAuth client (see Step 2 in Google Cloud Console Setup)
   - Even though popup flow doesn't use redirects, Google requires them
   - Add ALL redirect URIs from the setup section:
     - `https://auth.expo.io/@memoro/memoro`
     - `https://smenuelzskphnphaaetp.supabase.co/auth/v1/callback`
     - `https://app.memoro.ai/auth/apple-callback`
     - `https://app.memoro.ai/auth/apple-callback-handler`
2. Verify Client ID in Google Cloud Console
3. Add `http://localhost:5173` to Authorized JavaScript origins
4. Enable third-party cookies in browser settings
5. Check browser console for detailed error

**Common Error Messages:**
- "Popup closed" - Missing redirect URIs
- "Invalid domain" - JavaScript origin not authorized
- "Invalid client" - Wrong Client ID

### Issue: "redirect_uri_mismatch" Error

**Note:** This error should NOT occur with popup flow

**If you see this:**
- You may have accidentally configured `redirect_uri` in `initializeGoogleAuth`
- Remove any `login_uri` or `redirect_uri` parameters
- Ensure `ux_mode: 'popup'` is set

### Issue: Popup Blocked by Browser

**Symptoms:** Popup doesn't open when clicking button

**Solution:**
1. Check browser popup blocker settings
2. Whitelist your domain
3. User must click button directly (no programmatic trigger)

### Issue: Token Exchange Fails

**Symptoms:** "Failed to authenticate with middleware" error

**Check:**
1. Middleware URL correct in environment
2. Middleware `/auth/google-signin` endpoint exists
3. App ID correct
4. Network tab shows 200 response from middleware
5. Response contains `manaToken`, `appToken`, `refreshToken`

**Debug:**
```typescript
// Log middleware response
const response = await fetch(middlewareUrl, { ... });
console.log('Middleware response status:', response.status);
const data = await response.json();
console.log('Middleware response data:', data);
```

### Issue: Authentication Works But Supabase Queries Fail

**Check:**
1. `appToken` is being used with Supabase client
2. Token is valid JWT (decode at jwt.io)
3. Token has correct `sub` (user ID) and `role` claims
4. RLS policies allow user's role

### Issue: Google SDK Fails to Load

**Symptoms:** "Failed to load Google Identity Services" error after 10s

**Possible Causes:**
1. Network connectivity issue
2. Content Security Policy (CSP) blocking script
3. Ad blocker blocking Google domain

**Solution:**
1. Check network tab for failed requests
2. Verify CSP allows `https://accounts.google.com`
3. Temporarily disable ad blocker for testing
4. Check browser console for CSP errors

---

## Security Considerations

### 1. Client ID is Public

✅ **Safe to expose** - Google Client ID is public and meant to be in client-side code

### 2. ID Token Validation

✅ **Handled by middleware** - Middleware validates:
- Token signature (from Google)
- Token expiration
- Audience matches Client ID
- Issuer is Google

Never trust token on client side - always validate server-side.

### 3. Token Storage

Web uses `localStorage`:
```typescript
localStorage.setItem('appToken', appToken);
localStorage.setItem('refreshToken', refreshToken);
```

**Limitations:**
- Accessible to JavaScript (XSS vulnerability)
- Not secure like mobile secure storage

**Mitigations:**
- Short token expiration (middleware-configured)
- Refresh token rotation
- HttpOnly cookies would be more secure (future enhancement)

### 4. CSRF Not Needed

Google popup flow stays on same origin, so CSRF protection not required (unlike Apple Sign-In).

### 5. Third-Party Cookies

Google Sign-In requires third-party cookies enabled. Users with strict privacy settings may have issues.

### 6. Content Security Policy (CSP)

If you add CSP headers, allow:
```
script-src https://accounts.google.com;
connect-src https://accounts.google.com;
```

### 7. Token Refresh Flow

When `appToken` expires:
1. Use `refreshToken` to get new tokens from middleware
2. Update stored tokens
3. Retry failed request

(Implementation in auth store)

---

## Additional Resources

### Official Documentation
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)
- [Google Cloud Console](https://console.cloud.google.com)

### Related Files
- `src/lib/utils/googleAuth.ts` - Google SDK utilities
- `src/lib/components/GoogleSignInButton.svelte` - Button component
- `src/lib/stores/auth.ts` - Auth state management
- `src/lib/services/authService.ts` - Auth API calls
- `src/app.html` - SDK loading

### Related Documentation
- `APPLE_SIGNIN_COMPLETE_GUIDE.md` - Apple Sign-In implementation
- `README.md` - General web app documentation

---

## Summary

Google Sign-In is **fully implemented and production-ready** on the Memoro web app. The implementation:

✅ Uses official Google Identity Services SDK
✅ Follows Google's recommended popup flow
✅ Integrates with Mana Middleware for token exchange
✅ Handles errors gracefully with user feedback
✅ Works on all modern browsers
✅ Supports dark mode and responsive design
✅ Includes comprehensive TypeScript types
✅ Provides detailed logging for debugging

**Key Advantages Over Apple Sign-In:**
- No callback routes needed
- No server-side POST handler
- No CSRF protection required
- Simpler configuration (just Client ID)
- Faster implementation time

**The only requirement:** Set `PUBLIC_GOOGLE_CLIENT_ID` in environment variables.

---

**Last Updated:** 2025-11-17
**Status:** ✅ Production Ready
