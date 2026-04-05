/**
 * User data extracted from a verified JWT token.
 * Compatible with @mana/shared-nestjs-auth CurrentUserData.
 */
export interface CurrentUserData {
	userId: string;
	email: string;
	role: string;
	sessionId?: string;
}

/**
 * Hono context variables set by auth middleware.
 */
export interface AuthVariables {
	userId: string;
	userEmail: string;
	userRole: string;
	sessionId?: string;
}
