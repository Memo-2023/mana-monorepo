/**
 * User data extracted from JWT token
 */
export interface CurrentUserData {
	userId: string;
	email: string;
	role: string;
	sessionId?: string;
}

/**
 * Configuration for the auth module
 */
export interface AuthModuleConfig {
	/** URL of the Mana Core Auth service (default: http://localhost:3001) */
	authServiceUrl?: string;
	/** Whether to bypass auth in development mode (default: false) */
	devBypassAuth?: boolean;
	/** Test user ID for development mode */
	devUserId?: string;
}

/**
 * Response from token validation endpoint
 */
export interface TokenValidationResponse {
	valid: boolean;
	payload?: {
		sub: string;
		email: string;
		role: string;
		sessionId?: string;
		sid?: string;
		iat?: number;
		exp?: number;
		iss?: string;
		aud?: string;
	};
	error?: string;
}
