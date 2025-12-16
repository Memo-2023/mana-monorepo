/**
 * NestJS Auth Types
 *
 * Re-exports centralized types from @manacore/better-auth-types
 * plus NestJS-specific configuration interfaces.
 */

// Re-export centralized types
export type {
	CurrentUserData,
	StrictCurrentUserData,
	JWTPayload,
	StrictJWTPayload,
	UserRole,
	OrganizationRole,
	TokenValidationResponse,
} from '@manacore/better-auth-types';

export {
	isValidUserRole,
	isValidOrganizationRole,
	jwtPayloadToCurrentUser,
	jwtPayloadToStrictCurrentUser,
} from '@manacore/better-auth-types';

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
