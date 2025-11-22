// Mana Core Authentication Types

export interface ManaUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

/**
 * App settings from JWT
 */
export interface AppSettings {
  b2b?: B2BSettings;
  [key: string]: any;
}

/**
 * B2B customer settings
 */
export interface B2BSettings {
  disableRevenueCat?: boolean;
  organizationId?: string;
  plan?: string;
  role?: string;
}

/**
 * JWT Token payload structure (enhanced)
 */
export interface JwtPayload {
  // Standard JWT claims
  sub: string; // User ID
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];

  // Custom claims
  email?: string;
  user_id?: string;
  session_id?: string;
  role: string;
  app_id?: string;
  app_settings?: AppSettings;
}

/**
 * Decoded token interface (alias for compatibility)
 */
export interface DecodedToken extends JwtPayload {}

export interface AuthTokens {
  appToken: string;
  refreshToken: string;
}

export interface SignInResponse extends AuthTokens {
  user?: ManaUser;
}

export interface SignUpResponse extends AuthTokens {
  user?: ManaUser;
  message?: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}

export interface CreditBalance {
  credits: number;
  userId: string;
}

/**
 * Device information for multi-device support
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  userAgent?: string;
}
