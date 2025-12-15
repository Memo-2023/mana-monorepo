/**
 * Storage keys for authentication data
 */
export interface StorageKeys {
	APP_TOKEN: string;
	REFRESH_TOKEN: string;
	USER_EMAIL: string;
}

/**
 * Device information for multi-device support
 */
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	deviceType: string;
	platform?: string;
}

/**
 * Decoded JWT token payload
 */
export interface DecodedToken {
	sub: string;
	email?: string;
	role?: string;
	exp: number;
	iat: number;
	aud?: string;
	app_id?: string;
	is_b2b?: boolean | string | number;
	subscription_plan_id?: string;
	user_metadata?: {
		email?: string;
	};
	app_settings?: {
		b2b?: {
			disableRevenueCat?: boolean;
			organizationId?: string;
			plan?: string;
			role?: string;
		};
	};
}

/**
 * User data extracted from token
 */
export interface UserData {
	id: string;
	sub: string; // JWT subject (user ID)
	email: string;
	role: string;
}

/**
 * Authentication result from sign in/up
 */
export interface AuthResult {
	success: boolean;
	error?: string;
	needsVerification?: boolean;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
	appToken: string;
	refreshToken: string;
	userData?: UserData | null;
}

/**
 * Token state for the token manager
 */
export enum TokenState {
	IDLE = 'idle',
	REFRESHING = 'refreshing',
	EXPIRED = 'expired',
	EXPIRED_OFFLINE = 'expired_offline',
	VALID = 'valid',
}

/**
 * Token state observer callback
 */
export type TokenStateObserver = (state: TokenState, token?: string) => void;

/**
 * Queued request item during token refresh
 */
export interface QueuedRequest {
	id: string;
	input: RequestInfo | URL;
	init?: RequestInit;
	resolve: (value: Response) => void;
	reject: (reason?: unknown) => void;
	timestamp: number;
}

/**
 * Internal token refresh result
 */
export interface InternalTokenRefreshResult {
	success: boolean;
	token?: string;
	error?: string;
	shouldPreserveAuth?: boolean;
	shouldRetry?: boolean;
}

/**
 * Configuration for the auth service
 */
export interface AuthServiceConfig {
	baseUrl: string;
	storageKeys?: Partial<StorageKeys>;
	endpoints?: Partial<AuthEndpoints>;
}

/**
 * Auth API endpoints
 */
export interface AuthEndpoints {
	signIn: string;
	signUp: string;
	signOut: string;
	refresh: string;
	validate: string;
	forgotPassword: string;
	resetPassword: string;
	googleSignIn: string;
	appleSignIn: string;
	credits: string;
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
	getItem<T = string>(key: string): Promise<T | null>;
	setItem(key: string, value: string): Promise<void>;
	removeItem(key: string): Promise<void>;
}

/**
 * Device manager adapter interface
 */
export interface DeviceManagerAdapter {
	getDeviceInfo(): Promise<DeviceInfo>;
	getStoredDeviceId(): Promise<string | null>;
}

/**
 * Network utilities adapter interface
 */
export interface NetworkAdapter {
	isDeviceConnected(): Promise<boolean>;
	hasStableConnection?(): Promise<boolean>;
}

/**
 * Credit balance response
 */
export interface CreditBalance {
	credits: number;
	maxCreditLimit: number;
	userId: string;
}

/**
 * B2B information from JWT claims
 */
export interface B2BInfo {
	disableRevenueCat: boolean;
	organizationId?: string;
	plan?: string;
	role?: string;
}
