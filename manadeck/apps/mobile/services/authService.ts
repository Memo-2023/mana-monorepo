import { Platform } from 'react-native';
import type {
  ManaUser,
  AuthTokens,
  SignInResponse,
  SignUpResponse,
  JwtPayload,
  DeviceInfo,
} from '../types/auth';
import { DeviceManager } from '../utils/deviceManager';
import { safeStorage } from '../utils/safeStorage';
import { debug, info, warn, error as logError } from '../utils/logger';

// Get backend URL from environment with fallback
const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadeck-backend-111768794939.europe-west3.run.app';

// Handle localhost for Android emulator
const getApiUrl = () => {
  const url = BASE_API_URL;
  if (
    Platform.OS === 'android' &&
    (url.includes('localhost') || url.includes('127.0.0.1'))
  ) {
    return url.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return url;
};

const API_URL = getApiUrl().replace(/\/$/, ''); // Remove trailing slash

info(`Using backend URL (${Platform.OS}):`, API_URL);

// Storage keys for auth tokens
const STORAGE_KEYS = {
  APP_TOKEN: '@mana/appToken',
  REFRESH_TOKEN: '@mana/refreshToken',
  USER_EMAIL: '@mana/userEmail',
} as const;

/**
 * Mana Core Authentication Service
 * Handles all authentication operations through the NestJS backend
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  signIn: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
    try {
      // Get device information
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${API_URL}/v1/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          deviceInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data: SignInResponse = await response.json();
      const { appToken, refreshToken } = data;

      // Store tokens securely
      await Promise.all([
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email),
      ]);

      // Extract user from JWT token
      const user = authService.getUserFromToken(appToken);

      return { success: true, user: user || undefined };
    } catch (error) {
      logError('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Sign up with email, password, and username
   */
  signUp: async (
    email: string,
    password: string,
    username: string
  ): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
    try {
      // Get device information
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${API_URL}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username,
          deviceInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Sign up failed');
      }

      const data: SignUpResponse = await response.json();
      const { appToken, refreshToken } = data;

      // Store tokens securely
      await Promise.all([
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, email),
      ]);

      // Extract user from JWT token
      const user = authService.getUserFromToken(appToken);

      return { success: true, user: user || undefined };
    } catch (error) {
      logError('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    try {
      const refreshToken = await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        // Notify backend of logout
        await fetch(`${API_URL}/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).catch((err) => logError('Error logging out on server:', err));
      }

      // Clear all auth data and device ID
      await authService.clearAuthStorage();

      // Also clear device ID so a new one is generated on next login
      await DeviceManager.clearDeviceId();
    } catch (error) {
      logError('Error signing out:', error);
      // Still clear local storage even if server request fails
      await authService.clearAuthStorage();
      try {
        await DeviceManager.clearDeviceId();
      } catch (e) {
        logError('Error clearing device ID:', e);
      }
    }
  },

  /**
   * Refresh access token using refresh token
   * Updated signature to match TokenManager requirements
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
        logError('Device ID mismatch detected during token refresh', {
          stored: storedDeviceId,
          current: deviceInfo.deviceId
        });

        throw new Error('Device ID has changed. Please sign in again.');
      }

      // Debug log device info
      debug('Device info for token refresh:', deviceInfo);
      debug('Refreshing tokens');

      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        debug('Token refresh failed with status:', response.status, errorData);

        // If refresh fails with 401, it might be due to old tokens without device info
        if (response.status === 401 && errorData.message === 'Invalid refresh token') {
          debug('Refresh token invalid - likely due to old token without device info');
          throw new Error('Session expired. Please sign in again.');
        }

        throw new Error(errorData.message || 'Failed to refresh tokens');
      }

      const responseData = await response.json();
      debug('Token refresh response:', responseData);

      // Note: If grace period was used, backend returns the previously generated token
      // This is normal and expected - the frontend should always save whatever token is returned
      const { appToken, refreshToken, deviceId, grace_period_used, grace_expires_at } = responseData;

      // Log grace period usage if present
      if (grace_period_used) {
        debug('Token refresh used grace period - returning previously rotated token');
        debug('Grace period expires at:', grace_expires_at);
      } else if (grace_expires_at) {
        debug('Token refreshed with new grace period until:', grace_expires_at);
      }

      debug(
        'Extracted tokens - appToken:',
        !!appToken,
        'refreshToken:',
        !!refreshToken,
        'deviceId:',
        deviceId
      );

      // Validate that we received tokens
      if (!appToken || !refreshToken) {
        logError('Missing tokens in refresh response:', {
          appToken: !!appToken,
          refreshToken: !!refreshToken,
        });
        throw new Error('Invalid response from token refresh - missing tokens');
      }

      debug('Tokens refreshed successfully');

      // Store new tokens in local storage
      await safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken);
      await safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      // Extract user data from new token
      const user = authService.getUserFromToken(appToken);
      const userData = user
        ? { id: user.id, email: user.email, role: user.role }
        : null;

      return { appToken, refreshToken, userData };
    } catch (error) {
      debug('Token refresh error:', error);
      throw error; // TokenManager will handle error classification
    }
  },

  /**
   * Legacy refreshToken method (for backward compatibility)
   */
  refreshToken: async (): Promise<AuthTokens | null> => {
    try {
      const currentRefreshToken = await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);

      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await authService.refreshTokens(currentRefreshToken);
      return { appToken: result.appToken, refreshToken: result.refreshToken };
    } catch (error) {
      logError('Token refresh error:', error);
      await authService.clearAuthStorage();
      return null;
    }
  },

  /**
   * Reset password via email
   */
  resetPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      return { success: true };
    } catch (error) {
      logError('Password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get current app token
   */
  getAppToken: async (): Promise<string | null> => {
    return await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);
  },

  /**
   * Get current refresh token
   */
  getRefreshToken: async (): Promise<string | null> => {
    return await safeStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Clear all auth storage
   */
  clearAuthStorage: async (): Promise<void> => {
    // Clear Manadeck auth keys
    await Promise.all(Object.values(STORAGE_KEYS).map((key) => safeStorage.removeItem(key)));

    // Also clear any legacy Memoro/Mana auth keys if they exist
    const legacyKeys = [
      'appToken',
      'refreshToken',
      'manaToken',
      'deviceId',
      '@auth/appToken',
      '@auth/refreshToken',
      '@auth/userEmail',
    ];
    await Promise.all(legacyKeys.map((key) => safeStorage.removeItem(key)));
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: async (): Promise<boolean> => {
    const appToken = await safeStorage.getItem<string>(STORAGE_KEYS.APP_TOKEN);
    if (!appToken) return false;

    // Check if token is expired
    try {
      const payload = authService.decodeToken(appToken);
      if (!payload) return false;

      // Check expiration (with 30 second buffer)
      return Date.now() < payload.exp * 1000 - 30000;
    } catch {
      return false;
    }
  },

  /**
   * Decode JWT token payload
   */
  decodeToken: (token: string): JwtPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      return payload as JwtPayload;
    } catch (error) {
      logError('Token decode error:', error);
      return null;
    }
  },

  /**
   * Extract user information from JWT token
   */
  getUserFromToken: (token: string): ManaUser | null => {
    try {
      const payload = authService.decodeToken(token);
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email || '',
        role: payload.role,
        name: payload.email?.split('@')[0] || 'User',
        organizationId: payload.app_settings?.b2b?.organizationId,
        metadata: payload.app_settings,
      };
    } catch (error) {
      logError('Error extracting user from token:', error);
      return null;
    }
  },

  /**
   * Get user credits balance
   */
  getCredits: async (): Promise<number | null> => {
    try {
      const token = await authService.getAppToken();
      if (!token) return null;

      const response = await fetch(`${API_URL}/v1/auth/credits`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      return data.credits || 0;
    } catch (error) {
      logError('Error fetching credits:', error);
      return null;
    }
  },

  /**
   * Check if token is valid locally (without HTTP calls)
   * Used by TokenManager to avoid unnecessary network requests
   * @param token JWT token to validate
   * @returns True if token exists and is not expired
   */
  isTokenValidLocally: (token: string): boolean => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      // Check if token is expired (with 10 second buffer for safety)
      const bufferTime = 10 * 1000; // 10 seconds in milliseconds
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();

      return currentTime < expiryTime - bufferTime;
    } catch (e) {
      console.debug('Error validating token locally:', e);
      return false;
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async (
    idToken: string
  ): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
    try {
      // Get device information
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${API_URL}/v1/auth/google-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: idToken,
          deviceInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Google sign-in failed');
      }

      const data: SignInResponse = await response.json();
      const { appToken, refreshToken } = data;

      // Store tokens securely
      await Promise.all([
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      // Extract user from JWT token
      const user = authService.getUserFromToken(appToken);
      if (user?.email) {
        await safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      }

      return { success: true, user: user || undefined };
    } catch (error) {
      logError('Google sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Sign in with Apple
   */
  signInWithApple: async (
    identityToken: string
  ): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
    try {
      // Get device information
      const deviceInfo = await DeviceManager.getDeviceInfo();

      const response = await fetch(`${API_URL}/v1/auth/apple-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: identityToken,
          deviceInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Apple sign-in failed');
      }

      const data: SignInResponse = await response.json();
      const { appToken, refreshToken } = data;

      // Store tokens securely
      await Promise.all([
        safeStorage.setItem(STORAGE_KEYS.APP_TOKEN, appToken),
        safeStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      // Extract user from JWT token
      const user = authService.getUserFromToken(appToken);
      if (user?.email) {
        await safeStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      }

      return { success: true, user: user || undefined };
    } catch (error) {
      logError('Apple sign-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Event callback for token refresh
   * Set this from AuthContext to receive user data updates after token refresh
   */
  onTokenRefresh: null as ((userData: { id: string; email: string; role: string }) => void) | null,
};
