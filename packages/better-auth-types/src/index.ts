/**
 * @manacore/better-auth-types
 *
 * Centralized Better Auth type definitions for the Mana Core monorepo.
 *
 * This package provides:
 * - Shared types for server and client
 * - Field definitions for client type inference
 * - Type guards and utilities
 *
 * @example Server-side (NestJS backends)
 * ```typescript
 * import type { JWTPayload, UserRole } from '@manacore/better-auth-types';
 * ```
 *
 * @example Client-side (web/mobile apps)
 * ```typescript
 * import { createAuthClient } from "better-auth/client";
 * import { inferAdditionalFields } from "better-auth/client/plugins";
 * import { userAdditionalFields } from "@manacore/better-auth-types";
 *
 * export const authClient = createAuthClient({
 *   baseURL: "http://localhost:3001",
 *   plugins: [inferAdditionalFields(userAdditionalFields)],
 * });
 * ```
 *
 * @see https://www.better-auth.com/docs/concepts/typescript
 */

// =============================================================================
// User Role Types
// =============================================================================

/**
 * User role type
 *
 * Valid roles in the Mana Core system:
 * - 'user': Standard user (default)
 * - 'admin': Administrator with elevated privileges
 * - 'service': Service account for automated systems
 */
export type UserRole = 'user' | 'admin' | 'service';

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isValidUserRole(role: unknown): role is UserRole {
	return typeof role === 'string' && ['user', 'admin', 'service'].includes(role);
}

// =============================================================================
// Organization Role Types
// =============================================================================

/**
 * Organization role type (from Better Auth organization plugin)
 */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * Type guard to check if a value is a valid OrganizationRole
 */
export function isValidOrganizationRole(role: unknown): role is OrganizationRole {
	return typeof role === 'string' && ['owner', 'admin', 'member'].includes(role);
}

/**
 * Invitation status for organization invitations
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// =============================================================================
// JWT Token Types
// =============================================================================

/**
 * JWT token payload structure
 *
 * Matches the payload defined in mana-core-auth's better-auth.config.ts
 *
 * @see services/mana-core-auth/src/auth/better-auth.config.ts
 */
export interface JWTPayload {
	/** User ID (JWT subject) */
	sub: string;

	/** User email */
	email: string;

	/** User role (user, admin, service) */
	role: string;

	/** Session ID (primary field) */
	sid: string;

	/** Session ID (alias for backward compatibility) */
	sessionId?: string;

	/** Expiration time (Unix timestamp) */
	exp?: number;

	/** Issued at time (Unix timestamp) */
	iat?: number;

	/** Issuer */
	iss?: string;

	/** Audience */
	aud?: string;
}

/**
 * Strictly typed JWT payload with UserRole instead of string
 */
export interface StrictJWTPayload extends Omit<JWTPayload, 'role'> {
	role: UserRole;
}

// =============================================================================
// User Data Types
// =============================================================================

/**
 * User data extracted from JWT token
 * Used by @manacore/shared-auth clients
 */
export interface UserData {
	id: string;
	sub: string;
	email: string;
	role: string;
}

/**
 * Strictly typed user data with UserRole instead of string
 */
export interface StrictUserData extends Omit<UserData, 'role'> {
	role: UserRole;
}

/**
 * Type helper for users with additional fields
 */
export type UserWithAdditionalFields = {
	role: string;
};

// =============================================================================
// Authentication Result Types
// =============================================================================

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

// =============================================================================
// Better Auth Client Field Definitions
// =============================================================================

/**
 * Additional field definitions for Better Auth clients
 *
 * These definitions are used by the `inferAdditionalFields` plugin
 * to provide proper TypeScript inference for custom user fields.
 *
 * IMPORTANT: Keep this in sync with the server config in
 * services/mana-core-auth/src/auth/better-auth.config.ts
 *
 * @example
 * ```typescript
 * import { createAuthClient } from "better-auth/client";
 * import { inferAdditionalFields } from "better-auth/client/plugins";
 * import { userAdditionalFields } from "@manacore/better-auth-types";
 *
 * export const authClient = createAuthClient({
 *   baseURL: "http://localhost:3001",
 *   plugins: [inferAdditionalFields(userAdditionalFields)],
 * });
 *
 * // Now user.role is properly typed!
 * const session = await authClient.getSession();
 * console.log(session?.user.role); // TypeScript knows this is string
 * ```
 */
export const userAdditionalFields = {
	user: {
		/**
		 * User role (user, admin, service)
		 *
		 * This field is read-only on the client (input: false on server).
		 * Roles can only be assigned server-side.
		 */
		role: {
			type: 'string' as const,
		},
	},
} as const;

// =============================================================================
// Organization Types
// =============================================================================

/**
 * Organization data structure
 */
export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	metadata?: Record<string, unknown> | null;
	createdAt: Date;
}

/**
 * Organization member data
 */
export interface OrganizationMember {
	id: string;
	userId: string;
	organizationId: string;
	role: OrganizationRole;
	createdAt: Date;
}

/**
 * Organization invitation data
 */
export interface OrganizationInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: OrganizationRole;
	status: InvitationStatus;
	expiresAt: Date;
	inviterId: string;
}

// =============================================================================
// NestJS Integration Types
// =============================================================================

/**
 * User data extracted from JWT for NestJS guards
 * Used by @manacore/shared-nestjs-auth
 */
export interface CurrentUserData {
	userId: string;
	email: string;
	role: string;
	sessionId?: string;
}

/**
 * Strictly typed current user data
 */
export interface StrictCurrentUserData extends Omit<CurrentUserData, 'role'> {
	role: UserRole;
}

/**
 * Convert JWT payload to CurrentUserData
 */
export function jwtPayloadToCurrentUser(payload: JWTPayload): CurrentUserData {
	return {
		userId: payload.sub,
		email: payload.email,
		role: payload.role,
		sessionId: payload.sid,
	};
}

/**
 * Convert JWT payload to strictly typed CurrentUserData (validates role)
 */
export function jwtPayloadToStrictCurrentUser(payload: JWTPayload): StrictCurrentUserData | null {
	if (!isValidUserRole(payload.role)) {
		return null;
	}
	return {
		userId: payload.sub,
		email: payload.email,
		role: payload.role,
		sessionId: payload.sid,
	};
}

// =============================================================================
// Token Validation Types
// =============================================================================

/**
 * Response from token validation endpoint
 */
export interface TokenValidationResponse {
	valid: boolean;
	payload?: JWTPayload;
	error?: string;
}

// =============================================================================
// Credit Types
// =============================================================================

/**
 * Credit balance information
 */
export interface CreditBalance {
	credits: number;
	maxCreditLimit: number;
	userId: string;
}

// =============================================================================
// B2B Types
// =============================================================================

/**
 * B2B information from JWT claims
 */
export interface B2BInfo {
	disableRevenueCat: boolean;
	organizationId?: string;
	plan?: string;
	role?: string;
}
