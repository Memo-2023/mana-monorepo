import type { DecodedToken, UserData } from '../types';

/**
 * Decode a JWT token payload
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const padding = base64.length % 4;
    const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;

    // Decode base64 - atob is available in browsers, Node.js 16+, and React Native
    const payload: DecodedToken = JSON.parse(atob(paddedBase64));

    return payload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Check if a token is valid locally (not expired)
 */
export function isTokenValidLocally(token: string, bufferSeconds: number = 10): boolean {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      return false;
    }

    const bufferTime = bufferSeconds * 1000;
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime < expiryTime - bufferTime;
  } catch (error) {
    console.debug('Error validating token locally:', error);
    return false;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  return !isTokenValidLocally(token, 0);
}

/**
 * Extract user data from a JWT token
 */
export function getUserFromToken(token: string, storedEmail?: string): UserData | null {
  try {
    const payload = decodeToken(token);
    if (!payload) {
      return null;
    }

    // Get email from various sources
    let email = payload.email || '';
    if (!email && payload.user_metadata?.email) {
      email = payload.user_metadata.email;
    }
    if (!email && storedEmail) {
      email = storedEmail;
    }

    return {
      id: payload.sub,
      email: email || 'user@example.com',
      role: payload.role || 'user',
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return payload.exp * 1000;
}

/**
 * Get time until token expiration in milliseconds
 */
export function getTimeUntilExpiration(token: string): number {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return 0;
  }
  return Math.max(0, expirationTime - Date.now());
}

/**
 * Check if user is B2B based on JWT claims
 */
export function isB2BUser(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) {
    return false;
  }

  // Handle different types for is_b2b
  return payload.is_b2b === true || payload.is_b2b === 'true' || payload.is_b2b === 1;
}

/**
 * Get B2B information from JWT claims
 */
export function getB2BInfo(token: string): {
  disableRevenueCat: boolean;
  organizationId?: string;
  plan?: string;
  role?: string;
} | null {
  const payload = decodeToken(token);
  if (!payload?.app_settings?.b2b) {
    return null;
  }

  const b2bSettings = payload.app_settings.b2b;
  return {
    disableRevenueCat: !!b2bSettings.disableRevenueCat,
    organizationId: b2bSettings.organizationId,
    plan: b2bSettings.plan,
    role: b2bSettings.role,
  };
}

/**
 * Check if RevenueCat should be disabled for this token
 */
export function shouldDisableRevenueCat(token: string): boolean {
  const b2bInfo = getB2BInfo(token);
  return b2bInfo?.disableRevenueCat ?? false;
}

/**
 * Get app settings from JWT claims
 */
export function getAppSettings(token: string): Record<string, unknown> | null {
  const payload = decodeToken(token);
  return payload?.app_settings || null;
}
