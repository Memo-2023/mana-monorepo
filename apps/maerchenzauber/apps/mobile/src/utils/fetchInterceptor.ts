import { tokenManager, TokenState } from '../services/tokenManager';
import { updateSupabaseAuth } from './supabaseClient';
import { authService } from '../services/authService';
import { Platform } from 'react-native';
import { debug, info, warn, error } from './logger';

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
        debug('Fetch interceptor: Skipping URL:', url);
        return originalFetch(input, init);
      }

      debug('Fetch interceptor: Intercepting URL:', url);

      try {
        // First, try the request with current token
        const response = await makeRequestWithToken(originalFetch, input, init);
        
        // If we get a 401, let TokenManager handle it
        if (response.status === 401) {
          const responseData = await response.clone().json().catch(() => ({}));
          debug('Fetch interceptor: Received 401 response:', responseData);

          const isTokenExpired = isTokenExpiredResponse(responseData);
          
          if (isTokenExpired) {
            debug('Fetch interceptor: Token expired, delegating to TokenManager');
            // Use TokenManager to handle the 401 and retry
            return await tokenManager.handle401Response(input, init);
          } else {
            debug('Fetch interceptor: 401 not due to token expiration, passing through');
          }
        }

        return response;
      } catch (error) {
        debug('Error in global fetch interceptor:', error);
        // Fall back to original fetch to prevent app breakage
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
  
  const requestInit: RequestInit = {
    method: init?.method || 'GET', // Ensure method is always defined
    ...init
  };
  
  if (token) {
    const headers = new Headers(requestInit.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    requestInit.headers = headers;
  }

  return originalFetch(input, requestInit);
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
        debug('Error redirecting to login:', routerError);
      }
    }, 100);
  } catch (error) {
    debug('Error handling auth failure:', error);
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
  if (!url) return true;
  
  const lowerUrl = url.toLowerCase();
  
  // Skip all auth-related endpoints
  const authEndpoints = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify',
    '/auth/logout'
  ];
  
  // Skip health and public endpoints
  const publicEndpoints = [
    '/health',
    '/ping',
    '/status',
    '/version',
    '/public/'
  ];
  
  // Skip Supabase storage operations (JWT compatibility issues)
  const storageEndpoints = [
    '.supabase.co/storage/',
    '/storage/v1/',
    'supabase.co/storage'
  ];
  
  // Skip external APIs that don't use our auth
  const externalApis = [
    'googleapis.com',
    'firebase.com',
    'firebaseapp.com',
    'replicate.com',
    'openai.com',
    'anthropic.com'
  ];
  
  // Check all skip conditions
  const shouldSkip = [
    ...authEndpoints,
    ...publicEndpoints, 
    ...storageEndpoints,
    ...externalApis
  ].some(pattern => lowerUrl.includes(pattern));
  
  // Also skip if URL doesn't contain the backend URL
  const baseBackendUrl = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002';
  
  // Handle Android localhost transformation
  let backendUrl = baseBackendUrl;
  if (
    Platform.OS === 'android' &&
    (baseBackendUrl.includes('localhost') || baseBackendUrl.includes('127.0.0.1'))
  ) {
    backendUrl = baseBackendUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  
  // Remove protocol and port for more flexible matching
  const backendDomain = backendUrl.replace(/https?:\/\//, '').replace(/:\d+$/, '');
  
  if (!lowerUrl.includes(backendDomain.toLowerCase())) {
    return true;
  }
  
  return shouldSkip;
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
  debug('Setting up token observers for Supabase integration');
  
  // Subscribe to token state changes to update Supabase
  tokenManager.subscribe(async (state: TokenState, token?: string) => {
    try {
      if (state === TokenState.VALID && token) {
        debug('TokenManager: Token valid, updating Supabase auth');
        await updateSupabaseAuth();
      } else if (state === TokenState.EXPIRED) {
        debug('TokenManager: Token expired, clearing Supabase auth');
        // Supabase will handle the expired token automatically
      }
    } catch (error) {
      debug('Error updating Supabase auth from token observer:', error);
    }
  });
};

/**
 * Get interceptor status for debugging
 */
export const getInterceptorStatus = () => {
  const backendUrl = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002';
  const tokenManagerStatus = tokenManager.getQueueStatus();
  
  return {
    isSetup: typeof globalThis !== 'undefined' && globalThis.fetch !== undefined,
    backendUrl,
    tokenManager: tokenManagerStatus,
    platform: Platform.OS
  };
};

/**
 * Test the fetch interceptor with various URLs to verify skip patterns
 */
export const testInterceptorSkipPatterns = () => {
  const testUrls = [
    // Should be skipped
    'https://example.com/auth/signin',
    'https://example.com/auth/refresh',
    'https://smenuelzskphnphaaetp.supabase.co/storage/v1/object/test',
    'https://example.com/health',
    'https://googleapis.com/api/test',
    
    // Should NOT be skipped (if backend URL is localhost:3002)
    'http://localhost:3002/api/stories',
    'http://10.0.2.2:3002/api/characters',
  ];
  
  const results = testUrls.map(url => ({
    url,
    shouldSkip: shouldSkipInterception(url),
    reason: getSkipReason(url)
  }));
  
  debug('Interceptor skip pattern test results:', results);
  return results;
};

/**
 * Get the reason why a URL is being skipped (for debugging)
 */
function getSkipReason(url: string): string {
  if (!url) return 'Empty URL';
  
  const lowerUrl = url.toLowerCase();
  
  // Check auth endpoints
  const authEndpoints = ['/auth/signin', '/auth/signup', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/verify', '/auth/logout'];
  if (authEndpoints.some(pattern => lowerUrl.includes(pattern))) {
    return 'Auth endpoint';
  }
  
  // Check public endpoints
  const publicEndpoints = ['/health', '/ping', '/status', '/version', '/public/'];
  if (publicEndpoints.some(pattern => lowerUrl.includes(pattern))) {
    return 'Public endpoint';
  }
  
  // Check storage endpoints
  const storageEndpoints = ['.supabase.co/storage/', '/storage/v1/', 'supabase.co/storage'];
  if (storageEndpoints.some(pattern => lowerUrl.includes(pattern))) {
    return 'Storage endpoint';
  }
  
  // Check external APIs
  const externalApis = ['googleapis.com', 'firebase.com', 'firebaseapp.com', 'replicate.com', 'openai.com', 'anthropic.com'];
  if (externalApis.some(pattern => lowerUrl.includes(pattern))) {
    return 'External API';
  }
  
  // Check backend URL
  const baseBackendUrl = process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002';
  let backendUrl = baseBackendUrl;
  if (Platform.OS === 'android' && (baseBackendUrl.includes('localhost') || baseBackendUrl.includes('127.0.0.1'))) {
    backendUrl = baseBackendUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  
  const backendDomain = backendUrl.replace(/https?:\/\//, '').replace(/:\d+$/, '');
  if (!lowerUrl.includes(backendDomain.toLowerCase())) {
    return `Not backend URL (expected: ${backendDomain})`;
  }
  
  return 'Should not skip';
}