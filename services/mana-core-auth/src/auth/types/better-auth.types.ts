/**
 * Better Auth Type Definitions
 *
 * This file provides types for Better Auth integration.
 *
 * STRATEGY: Import base types from Better Auth packages, extend only when needed.
 *
 * From 'better-auth/types':
 * - User, Session, Account, Auth, BetterAuthOptions, etc.
 *
 * From 'better-auth/plugins/organization':
 * - Organization, Member, Invitation, OrganizationRole, InvitationStatus
 *
 * This file defines:
 * 1. Extended types (adding fields Better Auth doesn't have)
 * 2. API response/request types for our service layer
 * 3. Service-specific DTOs and result types
 * 4. Type guards for runtime safety
 *
 * @see https://www.better-auth.com/docs/concepts/typescript
 * @see https://www.better-auth.com/docs/plugins/organization
 */

// =============================================================================
// Import core types from Better Auth packages
// =============================================================================
import type { User, Session } from 'better-auth/types';
import type {
	Organization as BetterAuthOrganization,
	Member as BetterAuthMember,
	Invitation as BetterAuthInvitation,
	OrganizationRole as BetterAuthOrganizationRole,
	InvitationStatus as BetterAuthInvitationStatus,
} from 'better-auth/plugins/organization';

// Re-export base types for convenience
export type { User, Session };
export type {
	BetterAuthOrganization,
	BetterAuthMember,
	BetterAuthInvitation,
	BetterAuthOrganizationRole,
	BetterAuthInvitationStatus,
};

/**
 * Extended User type with our additional fields
 * Better Auth's User type is the base, we extend it for our app
 */
export interface BetterAuthUser extends User {
	role?: string;
}

/**
 * Extended Session type with organization support
 * Better Auth's Session type is the base, organization plugin adds activeOrganizationId
 */
export interface BetterAuthSession extends Session {
	activeOrganizationId?: string | null;
	metadata?: Record<string, unknown>;
}

/**
 * JWT Payload context passed to definePayload
 */
export interface JWTPayloadContext {
	user: BetterAuthUser;
	session: BetterAuthSession;
}

// =============================================================================
// Organization Types (aligned with Better Auth but with explicit fields)
// =============================================================================

/**
 * Organization entity - mirrors Better Auth's Organization type
 * We define explicitly to ensure type safety in our service layer
 */
export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt?: Date;
}

/**
 * Organization member - mirrors Better Auth's Member type
 */
export interface OrganizationMember {
	id: string;
	userId: string;
	organizationId: string;
	role: OrganizationRole;
	createdAt: Date;
	updatedAt?: Date;
}

/**
 * Organization role types - aligned with Better Auth defaults
 */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * Organization invitation - mirrors Better Auth's Invitation type
 */
export interface OrganizationInvitation {
	id: string;
	email: string;
	organizationId: string;
	role: OrganizationRole;
	status: 'pending' | 'accepted' | 'rejected' | 'expired';
	inviterId: string;
	expiresAt: Date;
	createdAt: Date;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Sign up response from Better Auth
 */
export interface SignUpResponse {
	user: BetterAuthUser;
	token?: string;
	session?: BetterAuthSession;
}

/**
 * Sign in response from Better Auth
 */
export interface SignInResponse {
	user: BetterAuthUser;
	token: string;
	session: BetterAuthSession;
}

/**
 * Create organization response
 */
export interface CreateOrganizationResponse extends Organization {
	// Organization fields are returned directly
}

/**
 * Invite member response
 */
export interface InviteMemberResponse {
	id: string;
	email: string;
	organizationId: string;
	role: OrganizationRole;
	status: 'pending';
	expiresAt: Date;
}

/**
 * Accept invitation response
 */
export interface AcceptInvitationResponse {
	member: OrganizationMember;
	organization: Organization;
}

/**
 * Get full organization response
 */
export interface GetFullOrganizationResponse extends Organization {
	members: Array<OrganizationMember & { user?: BetterAuthUser }>;
	invitations?: OrganizationInvitation[];
}

/**
 * Set active organization response
 */
export interface SetActiveOrganizationResponse {
	userId: string;
	activeOrganizationId: string;
	metadata?: Record<string, unknown>;
	session?: BetterAuthSession;
}

// =============================================================================
// API Request Types
// =============================================================================

/**
 * Sign up request body
 */
export interface SignUpEmailBody {
	email: string;
	password: string;
	name: string;
}

/**
 * Create organization request body
 */
export interface CreateOrganizationBody {
	name: string;
	slug: string;
	logo?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Invite member request body
 */
export interface InviteMemberBody {
	email: string;
	role: OrganizationRole;
	organizationId: string;
}

/**
 * Accept invitation request body
 */
export interface AcceptInvitationBody {
	invitationId: string;
}

/**
 * Remove member request body
 */
export interface RemoveMemberBody {
	memberIdOrEmail: string;
	organizationId: string;
}

/**
 * Set active organization request body
 */
export interface SetActiveOrganizationBody {
	organizationId: string;
}

/**
 * Get full organization query
 */
export interface GetFullOrganizationQuery {
	organizationId?: string;
	organizationSlug?: string;
	membersLimit?: number;
}

// =============================================================================
// API Method Types (with headers)
// =============================================================================

export interface AuthenticatedRequest<TBody = unknown, TQuery = unknown> {
	body?: TBody;
	query?: TQuery;
	headers: {
		authorization: string;
	};
}

// =============================================================================
// Better Auth API Interface
// =============================================================================

/**
 * Typed Better Auth API interface
 *
 * This interface describes the methods available on auth.api
 * when using the organization plugin.
 */
export interface BetterAuthAPI {
	// Core auth methods
	signUpEmail(params: { body: SignUpEmailBody }): Promise<SignUpResponse>;
	signInEmail(params: { body: { email: string; password: string } }): Promise<SignInResponse>;

	// Organization methods
	createOrganization(
		params: AuthenticatedRequest<CreateOrganizationBody>
	): Promise<CreateOrganizationResponse>;

	inviteMember(params: AuthenticatedRequest<InviteMemberBody>): Promise<InviteMemberResponse>;

	acceptInvitation(
		params: AuthenticatedRequest<AcceptInvitationBody>
	): Promise<AcceptInvitationResponse>;

	getFullOrganization(params: {
		query: GetFullOrganizationQuery;
	}): Promise<GetFullOrganizationResponse>;

	removeMember(params: AuthenticatedRequest<RemoveMemberBody>): Promise<{ success: boolean }>;

	setActiveOrganization(
		params: AuthenticatedRequest<SetActiveOrganizationBody>
	): Promise<SetActiveOrganizationResponse>;

	listOrganizations(params: AuthenticatedRequest): Promise<Organization[]>;
}

// =============================================================================
// Service Response Types
// =============================================================================

/**
 * B2C Registration result
 */
export interface RegisterB2CResult {
	user: {
		id: string;
		email: string;
		name: string | null;
	};
	token?: string;
}

/**
 * B2B Registration result
 */
export interface RegisterB2BResult {
	user: BetterAuthUser;
	organization: Organization;
	token: string;
}

/**
 * Invite employee result
 */
export interface InviteEmployeeResult {
	id: string;
	email: string;
	organizationId: string;
	role: OrganizationRole;
	status: 'pending';
	expiresAt: Date;
}

/**
 * Accept invitation result
 */
export interface AcceptInvitationResult {
	member: OrganizationMember;
	organization?: Organization;
	userId?: string;
}

/**
 * Remove member result
 */
export interface RemoveMemberResult {
	success: boolean;
	message: string;
}

/**
 * Set active organization result
 * Returns session data with the active organization ID
 */
export interface SetActiveOrganizationResult {
	userId: string;
	activeOrganizationId: string;
	metadata?: Record<string, unknown>;
	session?: BetterAuthSession;
}

// =============================================================================
// DTO Types (for NestJS controllers)
// =============================================================================

/**
 * DTO for B2C user registration
 */
export interface RegisterB2CDto {
	email: string;
	password: string;
	name: string;
	referralCode?: string;
	sourceAppId?: string;
}

/**
 * DTO for B2B organization registration
 */
export interface RegisterB2BDto {
	ownerEmail: string;
	password: string;
	ownerName: string;
	organizationName: string;
}

/**
 * DTO for employee invitation
 */
export interface InviteEmployeeDto {
	organizationId: string;
	employeeEmail: string;
	role: 'admin' | 'member';
	inviterToken: string;
}

/**
 * DTO for accepting invitation
 */
export interface AcceptInvitationDto {
	invitationId: string;
	userToken: string;
}

/**
 * DTO for removing organization member
 */
export interface RemoveMemberDto {
	organizationId: string;
	memberId: string;
	removerToken: string;
}

/**
 * DTO for setting active organization
 */
export interface SetActiveOrganizationDto {
	organizationId: string;
	userToken: string;
}

/**
 * DTO for user sign in
 */
export interface SignInDto {
	email: string;
	password: string;
	deviceId?: string;
	deviceName?: string;
}

/**
 * Sign in result
 */
export interface SignInResult {
	user: {
		id: string;
		email: string;
		name: string | null;
		role?: string;
	};
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

/**
 * DTO for sign out
 */
export interface SignOutDto {
	token: string;
}

/**
 * Sign out result
 */
export interface SignOutResult {
	success: boolean;
	message: string;
}

/**
 * Get session result
 */
export interface GetSessionResult {
	user: BetterAuthUser;
	session: BetterAuthSession;
}

/**
 * List user organizations result
 */
export interface ListOrganizationsResult {
	organizations: Organization[];
}

/**
 * DTO for refresh token
 */
export interface RefreshTokenDto {
	refreshToken: string;
}

/**
 * Refresh token result
 */
export interface RefreshTokenResult {
	user: {
		id: string;
		email: string;
		name: string | null;
		role?: string;
	};
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	tokenType: string;
}

/**
 * DTO for token validation
 */
export interface ValidateTokenDto {
	token: string;
}

/**
 * Token payload structure (JWT claims)
 */
export interface TokenPayload {
	sub: string;
	email: string;
	role: string;
	sessionId: string;
	deviceId?: string;
	organizationId?: string;
	iat?: number;
	exp?: number;
	iss?: string;
	aud?: string | string[];
}

/**
 * Validate token result
 */
export interface ValidateTokenResult {
	valid: boolean;
	payload?: TokenPayload;
	error?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if response has user property
 */
export function hasUser(response: unknown): response is { user: BetterAuthUser } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'user' in response &&
		typeof (response as { user: unknown }).user === 'object'
	);
}

/**
 * Type guard to check if response has token property
 */
export function hasToken(response: unknown): response is { token: string } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'token' in response &&
		typeof (response as { token: unknown }).token === 'string'
	);
}

/**
 * Type guard to check if response has member property
 */
export function hasMember(response: unknown): response is { member: OrganizationMember } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'member' in response &&
		typeof (response as { member: unknown }).member === 'object'
	);
}

/**
 * Type guard to check if response has members array
 */
export function hasMembers(response: unknown): response is { members: OrganizationMember[] } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'members' in response &&
		Array.isArray((response as { members: unknown }).members)
	);
}

/**
 * Type guard to check if response has session property
 */
export function hasSession(
	response: unknown
): response is { user: BetterAuthUser; session: BetterAuthSession } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'user' in response &&
		'session' in response &&
		typeof (response as { user: unknown }).user === 'object' &&
		typeof (response as { session: unknown }).session === 'object'
	);
}
