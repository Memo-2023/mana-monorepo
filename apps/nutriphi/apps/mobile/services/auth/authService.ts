/**
 * Authentication service for Nutriphi Mobile
 * Uses Mana middleware for authentication
 */

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const MIDDLEWARE_URL = process.env.EXPO_PUBLIC_MANA_MIDDLEWARE_URL || 'https://api.manacore.de';
const APP_ID = process.env.EXPO_PUBLIC_MIDDLEWARE_APP_ID || 'nutriphi';

/**
 * Get device information for authentication
 */
function getDeviceInfo() {
  return {
    deviceId: Application.getIosIdForVendorAsync ?
      Application.androidId || `${Platform.OS}-${Date.now()}` :
      `${Platform.OS}-${Date.now()}`,
    deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}`,
    deviceType: Device.isDevice ? 'mobile' : 'simulator',
    platform: Platform.OS,
  };
}

/**
 * Decode JWT token
 */
function decodeToken(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Use atob equivalent for React Native
    const payload = JSON.parse(
      decodeURIComponent(
        Array.from(atob(base64))
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;

    // Add 10 second buffer
    const bufferTime = 10 * 1000;
    return Date.now() >= payload.exp * 1000 - bufferTime;
  } catch {
    return true;
  }
}

export interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
  appToken?: string;
  refreshToken?: string;
  email?: string;
}

export interface UserData {
  id: string;
  email: string;
  role: string;
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${MIDDLEWARE_URL}/auth/signin?appId=${APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          if (
            errorData.message?.includes('Firebase user detected') ||
            errorData.message?.includes('password reset required')
          ) {
            return {
              success: false,
              error: 'FIREBASE_USER_PASSWORD_RESET_REQUIRED',
            };
          }

          if (
            errorData.message?.includes('Email not confirmed') ||
            errorData.message?.includes('Email not verified')
          ) {
            return {
              success: false,
              error: 'EMAIL_NOT_VERIFIED',
            };
          }

          return {
            success: false,
            error: 'INVALID_CREDENTIALS',
          };
        }

        return {
          success: false,
          error: errorData.message || 'Sign in failed',
        };
      }

      const { appToken, refreshToken } = await response.json();

      return {
        success: true,
        appToken,
        refreshToken,
        email,
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during sign in',
      };
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${MIDDLEWARE_URL}/auth/signup?appId=${APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          return {
            success: false,
            error: 'This email is already in use',
          };
        }

        return {
          success: false,
          error: errorData.message || 'Registration failed',
        };
      }

      const responseData = await response.json();

      if (responseData.confirmationRequired) {
        return {
          success: true,
          needsVerification: true,
        };
      }

      const { appToken, refreshToken } = responseData;

      return {
        success: true,
        appToken,
        refreshToken,
        email,
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during registration',
      };
    }
  },

  /**
   * Sign in with Google ID token
   */
  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${MIDDLEWARE_URL}/auth/google-signin?appId=${APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Google Sign-In failed',
        };
      }

      const responseData = await response.json();
      const { appToken, refreshToken } = responseData;

      let email = responseData.email;
      if (!email && appToken) {
        const payload = decodeToken(appToken);
        email = payload?.email || payload?.user_metadata?.email || '';
      }

      return {
        success: true,
        appToken,
        refreshToken,
        email,
      };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Google Sign-In',
      };
    }
  },

  /**
   * Sign in with Apple ID token
   */
  async signInWithApple(idToken: string, user?: { email?: string; fullName?: { givenName?: string; familyName?: string } }): Promise<AuthResult> {
    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${MIDDLEWARE_URL}/auth/apple-signin?appId=${APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken, user, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Apple Sign-In failed',
        };
      }

      const responseData = await response.json();
      const { appToken, refreshToken } = responseData;

      let email = responseData.email || user?.email;
      if (!email && appToken) {
        const payload = decodeToken(appToken);
        email = payload?.email || '';
      }

      return {
        success: true,
        appToken,
        refreshToken,
        email,
      };
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Apple Sign-In',
      };
    }
  },

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(
    currentRefreshToken: string
  ): Promise<{
    appToken: string;
    refreshToken: string;
    userData?: UserData | null;
  }> {
    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${MIDDLEWARE_URL}/auth/refresh?appId=${APP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken, deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to refresh tokens');
      }

      const responseData = await response.json();
      const { appToken, refreshToken } = responseData;

      if (!appToken || !refreshToken) {
        throw new Error('Invalid response from token refresh');
      }

      let userData: UserData | null = null;
      try {
        const payload = decodeToken(appToken);
        if (payload) {
          userData = {
            id: payload.sub,
            email: payload.email || '',
            role: payload.role || 'user',
          };
        }
      } catch (error) {
        console.error('Error decoding refreshed token:', error);
      }

      return { appToken, refreshToken, userData };
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  },

  /**
   * Sign out
   */
  async signOut(refreshToken: string): Promise<void> {
    try {
      await fetch(`${MIDDLEWARE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).catch((err) => console.error('Error logging out on server:', err));
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.message?.includes('rate limit')) {
          return {
            success: false,
            error:
              'Too many password reset attempts. Please wait a few minutes before trying again.',
          };
        }

        return {
          success: false,
          error: errorData.message || 'Password reset failed',
        };
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
   * Get user data from token
   */
  getUserFromToken(appToken: string): UserData | null {
    try {
      const payload = decodeToken(appToken);
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email || '',
        role: payload.role || 'user',
      };
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  },

  /**
   * Check if token is valid locally (without network call)
   */
  isTokenValidLocally(token: string): boolean {
    return !isTokenExpired(token);
  },
};
