/**
 * Access tier hierarchy — mirrored from @mana/shared-branding.
 * Kept local here to avoid pulling a Svelte-facing package into Bun servers.
 * If you add a tier, update BOTH this file and shared-branding/mana-apps.ts.
 */
export type AccessTier = 'guest' | 'public' | 'beta' | 'alpha' | 'founder';

/**
 * User data extracted from a verified JWT token.
 * Compatible with @mana/shared-nestjs-auth CurrentUserData.
 */
export interface CurrentUserData {
	userId: string;
	email: string;
	role: string;
	tier: AccessTier;
	sessionId?: string;
}

/**
 * Hono context variables set by auth middleware.
 */
export interface AuthVariables {
	userId: string;
	userEmail: string;
	userRole: string;
	userTier: AccessTier;
	sessionId?: string;
}
