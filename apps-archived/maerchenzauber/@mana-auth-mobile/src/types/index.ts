/**
 * Authentication type definitions for @mana/auth-mobile
 */

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
	[key: string]: any; // Allow app-specific settings
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
 * User profile
 */
export interface User {
	id: string;
	email: string;
	role: string;
	name: string;
	[key: string]: any; // Allow additional user properties
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
	appToken: string;
	refreshToken: string;
	appSupabaseToken?: string;
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
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * Device information for multi-device support
 */
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	deviceType: 'web' | 'ios' | 'android';
	userAgent?: string;
}

/**
 * Auth response structure
 */
export interface AuthResponse {
	success: boolean;
	error?: string;
	needsVerification?: boolean;
}

/**
 * Token manager state
 */
export enum TokenState {
	IDLE = 'idle',
	REFRESHING = 'refreshing',
	EXPIRED = 'expired',
	VALID = 'valid',
}
