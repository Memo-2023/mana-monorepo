import { tokenManager, TokenState } from '../services/tokenManager';
import { updateSupabaseAuth } from '../lib/supabaseClient';
import { authService } from '../services/authService';

/**
 * Set up a global fetch interceptor to handle token refresh for all API calls
 * Uses the enhanced TokenManager for race condition-free token management
 */
export const setupGlobalFetchInterceptor = (): void => {
  if (typeof globalThis !== 'undefined' && globalThis.fetch) {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input, init) => {
      const url = extractUrl(input);

      // Skip intercepting for non-API calls or calls that don't need auth
      if (shouldSkipInterception(url)) {
        return originalFetch(input, init);
      }

      try {
        // First, try the request with current token
        const response = await makeRequestWithToken(originalFetch, input, init);
        
        // If we get a 401, let TokenManager handle it
        if (response.status === 401) {
          const responseData = await response.clone().json().catch(() => ({}));
          console.debug('Received 401 response:', responseData);

          const isTokenExpired = isTokenExpiredResponse(responseData);
          
          if (isTokenExpired) {
            console.debug('Token expired, delegating to TokenManager');
            // Use TokenManager to handle the 401 and retry
            return await tokenManager.handle401Response(input, init);
          }
        }

        return response;
      } catch (error) {
        console.debug('Error in global fetch interceptor:', error);
        return originalFetch(input, init);
      }
    }) as typeof fetch;
  }
};

/**
 * Make a request with the current token
 */
async function makeRequestWithToken(
  originalFetch: typeof fetch,
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<Response> {
  // Get current token (don't force refresh here)
  const token = await authService.getAppToken();
  
  if (token) {
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    init = { ...init, headers };
  }

  return originalFetch(input, init);
}

/**
 * Reset the refresh attempts counter (call this after successful operations)
 */
export const resetRefreshAttempts = (): void => {
  // TokenManager handles this internally, but we can provide a way to reset state
  tokenManager.reset();
};

/**
 * Handle authentication failure by clearing storage and redirecting to login
 */
async function handleAuthFailure(): Promise<void> {
  try {
    await authService.clearAuthStorage();

    // Use setTimeout to avoid React state updates during render
    setTimeout(() => {
      try {
        const { router } = require('expo-router');
        router.replace('/(public)/login');
      } catch (routerError) {
        console.debug('Error redirecting to login:', routerError);
      }
    }, 100);
  } catch (error) {
    console.debug('Error handling auth failure:', error);
  }
}

/**
 * Extract URL from various input types
 */
function extractUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  } else if (input instanceof URL) {
    return input.toString();
  } else if (input instanceof Request) {
    return input.url;
  }
  return '';
}

/**
 * Check if request should skip interception
 */
function shouldSkipInterception(url: string): boolean {
  return !url ||
         url.includes('auth/signin') ||
         url.includes('auth/signup') ||
         url.includes('auth/refresh') ||
         url.includes('auth/forgot-password') ||
         // Skip Supabase storage operations to avoid ES256 JWT issues
         url.includes('.supabase.co/storage/') ||
         url.includes('/storage/v1/');
}

/**
 * Check if response indicates token expiration
 */
function isTokenExpiredResponse(responseData: any): boolean {
  return responseData.error?.message === 'JWT expired' ||
         responseData.message === 'JWT expired' ||
         responseData.error === 'JWT expired' ||
         responseData.code === 'PGRST301' ||
         responseData.error?.code === 'PGRST301' ||
         responseData.message === 'Unauthorized' ||
         responseData.error === 'Unauthorized';
}

/**
 * Setup token manager observers for Supabase integration
 */
export const setupTokenObservers = (): void => {
  // Subscribe to token state changes to update Supabase
  tokenManager.subscribe(async (state: TokenState, token?: string) => {
    try {
      if (state === TokenState.VALID && token) {
        console.debug('TokenManager: Token valid, updating Supabase auth');
        await updateSupabaseAuth();
      } else if (state === TokenState.EXPIRED) {
        console.debug('TokenManager: Token expired, clearing Supabase auth');
        // Supabase will handle the expired token automatically
      }
    } catch (error) {
      console.debug('Error updating Supabase auth from token observer:', error);
    }
  });
};