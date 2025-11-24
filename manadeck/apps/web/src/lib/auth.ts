/**
 * Manadeck Web Auth Configuration
 *
 * This file initializes the shared auth package for the manadeck web app.
 * It replaces the previous individual auth files:
 * - services/authService.ts
 * - services/tokenManager.ts
 * - services/deviceManager.ts
 * - utils/jwt.ts
 */

import { PUBLIC_API_URL } from '$env/static/public';
import {
  createAuthService,
  createTokenManager,
  setStorageAdapter,
  setDeviceAdapter,
  setNetworkAdapter,
  setupFetchInterceptor,
  type StorageAdapter,
  type DeviceManagerAdapter,
  type NetworkAdapter,
  type DeviceInfo,
} from '@manacore/shared-auth';

// Storage keys
const STORAGE_KEYS = {
  APP_TOKEN: 'appToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_EMAIL: 'userEmail',
  DEVICE_ID: 'manadeck_device_id',
};

/**
 * Session storage adapter for manadeck web
 * Uses sessionStorage for tokens (clears on tab close)
 * Uses localStorage for device ID (persists)
 */
const sessionStorageAdapter: StorageAdapter = {
  async getItem<T = string>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    const value = sessionStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};

/**
 * Device manager adapter for web
 */
const webDeviceAdapter: DeviceManagerAdapter = {
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (typeof window === 'undefined') {
      return {
        deviceId: '',
        deviceName: 'Server',
        deviceType: 'web',
      };
    }

    const deviceId = await webDeviceAdapter.getStoredDeviceId() || generateDeviceId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);

    const userAgent = navigator.userAgent;
    let deviceName = 'Web Browser';

    if (userAgent.includes('Mac')) deviceName = 'Mac';
    else if (userAgent.includes('Windows')) deviceName = 'Windows';
    else if (userAgent.includes('Linux')) deviceName = 'Linux';

    return {
      deviceId,
      deviceName,
      deviceType: 'web',
      platform: 'web',
    };
  },

  async getStoredDeviceId(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  },
};

/**
 * Network adapter for web
 */
const webNetworkAdapter: NetworkAdapter = {
  async isDeviceConnected(): Promise<boolean> {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },

  async hasStableConnection(): Promise<boolean> {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },
};

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Initialize adapters
setStorageAdapter(sessionStorageAdapter);
setDeviceAdapter(webDeviceAdapter);
setNetworkAdapter(webNetworkAdapter);

// Create auth service instance
export const authService = createAuthService({
  baseUrl: PUBLIC_API_URL,
  storageKeys: {
    APP_TOKEN: STORAGE_KEYS.APP_TOKEN,
    REFRESH_TOKEN: STORAGE_KEYS.REFRESH_TOKEN,
    USER_EMAIL: STORAGE_KEYS.USER_EMAIL,
  },
  endpoints: {
    signIn: '/v1/auth/signin',
    signUp: '/v1/auth/signup',
    signOut: '/v1/auth/logout',
    refresh: '/v1/auth/refresh',
    validate: '/v1/auth/validate',
    forgotPassword: '/v1/auth/forgot-password',
    googleSignIn: '/v1/auth/google-signin',
    appleSignIn: '/v1/auth/apple-signin',
    credits: '/v1/auth/credits',
  },
});

// Create token manager instance
export const tokenManager = createTokenManager(authService);

// Setup fetch interceptor (only in browser)
if (typeof window !== 'undefined') {
  setupFetchInterceptor(authService, tokenManager, {
    backendUrl: PUBLIC_API_URL,
  });
}

// Re-export useful utilities from shared-auth
export {
  decodeToken,
  isTokenValidLocally,
  isTokenExpired,
  getUserFromToken,
  isB2BUser,
  getB2BInfo,
  TokenState,
} from '@manacore/shared-auth';

// Re-export types
export type {
  UserData,
  DecodedToken,
  AuthResult,
  CreditBalance,
  B2BInfo,
} from '@manacore/shared-auth';
