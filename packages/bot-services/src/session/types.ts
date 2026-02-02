/**
 * Types for Matrix user session management
 */

/**
 * User session data stored per Matrix user
 */
export interface UserSession {
	/** JWT token from mana-core-auth */
	token: string;
	/** User's email address */
	email: string;
	/** Token expiration time */
	expiresAt: Date;
	/** Additional session data (bot-specific) */
	data?: Record<string, unknown>;
}

/**
 * Login result
 */
export interface LoginResult {
	success: boolean;
	error?: string;
	email?: string;
}

/**
 * Session statistics
 */
export interface SessionStats {
	/** Total sessions (including expired) */
	total: number;
	/** Active (non-expired) sessions */
	active: number;
	/** Storage mode being used */
	storageMode?: 'memory' | 'redis';
	/** Whether Matrix-SSO-Link is enabled */
	matrixSsoLinkEnabled?: boolean;
}

/**
 * Session storage mode
 */
export type SessionStorageMode = 'memory' | 'redis';

/**
 * Session module configuration options
 */
export interface SessionModuleOptions {
	/** Mana Core Auth URL */
	authUrl?: string;
	/** Session expiry in milliseconds (default: 7 days) */
	sessionExpiryMs?: number;
	/** Custom login endpoint path */
	loginPath?: string;

	// Redis configuration (for cross-bot SSO)
	/** Storage mode: 'memory' (default) or 'redis' */
	storageMode?: SessionStorageMode;
	/** Redis host (default: localhost) */
	redisHost?: string;
	/** Redis port (default: 6379) */
	redisPort?: number;
	/** Redis password (optional) */
	redisPassword?: string;

	// Matrix-SSO-Link configuration (automatic login via Matrix OIDC)
	/** Enable Matrix-SSO-Link lookup (default: true when using Redis) */
	enableMatrixSsoLink?: boolean;
	/** Service key for internal API calls to mana-core-auth */
	serviceKey?: string;
}

export const SESSION_MODULE_OPTIONS = 'SESSION_MODULE_OPTIONS';

/**
 * Default session expiry: 7 days in milliseconds
 */
export const DEFAULT_SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
