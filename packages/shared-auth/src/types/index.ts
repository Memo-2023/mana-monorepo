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
	tier?: string;
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
	email: string;
	role: string;
	tier: string;
}

/**
 * Authentication result from sign in/up
 */
export interface AuthResult {
	success: boolean;
	error?: string;
	needsVerification?: boolean;
	twoFactorRedirect?: boolean;
	retryAfter?: number;
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
	resendVerification: string;
	credits: string;
	/** Better Auth native endpoint for SSO session check */
	getSession: string;
	passkeyRegisterOptions: string;
	passkeyRegisterVerify: string;
	passkeyAuthOptions: string;
	passkeyAuthVerify: string;
	passkeyList: string;
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

/**
 * Explicit interface for the auth service.
 *
 * TypeScript's ReturnType<> inference truncates large object literals (~27 methods shown).
 * This explicit interface ensures all 37 methods are visible to consumers.
 */
export interface AuthServiceInterface {
	// Core auth
	signIn(email: string, password: string): Promise<AuthResult>;
	signUp(email: string, password: string, sourceAppUrl?: string): Promise<AuthResult>;
	signOut(): Promise<void>;
	forgotPassword(email: string, redirectTo?: string): Promise<AuthResult>;
	resetPassword(token: string, newPassword: string): Promise<AuthResult>;
	resendVerificationEmail(email: string, sourceAppUrl?: string): Promise<AuthResult>;
	refreshTokens(currentRefreshToken: string): Promise<TokenRefreshResult>;
	changePassword(currentPassword: string, newPassword: string): Promise<AuthResult>;

	// Magic link
	sendMagicLink(email: string): Promise<AuthResult>;

	// Passkeys
	isPasskeyAvailable(): boolean;
	registerPasskey(friendlyName?: string): Promise<AuthResult>;
	signInWithPasskey(): Promise<AuthResult>;
	listPasskeys(): Promise<any[]>;
	deletePasskey(passkeyId: string): Promise<AuthResult>;
	renamePasskey(passkeyId: string, friendlyName: string): Promise<AuthResult>;

	// Two-factor auth
	enableTwoFactor(
		password: string
	): Promise<{ success: boolean; uri?: string; backupCodes?: string[]; error?: string }>;
	disableTwoFactor(password: string): Promise<AuthResult>;
	verifyTwoFactor(code: string, trustDevice?: boolean): Promise<AuthResult>;
	verifyBackupCode(code: string): Promise<AuthResult>;
	generateBackupCodes(
		password: string
	): Promise<{ success: boolean; backupCodes?: string[]; error?: string }>;

	// Security
	getSecurityEvents(limit?: number): Promise<any[]>;
	listSessions(): Promise<any[]>;
	revokeSession(sessionId: string): Promise<AuthResult>;

	// Token management
	getAppToken(): Promise<string | null>;
	getRefreshToken(): Promise<string | null>;
	updateTokens(appToken: string, refreshToken: string): Promise<void>;
	getUserFromToken(): Promise<UserData | null>;
	clearAuthStorage(): Promise<void>;
	isAuthenticated(): Promise<boolean>;

	// Credits & B2B
	getUserCredits(): Promise<CreditBalance | null>;
	isB2BUser(): Promise<boolean>;
	getB2BInfo(): Promise<B2BInfo | null>;
	shouldDisableRevenueCat(): Promise<boolean>;
	getAppSettings(): Promise<Record<string, unknown> | null>;

	// SSO
	trySSO(): Promise<AuthResult>;

	// Utilities
	getBaseUrl(): string;
	getStorageKeys(): StorageKeys;
	onTokenRefresh: ((userData: UserData) => void) | null;

	// Token utilities
	isTokenValidLocally(token: string): boolean;

	// Internal
	handleAuthError(status: number, errorData: any): AuthResult;
}
