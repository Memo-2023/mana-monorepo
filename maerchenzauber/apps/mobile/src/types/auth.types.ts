/**
 * Authentication type definitions
 */

import { WithId, Timestamps } from '~/features/core/types';

/**
 * JWT Token payload structure
 */
export interface DecodedToken {
  // Standard JWT claims
  sub: string;
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
  
  // Custom claims
  email?: string;
  user_id?: string;
  session_id?: string;
  role?: string;
  app_settings?: AppSettings;
}

/**
 * App settings from JWT
 */
export interface AppSettings {
  b2b?: B2BSettings;
  memoro?: MemoroSettings;
}

/**
 * B2B customer settings
 */
export interface B2BSettings {
  disableRevenueCat: boolean;
  organizationId: string;
  plan: string;
  role: string;
}

/**
 * Memoro app settings
 */
export interface MemoroSettings {
  dataUsageAcceptance: boolean;
  emailNewsletterOptIn: boolean;
}

/**
 * User profile
 */
export interface User extends WithId, Timestamps {
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  tokenType?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData extends LoginCredentials {
  firstName?: string;
  lastName?: string;
  acceptTerms?: boolean;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'apple' | 'facebook';

/**
 * OAuth credentials
 */
export interface OAuthCredentials {
  provider: OAuthProvider;
  idToken?: string;
  accessToken?: string;
  authCode?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    photo?: string;
  };
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  session?: {
    id: string;
    device?: string;
    ip?: string;
  };
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Device information for multi-device support
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'web' | 'ios' | 'android' | 'desktop';
  userAgent?: string;
}

/**
 * Device session information
 */
export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  lastUsedAt: Date;
  createdAt: Date;
  isCurrent?: boolean;
}