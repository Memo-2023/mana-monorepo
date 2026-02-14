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

/**
 * Standard auth error message for all bots
 * Used when SSO-Link fails to authenticate the user automatically.
 * Since all users authenticate via OIDC, this indicates a technical issue.
 */
export function formatAuthErrorMessage(featureDescription: string): string {
	return (
		'⚠️ **Authentifizierung fehlgeschlagen**\n\n' +
		`Um ${featureDescription} zu nutzen, muss dein Account verknüpft sein.\n\n` +
		'Bitte logge dich in Element neu ein über "Mit Mana Core anmelden".\n\n' +
		'Falls das Problem weiterhin besteht, kontaktiere den Support.'
	);
}

/**
 * Pre-defined auth error messages for all bot types
 */
export const AUTH_ERROR_MESSAGES = {
	clock: formatAuthErrorMessage('Timer und Alarme'),
	todo: formatAuthErrorMessage('Aufgaben'),
	calendar: formatAuthErrorMessage('Termine'),
	contacts: formatAuthErrorMessage('Kontakte'),
	picture: formatAuthErrorMessage('Bilder'),
	zitare: formatAuthErrorMessage('Favoriten'),
	nutriphi: formatAuthErrorMessage('Mahlzeiten'),
	chat: formatAuthErrorMessage('Chats'),
	storage: formatAuthErrorMessage('Dateien'),
	skilltree: formatAuthErrorMessage('Skills'),
	presi: formatAuthErrorMessage('Präsentationen'),
	planta: formatAuthErrorMessage('Pflanzen'),
	manadeck: formatAuthErrorMessage('Decks'),
	questions: formatAuthErrorMessage('Fragen'),
} as const;

/**
 * @deprecated Use formatAuthErrorMessage instead. Kept for backwards compatibility.
 */
export const formatLoginRequiredMessage = (featureDescription: string, _appName: string): string =>
	formatAuthErrorMessage(featureDescription);

/**
 * @deprecated Use AUTH_ERROR_MESSAGES instead. Kept for backwards compatibility.
 */
export const LOGIN_MESSAGES = AUTH_ERROR_MESSAGES;
