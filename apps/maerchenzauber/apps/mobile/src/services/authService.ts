import { safeStorage } from '../utils/safeStorage';
import { Platform } from 'react-native';
import { DecodedToken } from '../types/auth.types';
import { DeviceManager } from '../utils/deviceManager';
import { debug, info, warn, error as logError } from '../utils/logger';
import { analytics } from './analytics';

// Constants
// Use storyteller backend for all auth endpoints
const BASE_BACKEND_URL =
  process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL ||
  'http://localhost:3002';

// Handle localhost for Android emulator
const getBackendUrl = () => {
  // On Android, localhost and 127.0.0.1 refer to the emulator itself, not the host machine
  // 10.0.2.2 is a special IP in the Android emulator that connects to the host machine's localhost
  if (
    Platform.OS === 'android' &&
    (BASE_BACKEND_URL.includes('localhost') || BASE_BACKEND_URL.includes('127.0.0.1'))
  ) {
    return BASE_BACKEND_URL.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return BASE_BACKEND_URL;
};

// Get the appropriate backend URL based on platform
let BACKEND_URL = getBackendUrl();

// Remove trailing slash if present to avoid double slashes in URL paths
if (BACKEND_URL.endsWith('/')) {
  BACKEND_URL = BACKEND_URL.slice(0, -1);
}

info(`Using backend URL (${Platform.OS}):`, BACKEND_URL);

// Token storage keys
const STORAGE_KEYS = {
  APP_TOKEN: '@auth/appToken',
  REFRESH_TOKEN: '@auth/refreshToken',
  USER_EMAIL: '@auth/userEmail',
  APP_SUPABASE_TOKEN: '@auth/appSupabaseToken',
};

/**
 * Authentication service for handling JWT tokens and authentication flow
 */
export const authService = {
  /**
   * Sign in with email and password
   * @param email User email
   * @param password User password
   * @returns Authentication result
   */
  signIn: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Track sign in started
    analytics.track('auth_signin_started', { method: 'email' });

    try {
      // Get device info for multi-device support
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${BACKEND_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Debug logging to see actual error structure
        debug('Auth error response:', { status: response.status, errorData });

        // Handle specific error cases - check multiple possible response structures
        if (response.status === 401) {
          // Check for Firebase user who needs password reset (comes after wrong password)
          const isFirebaseUserNeedsReset =
            errorData.message?.includes('Firebase user detected') ||
            errorData.message?.includes('password reset required') ||
            errorData.code === 'FIREBASE_USER_PASSWORD_RESET_REQUIRED';

          if (isFirebaseUserNeedsReset) {
            throw new Error('FIREBASE_USER_PASSWORD_RESET_REQUIRED');
          }

          // Check for email verification error
          const isEmailNotConfirmed =
            errorData.message?.includes('Email not confirmed') ||
            errorData.message?.includes('Email not verified') ||
            errorData.message?.includes('email') ||
            errorData.code === 'EMAIL_NOT_VERIFIED';

          if (isEmailNotConfirmed) {
            throw new Error('EMAIL_NOT_VERIFIED');
          } else {
            // Regular wrong credentials
            throw new Error('INVALID_CREDENTIALS');
          }
        } else if (response.status === 403) {
          // Handle any 403 email verification errors as backup
          throw new Error('EMAIL_NOT_VERIFIED');
        } else if (response.status === 400) {
          // Check for Firebase migration required error (legacy handling)
          const isFirebaseMigrationRequired =
            errorData.message?.includes('requires migration from the old system') ||
            errorData.message?.includes('Firebase') ||
            errorData.code === 'FIREBASE_USER_MIGRATION_REQUIRED';

          if (isFirebaseMigrationRequired) {
            throw new Error('FIREBASE_USER_PASSWORD_RESET_REQUIRED');
          }
        }

        throw new Error(errorData.message || 'Anmeldung fehlgeschlagen');
      }

      // Get tokens from middleware
      const { appToken, refreshToken, appSupabaseToken } = await response.json();

      // Store tokens and email
      const storagePromises = [
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email),
      ];

      // Store app Supabase token if provided
      if (appSupabaseToken) {
        storagePromises.push(safeStorage.setItem(STORAGE_KEYS.APP_SUPABASE_TOKEN, appSupabaseToken));
      }

      await Promise.all(storagePromises);

      // Trigger token manager to update state and notify observers
      const { tokenManager } = require('./tokenManager');
      await tokenManager.getValidToken();

      // Get user ID from token for analytics
      const decoded = authService.decodeToken(appToken);
      const userId = decoded?.sub || 'unknown';

      // Track successful sign in
      analytics.track('auth_signin_completed', { method: 'email', userId });

      return { success: true };
    } catch (error) {
      logError('Error signing in:', error);

      // Track failed sign in
      analytics.track('auth_signin_failed', {
        method: 'email',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Anmeldung',
      };
    }
  },

  /**
   * Sign up with email and password
   * @param email User email
   * @param password User password
   * @returns Authentication result
   */
  signUp: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    // Track sign up started
    analytics.track('auth_signup_started', { method: 'email' });

    try {
      // Get device info for multi-device support
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('Diese E-Mail wird bereits verwendet');
        } else if (response.status === 400) {
          throw new Error(
            errorData.message || 'Bitte gib eine gültige E-Mail und ein sicheres Passwort an'
          );
        }

        throw new Error(errorData.message || 'Registrierung fehlgeschlagen');
      }

      const responseData = await response.json();

      // Debug logging to see actual signup response structure
      console.log('Signup success response:', responseData);

      // Check if email verification is required (backend returns confirmationRequired)
      if (responseData.confirmationRequired) {
        // Do not save any tokens/keys when email verification is required
        return {
          success: true,
          needsVerification: true,
        };
      }

      // Only store tokens if no verification is needed
      const { appToken, refreshToken } = responseData;

      if (appToken && refreshToken) {
        // Store tokens and email
        await Promise.all([
          safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
          safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
          safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email),
        ]);

        // Trigger token manager to update state and notify observers
        const { tokenManager } = require('./tokenManager');
        await tokenManager.getValidToken();

        // Get user ID from token for analytics
        const decoded = authService.decodeToken(appToken);
        const userId = decoded?.sub || 'unknown';

        // Track successful sign up
        analytics.track('auth_signup_completed', { method: 'email', userId });
      } else {
        // Track successful sign up but needs verification
        analytics.track('auth_signup_completed', { method: 'email', userId: 'pending_verification' });
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing up:', error);

      // Track failed sign up
      analytics.track('auth_signup_failed', {
        method: 'email',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Registrierung',
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    try {
      // Get user ID before clearing storage
      const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);
      let userId = 'unknown';
      if (appToken) {
        const decoded = authService.decodeToken(appToken);
        userId = decoded?.sub || 'unknown';
      }

      const refreshToken = await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        // Revoke refresh token on server
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch((err) => console.error('Error logging out on server:', err));
      }

      // Track sign out
      analytics.track('auth_signout', { userId });

      // Reset analytics identity
      await analytics.reset();

      // Clear all auth data from storage
      await authService.clearAuthStorage();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  /**
   * Send password reset email
   * @param email User email
   * @returns Reset result
   */
  forgotPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limit specifically
        if (errorData.message?.includes('rate limit')) {
          throw new Error(
            'Too many password reset attempts. Please wait a few minutes before trying again.'
          );
        }

        throw new Error(errorData.message || 'Password reset failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during password reset',
      };
    }
  },

  /**
   * Refresh the authentication tokens
   * @param currentRefreshToken The current refresh token
   * @param appId The application ID (defaults to APP_ID if not provided)
   * @returns New app token and refresh token along with user data
   */
  refreshTokens: async (
    currentRefreshToken: string
  ): Promise<{
    appToken: string;
    refreshToken: string;
    userData?: { id: string; email: string; role: string } | null;
  }> => {
    try {
      // Check if device ID has changed (which would invalidate the refresh token)
      const storedDeviceId = await DeviceManager.getStoredDeviceId();
      const deviceInfo = await DeviceManager.getDeviceInfo();
      
      if (storedDeviceId && deviceInfo.deviceId !== storedDeviceId) {
        console.error('Device ID mismatch detected during token refresh', {
          stored: storedDeviceId,
          current: deviceInfo.deviceId
        });
        
        // Quick and dirty alert for debugging
        if (typeof alert !== 'undefined') {
          alert(
            `⚠️ DEVICE ID MISMATCH DETECTED!\n\n` +
            `Stored ID:\n${storedDeviceId}\n\n` +
            `Current ID:\n${deviceInfo.deviceId}\n\n` +
            `This refresh token won't work with the new device ID.\n` +
            `You need to sign in again.`
          );
        }
        
        throw new Error('Device ID has changed. Please sign in again.');
      }

      // Debug log device info
      console.debug('Device info for token refresh:', deviceInfo);

      console.debug('Refreshing tokens');

      const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.debug('Token refresh failed with status:', response.status, errorData);

        // If refresh fails with 401, it might be due to old tokens without device info
        if (response.status === 401 && errorData.message === 'Invalid refresh token') {
          console.debug('Refresh token invalid - likely due to old token without device info');
          throw new Error('Session expired. Please sign in again.');
        }

        throw new Error(errorData.message || 'Failed to refresh tokens');
      }

      // Get new tokens from middleware
      const responseData = await response.json();
      console.debug('Token refresh response:', responseData);

      // Note: If grace period was used, backend returns the previously generated token
      // This is normal and expected - the frontend should always save whatever token is returned
      const { appToken, refreshToken, deviceId, grace_period_used, grace_expires_at } = responseData;
      
      // Log grace period usage if present
      if (grace_period_used) {
        console.debug('Token refresh used grace period - returning previously rotated token');
        console.debug('Grace period expires at:', grace_expires_at);
      } else if (grace_expires_at) {
        console.debug('Token refreshed with new grace period until:', grace_expires_at);
      }
      
      console.debug(
        'Extracted tokens - appToken:',
        !!appToken,
        'refreshToken:',
        !!refreshToken,
        'deviceId:',
        deviceId
      );

      // Validate that we received tokens
      if (!appToken || !refreshToken) {
        console.error('Missing tokens in refresh response:', {
          appToken: !!appToken,
          refreshToken: !!refreshToken,
        });
        throw new Error('Invalid response from token refresh - missing tokens');
      }

      console.debug('Tokens refreshed successfully');

      // Store new tokens in local storage
      await safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken);
      await safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      // Extract user data from the new token
      try {
        const base64Url = appToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Use platform-agnostic base64 decoding
        let payload;
        if (typeof window !== 'undefined' && window.atob) {
          // Web environment
          payload = JSON.parse(window.atob(base64));
        } else {
          // React Native environment
          const base64js = require('base64-js');
          const uint8Array = base64js.toByteArray(base64);
          const decoded = String.fromCharCode.apply(null, uint8Array);
          payload = JSON.parse(decoded);
        }

        // Get stored email if not in token
        const email =
          payload.email || (await safeStorage.getItem<string>(STORAGE_KEYS.USER_EMAIL)) || '';

        // Only proceed if we have an email
        if (email) {
          const userData = {
            id: payload.sub,
            email: email,
            role: payload.role,
          };

          return { appToken, refreshToken, userData };
        }
      } catch (decodeError) {
        console.debug('Error decoding token after refresh:', decodeError);
      }

      console.log('[authService.refreshTokens] Token refreshed and stored successfully');

      return { appToken, refreshToken };
    } catch (error) {
      console.debug('Error refreshing tokens:', error);
      throw error;
    }
  },

  /**
   * Sign in with Google ID token
   * @param idToken Google ID token
   * @returns Authentication result
   */
  /**
   * Sign in with Apple ID token
   * @param identityToken Apple identity token
   * @returns Authentication result
   */
  signInWithApple: async (identityToken: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get device info for multi-device support
      const deviceInfo = await DeviceManager.getDeviceInfo();

      info(
        'Sending Apple Sign-In request to:',
        `${BACKEND_URL}/auth/apple-signin`
      );
      const response = await fetch(`${BACKEND_URL}/auth/apple-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: identityToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Apple Sign-In failed');
      }

      // Get tokens from middleware
      const responseData = await response.json();
      const { appToken, refreshToken } = responseData;

      // Extract email from user info if available
      let email = responseData.email;

      // If email is not in the response, try to extract it from the JWT token
      if (!email && appToken) {
        try {
          // Decode JWT token
          const base64Url = appToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          // Use platform-agnostic base64 decoding
          let payload;
          if (typeof window !== 'undefined' && window.atob) {
            // Web environment
            payload = JSON.parse(window.atob(base64));
          } else {
            // React Native environment
            const base64js = require('base64-js');
            const uint8Array = base64js.toByteArray(base64);
            const decoded = String.fromCharCode.apply(null, uint8Array);
            payload = JSON.parse(decoded);
          }

          // Try to get email from token payload or user metadata
          email = payload.email || (payload.user_metadata && payload.user_metadata.email) || '';

          info('Extracted email from token:', email);
        } catch (e) {
          logError('Error extracting email from token:', e);
        }
      }

      // Store tokens and email (only if email exists)
      const storagePromises = [
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ];

      // Only store email if it exists
      if (email) {
        storagePromises.push(safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email));
      }

      await Promise.all(storagePromises);

      // Trigger token manager to update state and notify observers
      const { tokenManager } = require('./tokenManager');
      await tokenManager.getValidToken();

      return { success: true };
    } catch (error) {
      logError('Error signing in with Apple:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Apple Sign-In',
      };
    }
  },

  /**
   * Sign in with Google ID token
   * @param idToken Google ID token
   * @returns Authentication result
   */
  signInWithGoogle: async (idToken: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get device info for multi-device support
      const deviceInfo = await DeviceManager.getDeviceInfo();

      info(
        'Sending Google Sign-In request to:',
        `${BACKEND_URL}/auth/google-signin`
      );
      const response = await fetch(`${BACKEND_URL}/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google Anmeldung fehlgeschlagen');
      }

      // Get tokens from middleware
      const responseData = await response.json();
      const { appToken, refreshToken } = responseData;

      // Extract email from user info if available
      let email = responseData.email;

      // If email is not in the response, try to extract it from the JWT token
      if (!email && appToken) {
        try {
          // Decode JWT token
          const base64Url = appToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          // Use platform-agnostic base64 decoding
          let payload;
          if (typeof window !== 'undefined' && window.atob) {
            // Web environment
            payload = JSON.parse(window.atob(base64));
          } else {
            // React Native environment
            const base64js = require('base64-js');
            const uint8Array = base64js.toByteArray(base64);
            const decoded = String.fromCharCode.apply(null, uint8Array);
            payload = JSON.parse(decoded);
          }

          // Try to get email from token payload or user metadata
          email = payload.email || (payload.user_metadata && payload.user_metadata.email) || '';

          info('Extracted email from token:', email);
        } catch (e) {
          logError('Error extracting email from token:', e);
        }
      }

      // Store tokens and email (only if email exists)
      const storagePromises = [
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ];

      // Only store email if it exists
      if (email) {
        storagePromises.push(safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email));
      }

      await Promise.all(storagePromises);

      // Trigger token manager to update state and notify observers
      const { tokenManager } = require('./tokenManager');
      await tokenManager.getValidToken();

      return { success: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unbekannter Fehler bei der Google Anmeldung',
      };
    }
  },

  /**
   * Event callback for token refresh
   */
  onTokenRefresh: null as ((userData: { id: string; email: string; role: string }) => void) | null,

  /**
   * Check if the current token is valid
   * @returns True if token is valid
   */
  validateToken: async (): Promise<boolean> => {
    return authService.validateTokenWithRetry();
  },

  /**
   * Validate token with retry logic for network failures
   * @param retries Number of retry attempts
   * @returns True if token is valid
   */
  validateTokenWithRetry: async (retries: number = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await authService.validateTokenInternal();
        return result;
      } catch (error) {
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('Network') ||
            error.message.includes('network') ||
            error.message.includes('fetch') ||
            error.message.includes('connection') ||
            error.message.toLowerCase().includes('timeout'));

        // Check if it's an authentication error that shouldn't be retried
        const isAuthError =
          error instanceof Error &&
          (error.message.includes('401') ||
            error.message.includes('403') ||
            error.message.includes('Unauthorized') ||
            error.message.includes('Forbidden') ||
            error.message.includes('Invalid token'));

        // If this is the last attempt, an auth error, or not a network error, throw
        if (attempt === retries || isAuthError || !isNetworkError) {
          throw error;
        }

        // Wait with exponential backoff before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.debug(`Retrying token validation, attempt ${attempt + 2}/${retries + 1}`);
      }
    }
    return false;
  },

  /**
   * Internal token validation logic
   * @returns True if token is valid
   */
  validateTokenInternal: async (): Promise<boolean> => {
    try {
      const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);

      if (!appToken) {
        return false;
      }

      // Check token expiration
      const isTokenExpired = (token: string): boolean => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

          // Use platform-agnostic base64 decoding
          let payload;
          if (typeof window !== 'undefined' && window.atob) {
            // Web environment
            payload = JSON.parse(window.atob(base64));
          } else {
            // React Native environment - use base64-js library
            const base64js = require('base64-js');
            const uint8Array = base64js.toByteArray(base64);
            const decoded = String.fromCharCode.apply(null, uint8Array);
            payload = JSON.parse(decoded);
          }

          return Date.now() >= payload.exp * 1000;
        } catch (e) {
          return true;
        }
      };

      // If token is expired, try to refresh
      if (isTokenExpired(appToken)) {
        try {
          const refreshToken = await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            return false;
          }

          const result = await authService.refreshTokens(refreshToken);

          // If we have user data from the refreshed token and a callback is registered, notify about user data
          if (result.userData && authService.onTokenRefresh) {
            authService.onTokenRefresh(result.userData);
          }

          return true;
        } catch (error) {
          debug('Error during token refresh in validateTokenInternal:', error);

          // Only clear auth data for authentication errors (401, 403), not network/temporary errors
          const isNetworkError =
            error instanceof Error &&
            (error.message.includes('Network') ||
              error.message.includes('network') ||
              error.message.includes('fetch') ||
              error.message.includes('connection') ||
              error.message.toLowerCase().includes('timeout') ||
              error.message.includes('Failed to fetch') ||
              error.message.includes('NetworkError') ||
              error.name === 'NetworkError' ||
              error.name === 'TypeError');

          // Check if it's an authentication error (401/403) by examining the error
          const isAuthError =
            error instanceof Error &&
            (error.message.includes('401') ||
              error.message.includes('403') ||
              error.message.includes('Unauthorized') ||
              error.message.includes('Forbidden') ||
              error.message.includes('Invalid token') ||
              error.message.includes('Token expired'));

          if (isAuthError) {
            info('Token refresh failed with auth error, clearing auth storage');
            await authService.clearAuthStorage();
          } else if (isNetworkError) {
            info('Token refresh failed due to network error, keeping auth storage');
          } else {
            info('Token refresh failed with unknown error, keeping auth storage for retry');
            // Don't clear storage for unknown errors - let retry logic handle it
          }

          return false;
        }
      }

      // Validate token with middleware
      const response = await fetch(`${BACKEND_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appToken }),
      });

      return response.ok;
    } catch (error) {
      logError('Error validating token:', error);
      return false;
    }
  },

  /**
   * Get the current app token for Supabase authentication
   * @returns The current app token or null if not available
   */
  getAppToken: async (): Promise<string | null> => {
    try {
      return await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);
    } catch (error) {
      logError('Error getting app token:', error);
      return null;
    }
  },

  /**
   * Get the current refresh token
   * @returns The current refresh token or null if not available
   */
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      debug('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Update stored tokens after refresh
   * @param appToken New app token
   * @param refreshToken New refresh token
   */
  updateTokens: async (appToken: string, refreshToken: string): Promise<void> => {
    try {
      await Promise.all([
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      // Extract user data from the new token and trigger callback if registered
      try {
        const base64Url = appToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Use platform-agnostic base64 decoding
        let payload;
        if (typeof window !== 'undefined' && window.atob) {
          // Web environment
          payload = JSON.parse(window.atob(base64));
        } else {
          // React Native environment
          const base64js = require('base64-js');
          const uint8Array = base64js.toByteArray(base64);
          const decoded = String.fromCharCode.apply(null, uint8Array);
          payload = JSON.parse(decoded);
        }

        // Get stored email if not in token
        const email =
          payload.email || (await safeStorage.getItem<string>(STORAGE_KEYS.USER_EMAIL)) || '';

        // Only proceed if we have an email and callback is registered
        if (email && authService.onTokenRefresh) {
          const userData = {
            id: payload.sub,
            email: email,
            role: payload.role,
          };

          authService.onTokenRefresh(userData);
        }
      } catch (decodeError) {
        debug('Error decoding token after update:', decodeError);
      }
    } catch (error) {
      debug('Error updating tokens:', error);
      throw error;
    }
  },

  /**
   * Decode the user information from the JWT token
   * @returns User information or null if not available
   */
  getUserFromToken: async (): Promise<{ id: string; email: string; role: string } | null> => {
    try {
      debug('getUserFromToken: Starting...');
      const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);

      if (!appToken) {
        debug('getUserFromToken: No app token found');
        return null;
      }

      debug('getUserFromToken: Found app token');

      // Decode JWT token
      const base64Url = appToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Use platform-agnostic base64 decoding
      let payload;
      if (typeof window !== 'undefined' && window.atob) {
        // Web environment
        payload = JSON.parse(window.atob(base64));
      } else {
        // React Native environment
        const base64js = require('base64-js');
        const uint8Array = base64js.toByteArray(base64);
        const decoded = String.fromCharCode.apply(null, uint8Array);
        payload = JSON.parse(decoded);
      }

      // Get email from token or storage
      let email = payload.email || '';

      // If email is not in the token, try to get it from storage
      if (!email) {
        const storedEmail = await safeStorage.getItem<string>(STORAGE_KEYS.USER_EMAIL);
        if (storedEmail) {
          email = storedEmail;
        } else {
          // If we have user metadata with email, use that
          if (payload.user_metadata && payload.user_metadata.email) {
            email = payload.user_metadata.email;
          } else {
            // For Google Sign-In, we might have the email in a different location
            info('No direct email found, checking user metadata');
            // If still no email, we'll use a placeholder rather than failing
            email = 'user@example.com';
          }
        }
      }

      // Save the email for future use
      if (email) {
        await safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      }

      const userData = {
        id: payload.sub,
        email: email,
        role: payload.role,
      };

      debug('getUserFromToken: Returning user data:', userData);
      return userData;
    } catch (error) {
      logError('Error decoding token:', error);
      return null;
    }
  },

  /**
   * Clear all authentication data from storage
   */
  clearAuthStorage: async (): Promise<void> => {
    await Promise.all(Object.values(STORAGE_KEYS).map((key) => safeStorage.removeItem(key)));
  },

  /**
   * Check if user is authenticated
   * @returns True if user is authenticated and token is valid or can be refreshed
   */
  isAuthenticated: async (): Promise<boolean> => {
    const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);
    if (!appToken) {
      return false;
    }

    // For startup auth check, do local token validation first
    const isValidLocally = authService.isTokenValidLocally(appToken);

    if (isValidLocally) {
      return true;
    }

    // If token is expired locally, try to refresh it before giving up
    debug('Token expired locally, attempting refresh during startup...');
    const refreshToken = await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      debug('No refresh token available');
      return false;
    }

    try {
      const result = await authService.refreshTokens(refreshToken);

      if (result.appToken && result.refreshToken) {
        // Update stored tokens
        await authService.updateTokens(result.appToken, result.refreshToken);
        debug('Successfully refreshed tokens during startup');
        return true;
      }
    } catch (error) {
      debug('Failed to refresh tokens during startup:', error);

      // Only clear auth storage for authentication errors, not network/temporary errors
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('Network') ||
          error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('connection') ||
          error.message.toLowerCase().includes('timeout') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'NetworkError' ||
          error.name === 'TypeError');

      const isAuthError =
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Forbidden') ||
          error.message.includes('Invalid token') ||
          error.message.includes('Token expired'));

      if (isAuthError) {
        debug('Auth error during startup, clearing auth storage');
        await authService.clearAuthStorage();
      } else {
        debug('Network/temporary error during startup, keeping auth storage for retry');
        // Don't clear storage - let user try again when network improves
      }
    }

    return false;
  },

  /**
   * Check if token is valid locally (without HTTP calls)
   * @param token JWT token to validate
   * @returns True if token exists and is not expired
   */
  isTokenValidLocally: (token: string): boolean => {
    try {
      // Validate token format first
      if (!token || typeof token !== 'string') {
        debug('Token validation failed: invalid token type');
        return false;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        debug('Token validation failed: not a valid JWT format (expected 3 parts, got ' + parts.length + ')');
        return false;
      }
      
      const base64Url = parts[1];
      if (!base64Url) {
        debug('Token validation failed: missing payload part');
        return false;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const padding = base64.length % 4;
      const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;

      // Use platform-agnostic base64 decoding
      let payload;
      if (typeof window !== 'undefined' && window.atob) {
        // Web environment
        payload = JSON.parse(window.atob(paddedBase64));
      } else {
        // React Native environment
        const base64js = require('base64-js');
        const uint8Array = base64js.toByteArray(paddedBase64);
        const decoded = String.fromCharCode.apply(null, uint8Array);
        payload = JSON.parse(decoded);
      }

      // Check if token is expired (with 10 second buffer for safety)
      const bufferTime = 10 * 1000; // 10 seconds in milliseconds
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Only log token expiry info if it's about to expire or invalid (reduce debug noise)
      const isValid = currentTime < expiryTime - bufferTime;
      if (!isValid || timeUntilExpiry < 60000) { // Log if invalid or expires within 1 minute
        debug('Token expiry check:', {
          expiryTime: new Date(expiryTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
          timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + ' seconds',
          bufferTime: bufferTime / 1000 + ' seconds',
          isValid,
        });
      }

      return isValid;
    } catch (e) {
      debug('Error validating token locally:', e);
      return false;
    }
  },

  /**
   * Decode the JWT token and extract payload
   * @param token JWT token to decode
   * @returns Decoded payload or null if invalid
   */
  decodeToken: (token: string): DecodedToken | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Use platform-agnostic base64 decoding
      let payload;
      if (typeof window !== 'undefined' && window.atob) {
        // Web environment
        payload = JSON.parse(window.atob(base64));
      } else {
        // React Native environment
        const base64js = require('base64-js');
        const uint8Array = base64js.toByteArray(base64);
        const decoded = String.fromCharCode.apply(null, uint8Array);
        payload = JSON.parse(decoded);
      }

      return payload;
    } catch (error) {
      logError('Error decoding JWT token:', error);
      return null;
    }
  },

  /**
   * Check if user is a B2B user based on JWT claims
   * @param token JWT token (optional, will get current token if not provided)
   * @returns True if user is B2B user
   */
  isB2BUser: async (token?: string): Promise<boolean> => {
    try {
      const appToken = token || (await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN));

      if (!appToken) {
        return false;
      }

      const payload = authService.decodeToken(appToken);
      if (!payload || !payload.app_settings) {
        return false;
      }

      // Check if B2B settings exist in app_settings
      return !!(
        payload.app_settings.b2b &&
        (payload.app_settings.b2b.disableRevenueCat || payload.app_settings.b2b.organizationId)
      );
    } catch (error) {
      logError('Error checking B2B user status:', error);
      return false;
    }
  },

  /**
   * Check if RevenueCat should be disabled for the current user
   * @param token JWT token (optional, will get current token if not provided)
   * @returns True if RevenueCat should be disabled
   */
  shouldDisableRevenueCat: async (token?: string): Promise<boolean> => {
    try {
      const appToken = token || (await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN));

      if (!appToken) {
        return false; // Default to enabling RevenueCat if no token
      }

      const payload = authService.decodeToken(appToken);
      if (!payload || !payload.app_settings) {
        return false; // Default to enabling RevenueCat if no app_settings
      }

      // Check B2B disableRevenueCat flag
      return !!(payload.app_settings.b2b && payload.app_settings.b2b.disableRevenueCat);
    } catch (error) {
      logError('Error checking RevenueCat disable status:', error);
      return false; // Default to enabling RevenueCat on error
    }
  },

  /**
   * Get B2B information from JWT claims
   * @param token JWT token (optional, will get current token if not provided)
   * @returns B2B information or null if not a B2B user
   */
  getB2BInfo: async (
    token?: string
  ): Promise<{
    disableRevenueCat: boolean;
    organizationId?: string;
    plan?: string;
    role?: string;
  } | null> => {
    try {
      const appToken = token || (await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN));

      if (!appToken) {
        return null;
      }

      const payload = authService.decodeToken(appToken);
      if (!payload || !payload.app_settings || !payload.app_settings.b2b) {
        return null;
      }

      const b2bSettings = payload.app_settings.b2b;

      return {
        disableRevenueCat: !!b2bSettings.disableRevenueCat,
        organizationId: b2bSettings.organizationId || undefined,
        plan: b2bSettings.plan || undefined,
        role: b2bSettings.role || undefined,
      };
    } catch (error) {
      logError('Error getting B2B info:', error);
      return null;
    }
  },

  /**
   * Get all app settings from JWT claims
   * @param token JWT token (optional, will get current token if not provided)
   * @returns App settings object or null if not available
   */
  getAppSettings: async (token?: string): Promise<any | null> => {
    try {
      const appToken = token || (await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN));

      if (!appToken) {
        return null;
      }

      const payload = authService.decodeToken(appToken);
      return payload?.app_settings || null;
    } catch (error) {
      logError('Error getting app settings:', error);
      return null;
    }
  },

  /**
   * Get user credits from the mana middleware
   * @returns User credits information
   */
  getUserCredits: async (): Promise<{
    credits: number;
    maxCreditLimit: number;
    userId: string;
  } | null> => {
    try {
      info('[getUserCredits] Starting credits request');

      // Get the app token from storage
      const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);

      if (!appToken) {
        logError('[getUserCredits] No app token available for credits request');
        return null;
      }

      // Log token details (partial for security)
      debug('[getUserCredits] Token preview:', appToken.substring(0, 20) + '...');
      debug('[getUserCredits] Token length:', appToken.length);

      // Check if token is valid locally
      const isValid = authService.isTokenValidLocally(appToken);
      debug('[getUserCredits] Token valid locally:', isValid);

      // Try to decode token to check its structure
      try {
        const tokenParts = appToken.split('.');
        if (tokenParts.length === 3) {
          // Decode the payload (middle part)
          const payload = JSON.parse(atob(tokenParts[1]));
          debug('[getUserCredits] Token payload:', {
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp,
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
            aud: payload.aud,
            app_id: payload.app_id,
          });
        } else {
          logError('[getUserCredits] Invalid token format - not a JWT');
        }
      } catch (e) {
        logError('[getUserCredits] Error decoding token:', e);
      }

      // Log the request URL - now using auth proxy endpoint
      debug('[getUserCredits] Request URL:', `${BACKEND_URL}/auth/credits`);

      // Make the request
      debug('[getUserCredits] Sending request...');
      const response = await fetch(`${BACKEND_URL}/auth/credits`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${appToken}`,
          'Content-Type': 'application/json',
        },
      });

      debug('[getUserCredits] Response status:', response.status);
      debug('[getUserCredits] Response status text:', response.statusText);

      // Log response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      debug('[getUserCredits] Response headers:', headers);

      if (!response.ok) {
        if (response.status === 401) {
          logError('[getUserCredits] 401 Unauthorized response');
          // Try to get response body for more details
          try {
            const errorBody = await response.text();
            logError('[getUserCredits] Error response body:', errorBody);
          } catch (e) {
            logError('[getUserCredits] Could not read error response body');
          }
          // Token might be expired, let the fetch interceptor handle refresh
          throw new Error('Unauthorized - token may need refresh');
        }
        const errorData = await response.json().catch(() => ({}));
        logError('[getUserCredits] Error data:', errorData);
        throw new Error(errorData.message || 'Failed to fetch user credits');
      }

      const creditsData = await response.json();
      debug('[getUserCredits] Raw response data:', creditsData);

      // Transform response to match expected frontend format
      const transformedData = {
        credits: creditsData.credits || 0,
        maxCreditLimit: creditsData.max_credit_limit || 1000, // Use the value from the response if available
        userId: creditsData.id || 'unknown',
      };

      debug('[getUserCredits] Transformed data:', transformedData);
      return transformedData;
    } catch (error) {
      logError('[getUserCredits] Error fetching user credits:', error);
      return null;
    }
  },

  /**
   * Get the app-specific Supabase token
   * @returns The Supabase token or null if not available
   */
  getAppSupabaseToken: async (): Promise<string | null> => {
    try {
      const token = await safeStorage.getItem<string>(STORAGE_KEYS.APP_SUPABASE_TOKEN);
      return token || null;
    } catch (error) {
      logError('Error getting app Supabase token:', error);
      return null;
    }
  },
};
