/**
 * Better Auth Service
 *
 * NestJS service that wraps Better Auth functionality for:
 * - B2C user registration
 * - B2B organization registration
 * - Organization member management
 * - Employee invitations
 *
 * This service uses Better Auth's organization plugin for all B2B operations,
 * eliminating the need to build custom organization management.
 *
 * @see BETTER_AUTH_FINAL_PLAN.md
 */

import {
	Injectable,
	ConflictException,
	NotFoundException,
	ForbiddenException,
	UnauthorizedException,
	Inject,
	forwardRef,
	Optional,
} from '@nestjs/common';
import { LoggerService } from '../../common/logger';
import { ConfigService } from '@nestjs/config';
import { createBetterAuth } from '../better-auth.config';
import type { BetterAuthInstance } from '../better-auth.config';
import { getDb } from '../../db/connection';
import { balances, organizationBalances } from '../../db/schema/credits.schema';
import { ReferralCodeService } from '../../referrals/services/referral-code.service';
import { ReferralTierService } from '../../referrals/services/referral-tier.service';
import { ReferralTrackingService } from '../../referrals/services/referral-tracking.service';
import { hasUser, hasToken, hasMember, hasMembers, hasSession } from '../types/better-auth.types';
import { sourceAppStore } from '../stores/source-app.store';
import { passwordResetRedirectStore } from '../stores/password-reset-redirect.store';
import type {
	RegisterB2CDto,
	RegisterB2BDto,
	InviteEmployeeDto,
	AcceptInvitationDto,
	RemoveMemberDto,
	SetActiveOrganizationDto,
	SignInDto,
	RegisterB2CResult,
	RegisterB2BResult,
	InviteEmployeeResult,
	AcceptInvitationResult,
	RemoveMemberResult,
	SetActiveOrganizationResult,
	SignInResult,
	SignOutResult,
	GetSessionResult,
	ListOrganizationsResult,
	RefreshTokenResult,
	ValidateTokenResult,
	TokenPayload,
	OrganizationMember,
	Organization,
	BetterAuthAPI,
	SignUpResponse,
	SignInResponse,
	CreateOrganizationResponse,
	BetterAuthUser,
	BetterAuthSession,
} from '../types/better-auth.types';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import * as jwt from 'jsonwebtoken';

// Re-export DTOs and result types for external use
export type {
	RegisterB2CDto,
	RegisterB2BDto,
	InviteEmployeeDto,
	AcceptInvitationDto,
	RemoveMemberDto,
	SetActiveOrganizationDto,
	SignInDto,
	SignInResult,
	SignOutResult,
	GetSessionResult,
	ListOrganizationsResult,
	RefreshTokenResult,
	ValidateTokenResult,
	TokenPayload,
};

@Injectable()
export class BetterAuthService {
	private auth: BetterAuthInstance;
	private databaseUrl: string;
	private readonly logger: LoggerService;

	/**
	 * Typed accessor for organization plugin API methods
	 * Better Auth's organization plugin adds methods dynamically, so we provide
	 * a typed accessor to avoid casting throughout the service.
	 */
	private get orgApi(): BetterAuthAPI {
		return this.auth.api as unknown as BetterAuthAPI;
	}

	/**
	 * Get the Better Auth handler for processing requests
	 * Used by controllers that need to forward requests to Better Auth
	 */
	getHandler() {
		return this.auth.handler;
	}

	constructor(
		private configService: ConfigService,
		@Optional()
		@Inject(forwardRef(() => ReferralCodeService))
		private referralCodeService: ReferralCodeService,
		@Optional()
		@Inject(forwardRef(() => ReferralTierService))
		private referralTierService: ReferralTierService,
		@Optional()
		@Inject(forwardRef(() => ReferralTrackingService))
		private referralTrackingService: ReferralTrackingService,
		loggerService: LoggerService
	) {
		this.logger = loggerService.setContext('BetterAuthService');
		this.databaseUrl = this.configService.get<string>('database.url')!;
		this.auth = createBetterAuth(this.databaseUrl);
	}

	/**
	 * Register a B2C user (individual)
	 *
	 * Creates a new user account with email/password and initializes their
	 * personal credit balance.
	 *
	 * @param dto - Registration data
	 * @returns User data and session
	 * @throws ConflictException if email already exists
	 */
	async registerB2C(dto: RegisterB2CDto): Promise<RegisterB2CResult> {
		try {
			// Store source app URL before registration (for email verification redirect)
			if (dto.sourceAppUrl) {
				sourceAppStore.set(dto.email, dto.sourceAppUrl);
			}

			// Create user via Better Auth
			const result = await this.auth.api.signUpEmail({
				body: {
					email: dto.email,
					password: dto.password,
					name: dto.name,
				},
			});

			// Use type guards for safe access
			if (!hasUser(result)) {
				throw new Error('Invalid response from Better Auth: missing user');
			}

			const { user } = result;

			// Create personal credit balance
			await this.createPersonalCreditBalance(user.id);

			// Initialize referral system for new user
			await this.initializeUserReferrals(user.id, dto.referralCode, dto.sourceAppId);

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
				},
				token: hasToken(result) ? result.token : undefined,
			};
		} catch (error: unknown) {
			if (error instanceof Error && error.message?.includes('already exists')) {
				throw new ConflictException('User with this email already exists');
			}
			throw error;
		}
	}

	/**
	 * Register a B2B organization (company)
	 *
	 * Creates:
	 * 1. Owner user account
	 * 2. Organization (via Better Auth organization plugin)
	 * 3. Automatic owner membership (Better Auth handles this)
	 * 4. Organization credit balance
	 *
	 * @param dto - Organization registration data
	 * @returns User, organization, and session data
	 * @throws ConflictException if owner email already exists
	 */
	async registerB2B(dto: RegisterB2BDto): Promise<RegisterB2BResult> {
		try {
			// Step 1: Create owner user account
			const userResult = await this.auth.api.signUpEmail({
				body: {
					email: dto.ownerEmail,
					password: dto.password,
					name: dto.ownerName,
				},
			});

			// Use type guards for safe access
			if (!hasUser(userResult)) {
				throw new Error('Invalid response from Better Auth: missing user');
			}

			const { user } = userResult;
			const ownerId = user.id;
			const sessionToken = hasToken(userResult) ? userResult.token : '';

			// Step 2: Create organization (Better Auth handles owner membership automatically)
			// Note: createOrganization is typed via BetterAuthAPI but we need to cast for org plugin methods
			const orgResult = (await this.auth.api.createOrganization({
				body: {
					name: dto.organizationName,
					slug: this.slugify(dto.organizationName),
				},
				headers: {
					authorization: `Bearer ${sessionToken}`,
				},
			})) as CreateOrganizationResponse;

			const organizationId = orgResult.id;

			// Step 3: Create organization credit balance
			await this.createOrganizationCreditBalance(organizationId);

			// Step 4: Create owner's personal balance (for when they use credits)
			await this.createPersonalCreditBalance(ownerId);

			return {
				user,
				organization: orgResult,
				token: sessionToken,
			};
		} catch (error: unknown) {
			if (error instanceof Error && error.message?.includes('already exists')) {
				throw new ConflictException('Owner email already exists');
			}
			throw error;
		}
	}

	/**
	 * Invite employee to organization
	 *
	 * Uses Better Auth organization plugin to:
	 * 1. Validate inviter has permission (owner/admin)
	 * 2. Create invitation record
	 * 3. Send invitation email
	 *
	 * @param dto - Invitation data
	 * @returns Invitation record
	 * @throws ForbiddenException if inviter lacks permission
	 */
	async inviteEmployee(dto: InviteEmployeeDto): Promise<InviteEmployeeResult> {
		try {
			// Better Auth organization plugin uses auth.api.inviteMember
			// See: https://www.better-auth.com/docs/plugins/organization
			const result = await this.orgApi.inviteMember({
				body: {
					email: dto.employeeEmail,
					role: dto.role,
					organizationId: dto.organizationId,
				},
				headers: {
					authorization: `Bearer ${dto.inviterToken}`,
				},
			});

			return result;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('You do not have permission to invite members');
				}
			}
			throw error;
		}
	}

	/**
	 * Accept organization invitation
	 *
	 * When a user accepts an invitation, Better Auth:
	 * 1. Adds user to organization as member
	 * 2. Sets the role from invitation
	 * 3. Marks invitation as accepted
	 *
	 * After acceptance, we create the user's personal balance for tracking
	 * their allocated credits from the organization.
	 *
	 * @param dto - Acceptance data
	 * @returns Membership data
	 * @throws NotFoundException if invitation not found or expired
	 */
	async acceptInvitation(dto: AcceptInvitationDto): Promise<AcceptInvitationResult> {
		try {
			// Better Auth organization plugin uses auth.api.acceptInvitation
			// See: https://www.better-auth.com/docs/plugins/organization
			const result = await this.orgApi.acceptInvitation({
				body: { invitationId: dto.invitationId },
				headers: {
					authorization: `Bearer ${dto.userToken}`,
				},
			});

			// Extract user ID from the result to create their personal balance
			// Use type guard for safe access
			const userId = hasMember(result) ? result.member.userId : undefined;
			if (userId) {
				await this.createPersonalCreditBalance(userId);
			}

			return result;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found') || error.message?.includes('expired')) {
					throw new NotFoundException('Invitation not found or expired');
				}
			}
			throw error;
		}
	}

	/**
	 * Get organization members
	 *
	 * Lists all members of an organization with their roles.
	 * Uses getFullOrganization which returns org details with members.
	 *
	 * @param organizationId - Organization ID
	 * @returns List of members
	 */
	async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
		try {
			// Better Auth uses getFullOrganization to get org with members
			// See: https://www.better-auth.com/docs/plugins/organization
			const result = await this.orgApi.getFullOrganization({
				query: { organizationId },
			});

			// Use type guard for safe access
			return hasMembers(result) ? result.members : [];
		} catch (error) {
			this.logger.error(
				'Failed to fetch organization members',
				error instanceof Error ? error.stack : undefined
			);
			return [];
		}
	}

	/**
	 * Remove member from organization
	 *
	 * Uses Better Auth to:
	 * 1. Validate remover has permission (owner/admin)
	 * 2. Remove member from organization
	 * 3. Clean up member's access
	 *
	 * @param dto - Remove member data
	 * @returns Success status
	 * @throws ForbiddenException if remover lacks permission
	 */
	async removeMember(dto: RemoveMemberDto): Promise<RemoveMemberResult> {
		try {
			// Better Auth organization plugin uses auth.api.removeMember
			// Accepts memberIdOrEmail parameter
			// See: https://www.better-auth.com/docs/plugins/organization
			await this.orgApi.removeMember({
				body: {
					memberIdOrEmail: dto.memberId,
					organizationId: dto.organizationId,
				},
				headers: {
					authorization: `Bearer ${dto.removerToken}`,
				},
			});

			return { success: true, message: 'Member removed successfully' };
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('You do not have permission to remove members');
				}
			}
			throw error;
		}
	}

	/**
	 * Set active organization for user
	 *
	 * For users who belong to multiple organizations, this switches
	 * the active organization context. The active organization is used
	 * for JWT claims and credit balance calculations.
	 *
	 * @param dto - Active organization data
	 * @returns Updated session data
	 */
	async setActiveOrganization(dto: SetActiveOrganizationDto): Promise<SetActiveOrganizationResult> {
		try {
			// Better Auth organization plugin uses auth.api.setActiveOrganization
			// See: https://www.better-auth.com/docs/plugins/organization
			const result = await this.orgApi.setActiveOrganization({
				body: { organizationId: dto.organizationId },
				headers: {
					authorization: `Bearer ${dto.userToken}`,
				},
			});

			return result;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found') || error.message?.includes('not a member')) {
					throw new NotFoundException('Organization not found or you are not a member');
				}
			}
			throw error;
		}
	}

	// =========================================================================
	// Authentication Methods (Sign In / Sign Out / Session)
	// =========================================================================

	/**
	 * Sign in user with email and password
	 *
	 * Authenticates a user and returns their session with JWT token.
	 *
	 * @param dto - Sign in credentials
	 * @returns User data and authentication token
	 * @throws UnauthorizedException if credentials are invalid
	 */
	async signIn(dto: SignInDto): Promise<SignInResult> {
		try {
			const result = await this.auth.api.signInEmail({
				body: {
					email: dto.email,
					password: dto.password,
				},
			});

			if (!hasUser(result)) {
				throw new UnauthorizedException('Invalid credentials');
			}

			const { user } = result;

			// Get session token (used as refresh token)
			const session = hasSession(result) ? result.session : null;
			const sessionToken = session?.token || (hasToken(result) ? result.token : '');

			// Generate JWT access token using Better Auth's JWT plugin
			let accessToken = '';
			try {
				const api = this.auth.api as any;

				// Use Better Auth's signJWT with the jwks table
				const jwtResult = await api.signJWT({
					body: {
						payload: {
							sub: user.id,
							email: user.email,
							role: (user as BetterAuthUser).role || 'user',
							sid: session?.id || '',
						},
					},
				});

				accessToken = jwtResult?.token || '';

				// Fallback to manual JWT if Better Auth fails
				if (!accessToken) {
					throw new Error('Better Auth signJWT returned empty token');
				}
			} catch (jwtError) {
				this.logger.warn('Better Auth signJWT failed, using session token as fallback', {
					error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
				});

				// Fallback: Use session token (Better Auth manages JWT signing via JWKS)
				// NOTE: If signJWT fails repeatedly, check that the auth.jwks table has valid EdDSA keys
				accessToken = sessionToken;
			}

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: (user as BetterAuthUser).role,
				},
				accessToken,
				refreshToken: sessionToken,
				expiresIn: 15 * 60, // 15 minutes in seconds
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (
					error.message?.includes('invalid') ||
					error.message?.includes('credentials') ||
					error.message?.includes('not found')
				) {
					throw new UnauthorizedException('Invalid email or password');
				}
			}
			throw error;
		}
	}

	/**
	 * Sign out user
	 *
	 * Invalidates the user's session.
	 *
	 * @param token - User's authentication token
	 * @returns Success status
	 */
	async signOut(token: string): Promise<SignOutResult> {
		try {
			// Better Auth uses auth.api.signOut
			await (this.auth.api as any).signOut({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			return { success: true, message: 'Signed out successfully' };
		} catch (error: unknown) {
			// Even if signOut fails, we treat it as success for the user
			// The session will expire naturally
			this.logger.warn('Sign out error (session will expire naturally)', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return { success: true, message: 'Signed out successfully' };
		}
	}

	/**
	 * Get current session
	 *
	 * Retrieves the current user's session data.
	 *
	 * @param token - User's authentication token
	 * @returns User and session data
	 * @throws UnauthorizedException if session is invalid
	 */
	async getSession(token: string): Promise<GetSessionResult> {
		try {
			// Better Auth uses auth.api.getSession
			const result = await (this.auth.api as any).getSession({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			if (!hasSession(result)) {
				throw new UnauthorizedException('Invalid or expired session');
			}

			return {
				user: result.user,
				session: result.session,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (
					error.message?.includes('invalid') ||
					error.message?.includes('expired') ||
					error.message?.includes('not found')
				) {
					throw new UnauthorizedException('Invalid or expired session');
				}
			}
			throw error;
		}
	}

	/**
	 * List user's organizations
	 *
	 * Returns all organizations the user is a member of.
	 *
	 * @param token - User's authentication token
	 * @returns List of organizations
	 */
	async listOrganizations(token: string): Promise<ListOrganizationsResult> {
		try {
			const result = await this.orgApi.listOrganizations({
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			// Result is an array of organizations
			const organizations = Array.isArray(result) ? result : [];

			return { organizations };
		} catch (error: unknown) {
			this.logger.error(
				'Failed to list organizations',
				error instanceof Error ? error.stack : undefined
			);
			return { organizations: [] };
		}
	}

	/**
	 * Get organization by ID
	 *
	 * Returns the full organization details including members.
	 *
	 * @param organizationId - Organization ID
	 * @param token - User's authentication token (optional for public orgs)
	 * @returns Organization with members
	 * @throws NotFoundException if organization not found
	 */
	async getOrganization(
		organizationId: string,
		token?: string
	): Promise<Organization & { members?: OrganizationMember[] }> {
		try {
			const result = await this.orgApi.getFullOrganization({
				query: { organizationId },
				...(token && {
					headers: {
						authorization: `Bearer ${token}`,
					},
				}),
			} as any);

			if (!result || !result.id) {
				throw new NotFoundException('Organization not found');
			}

			return {
				id: result.id,
				name: result.name,
				slug: result.slug,
				logo: result.logo,
				metadata: result.metadata,
				createdAt: result.createdAt,
				members: hasMembers(result) ? result.members : undefined,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Organization not found');
				}
			}
			throw error;
		}
	}

	// =========================================================================
	// Token Management Methods
	// =========================================================================

	/**
	 * Refresh access token
	 *
	 * Validates the refresh token and issues new access/refresh tokens.
	 * Implements refresh token rotation for security.
	 *
	 * @param refreshToken - The refresh token to validate
	 * @returns New access token, refresh token, and user data
	 * @throws UnauthorizedException if refresh token is invalid or expired
	 */
	async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
		const db = getDb(this.databaseUrl);

		try {
			// Import sessions schema for refresh token lookup
			const { sessions } = await import('../../db/schema');
			const { users } = await import('../../db/schema');
			const { eq, and, isNull } = await import('drizzle-orm');
			const { nanoid } = await import('nanoid');
			const { randomUUID } = await import('crypto');

			// Find session by refresh token
			const [session] = await db
				.select()
				.from(sessions)
				.where(and(eq(sessions.refreshToken, refreshToken), isNull(sessions.revokedAt)))
				.limit(1);

			if (!session) {
				throw new UnauthorizedException('Invalid refresh token');
			}

			// Check if refresh token is expired
			if (!session.refreshTokenExpiresAt || new Date() > session.refreshTokenExpiresAt) {
				throw new UnauthorizedException('Refresh token expired');
			}

			// Get user
			const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

			if (!user || user.deletedAt) {
				throw new UnauthorizedException('User not found');
			}

			// Revoke old session (refresh token rotation)
			await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

			// Generate new session with sliding window expiration
			const sessionId = randomUUID();
			const newRefreshToken = nanoid(64);

			// Sliding window: Extend from NOW, preserving rememberMe preference
			// This allows active users to stay signed in indefinitely
			const wasRememberMe = session.rememberMe ?? false;
			const extensionDays = wasRememberMe ? 30 : 7;
			const refreshTokenExpiresAt = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000);
			const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

			await db.insert(sessions).values({
				id: sessionId,
				userId: user.id,
				token: sessionId,
				refreshToken: newRefreshToken,
				refreshTokenExpiresAt, // Extends with each refresh (sliding window)
				ipAddress: session.ipAddress,
				userAgent: session.userAgent,
				deviceId: session.deviceId,
				deviceName: session.deviceName,
				expiresAt: accessTokenExpiresAt,
				rememberMe: wasRememberMe, // Preserve remember me flag
			});

			// Generate new JWT
			const privateKey = this.configService.get<string>('jwt.privateKey');
			if (!privateKey) {
				throw new Error('JWT private key not configured');
			}

			const accessTokenExpiry = this.configService.get<string>('jwt.accessTokenExpiry') || '15m';
			const issuer = this.configService.get<string>('jwt.issuer');
			const audience = this.configService.get<string>('jwt.audience');

			const tokenPayload: Record<string, unknown> = {
				sub: user.id,
				email: user.email,
				role: user.role,
				sessionId,
				...(session.deviceId && { deviceId: session.deviceId }),
			};

			const accessToken = jwt.sign(tokenPayload, privateKey, {
				algorithm: 'RS256' as const,
				expiresIn: accessTokenExpiry as jwt.SignOptions['expiresIn'],
				...(issuer && { issuer }),
				...(audience && { audience }),
			});

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
				accessToken,
				refreshToken: newRefreshToken,
				expiresIn: 15 * 60, // 15 minutes in seconds
				tokenType: 'Bearer',
			};
		} catch (error: unknown) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			if (error instanceof Error) {
				if (
					error.message?.includes('invalid') ||
					error.message?.includes('expired') ||
					error.message?.includes('not found')
				) {
					throw new UnauthorizedException('Invalid or expired refresh token');
				}
			}
			throw error;
		}
	}

	/**
	 * Validate a JWT token
	 *
	 * Verifies the token signature and expiration.
	 * Returns the decoded payload if valid.
	 *
	 * @param token - The JWT token to validate
	 * @returns Validation result with payload or error
	 */
	async validateToken(token: string): Promise<ValidateTokenResult> {
		try {
			// Decode to check the algorithm
			const decoded = jwt.decode(token, { complete: true });

			// Use our JWKS endpoint (NestJS prefix: /api/v1)
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const jwksUrl = new URL('/api/v1/auth/jwks', baseUrl);

			// Create JWKS fetcher
			const JWKS = createRemoteJWKSet(jwksUrl);

			// Get issuer/audience from config (Better Auth uses BASE_URL by default)
			const issuer = this.configService.get<string>('jwt.issuer') || baseUrl;
			const audience = this.configService.get<string>('jwt.audience') || baseUrl;

			// Verify using jose library with Better Auth's JWKS
			const { payload } = await jwtVerify(token, JWKS, {
				issuer,
				audience,
			});

			this.logger.debug('Token validation successful', { userId: payload.sub });

			return {
				valid: true,
				payload: payload as unknown as TokenPayload,
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.logger.warn('Token validation failed', { error: errorMessage });
			return {
				valid: false,
				error: errorMessage,
			};
		}
	}

	// =========================================================================
	// Password Reset Methods
	// =========================================================================

	/**
	 * Request password reset
	 *
	 * Sends a password reset email to the user.
	 * Uses Better Auth's forgetPassword API.
	 *
	 * @param email - User's email address
	 * @param redirectTo - Optional URL to redirect after reset (used in email link)
	 * @returns Success status
	 */
	async requestPasswordReset(
		email: string,
		redirectTo?: string
	): Promise<{ success: boolean; message: string }> {
		try {
			// Store the redirect URL so sendResetPassword callback can include it in the email link
			if (redirectTo) {
				passwordResetRedirectStore.set(email, redirectTo);
			}

			// Better Auth's requestPasswordReset endpoint
			// See: https://www.better-auth.com/docs/authentication/email-password#password-reset
			await (this.auth.api as any).requestPasswordReset({
				body: {
					email,
					redirectTo,
				},
				headers: new Headers(),
			});

			// Always return success to prevent email enumeration
			return {
				success: true,
				message: 'If an account with that email exists, a password reset link has been sent',
			};
		} catch (error) {
			this.logger.error(
				'Password reset request failed',
				error instanceof Error ? error.stack : undefined
			);
			// Always return success to prevent email enumeration attacks
			return {
				success: true,
				message: 'If an account with that email exists, a password reset link has been sent',
			};
		}
	}

	/**
	 * Reset password with token
	 *
	 * Resets the user's password using the token from the reset email.
	 * Uses Better Auth's resetPassword API.
	 *
	 * @param token - Reset token from email link
	 * @param newPassword - New password to set
	 * @returns Success status
	 * @throws UnauthorizedException if token is invalid or expired
	 */
	async resetPassword(
		token: string,
		newPassword: string
	): Promise<{ success: boolean; message: string }> {
		try {
			// Better Auth's resetPassword method
			// See: https://www.better-auth.com/docs/authentication/email-password#password-reset
			await (this.auth.api as any).resetPassword({
				body: {
					token,
					newPassword,
				},
			});

			return {
				success: true,
				message: 'Password has been reset successfully',
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (
					error.message?.includes('invalid') ||
					error.message?.includes('expired') ||
					error.message?.includes('not found')
				) {
					throw new UnauthorizedException('Invalid or expired reset token');
				}
			}
			throw error;
		}
	}

	/**
	 * Verify email with token
	 *
	 * Verifies the user's email using the token from the verification email.
	 * Uses Better Auth's verifyEmail API.
	 *
	 * @param token - Verification token from email link
	 * @returns Success status and user email
	 */
	async verifyEmail(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
		try {
			// Better Auth's verifyEmail method
			// See: https://www.better-auth.com/docs/authentication/email-verification
			const api = this.auth.api as any;

			const result = await api.verifyEmail({
				query: { token },
			});

			// Extract email from result if available
			const email = result?.user?.email || result?.email;
			this.logger.debug('Email verification successful', { email });

			return {
				success: true,
				email,
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.logger.warn('Email verification failed', { error: errorMessage });

			if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
				return {
					success: false,
					error: 'invalid_or_expired_token',
				};
			}

			return {
				success: false,
				error: 'verification_failed',
			};
		}
	}

	/**
	 * Resend verification email
	 *
	 * Sends a new verification email to the user.
	 * Uses Better Auth's sendVerificationEmail API.
	 *
	 * @param email - User's email address
	 * @param sourceAppUrl - Optional URL to redirect after verification
	 * @returns Success status (always returns success to prevent email enumeration)
	 */
	async resendVerificationEmail(
		email: string,
		sourceAppUrl?: string
	): Promise<{ success: boolean; message: string }> {
		try {
			// Store source app URL for email verification redirect
			if (sourceAppUrl) {
				sourceAppStore.set(email, sourceAppUrl);
			}

			// Better Auth's sendVerificationEmail method
			// See: https://www.better-auth.com/docs/authentication/email-verification
			const api = this.auth.api as any;

			await api.sendVerificationEmail({
				body: { email },
			});

			// Always return success to prevent email enumeration
			return {
				success: true,
				message: 'If an account with that email exists, a verification email has been sent',
			};
		} catch (error) {
			this.logger.error(
				'Resend verification email failed',
				error instanceof Error ? error.stack : undefined
			);
			// Always return success to prevent email enumeration attacks
			return {
				success: true,
				message: 'If an account with that email exists, a verification email has been sent',
			};
		}
	}

	/**
	 * Get JWKS (JSON Web Key Set)
	 *
	 * Returns public keys for JWT verification.
	 * Proxies to Better Auth's internal JWKS.
	 *
	 * @returns JWKS with public keys
	 */
	async getJwks(): Promise<{ keys: unknown[] }> {
		try {
			// Better Auth exposes JWKS via auth.api
			const api = this.auth.api as any;

			// Try to get JWKS from Better Auth
			if (api.getJwks) {
				const result = await api.getJwks();
				return result;
			}

			// Fallback: read from jwks table directly
			const db = getDb(this.databaseUrl);
			const { jwks } = await import('../../db/schema/auth.schema');
			const keys = await db.select().from(jwks);

			// Convert to JWKS format (EdDSA public keys)
			return {
				keys: keys.map((key) => {
					try {
						return JSON.parse(key.publicKey);
					} catch {
						return { kid: key.id, publicKey: key.publicKey };
					}
				}),
			};
		} catch (error) {
			this.logger.error('Failed to get JWKS', error instanceof Error ? error.stack : undefined);
			return { keys: [] };
		}
	}

	// =========================================================================
	// Source App URL Methods
	// =========================================================================

	/**
	 * Get and remove source app URL for an email
	 *
	 * Used after email verification to redirect user to the correct app.
	 * The entry is deleted after retrieval to prevent re-use.
	 *
	 * @param email - User's email address
	 * @returns Source app URL or null if not found
	 */
	getSourceAppUrl(email: string): string | null {
		return sourceAppStore.getAndDelete(email);
	}

	// =========================================================================
	// Private Helper Methods
	// =========================================================================

	/**
	 * Create personal credit balance for user
	 *
	 * Initializes a user's credit balance with:
	 * - 0 purchased credits
	 * - 150 free signup credits
	 * - 5 daily free credits
	 *
	 * @param userId - User ID
	 * @private
	 */
	private async createPersonalCreditBalance(userId: string) {
		const db = getDb(this.databaseUrl);

		try {
			await db.insert(balances).values({
				userId: userId as any, // Cast to handle UUID type
				balance: 0,
				freeCreditsRemaining: 150, // Signup bonus
				dailyFreeCredits: 5,
				totalEarned: 0,
				totalSpent: 0,
			});
		} catch (error) {
			this.logger.warn('Failed to create personal credit balance (non-critical)', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			// Don't throw - this is a non-critical operation
		}
	}

	/**
	 * Create organization credit balance
	 *
	 * Initializes an organization's credit pool with:
	 * - 0 purchased credits
	 * - 0 allocated credits
	 * - 0 available credits
	 *
	 * The organization owner must purchase credits before allocating to employees.
	 *
	 * @param organizationId - Organization ID
	 * @private
	 */
	private async createOrganizationCreditBalance(organizationId: string) {
		const db = getDb(this.databaseUrl);

		try {
			await db.insert(organizationBalances).values({
				organizationId,
				balance: 0,
				allocatedCredits: 0,
				availableCredits: 0,
				totalPurchased: 0,
				totalAllocated: 0,
			});
		} catch (error) {
			this.logger.warn('Failed to create organization credit balance (non-critical)', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			// Don't throw - this is a non-critical operation
		}
	}

	/**
	 * Helper function to create URL-safe slugs
	 *
	 * Converts organization name to lowercase, URL-safe slug.
	 * Example: "Acme Corporation" -> "acme-corporation"
	 *
	 * @param text - Text to slugify
	 * @returns URL-safe slug
	 * @private
	 */
	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '') // Remove special characters
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/--+/g, '-') // Replace multiple hyphens with single
			.trim();
	}

	/**
	 * Initialize referral system for a new user
	 *
	 * This method:
	 * 1. Creates an automatic referral code for the new user
	 * 2. Initializes the user's tier (bronze)
	 * 3. If a referral code was used, applies the referral relationship
	 *
	 * @param userId - The new user's ID
	 * @param referralCode - Optional referral code used during signup
	 * @param sourceAppId - Optional app ID where the user registered
	 * @private
	 */
	private async initializeUserReferrals(
		userId: string,
		referralCode?: string,
		sourceAppId?: string
	): Promise<void> {
		// Skip if referral services are not available
		if (!this.referralCodeService || !this.referralTierService) {
			return;
		}

		try {
			// 1. Create automatic referral code for the new user
			await this.referralCodeService.createAutoCode(userId);

			// 2. Initialize user's tier (starts at bronze)
			await this.referralTierService.initializeUserTier(userId);

			// 3. If a referral code was provided, apply the referral relationship
			if (referralCode && this.referralTrackingService) {
				// The applyReferral method handles validation internally
				const result = await this.referralTrackingService.applyReferral({
					refereeId: userId,
					code: referralCode,
					sourceAppId: sourceAppId || 'manacore',
				});

				if (!result.success) {
					this.logger.warn('Failed to apply referral code', { error: result.error, referralCode });
				}
			}
		} catch (error) {
			// Log but don't fail registration if referral setup fails
			this.logger.error(
				'Error setting up referrals',
				error instanceof Error ? error.stack : undefined
			);
		}
	}

	// =========================================================================
	// OIDC Provider Methods
	// =========================================================================

	/**
	 * Handle OIDC request by forwarding to Better Auth's handler
	 *
	 * This method converts an Express request to a Fetch Request,
	 * passes it to Better Auth's handler, and returns the response.
	 *
	 * Better Auth's OIDC Provider uses routes under /api/auth/oauth2/
	 * so we need to map incoming routes accordingly:
	 * - /.well-known/openid-configuration → /api/auth/.well-known/openid-configuration
	 * - /api/oidc/authorize → /api/auth/oauth2/authorize
	 * - /api/oidc/token → /api/auth/oauth2/token
	 * - /api/oidc/userinfo → /api/auth/oauth2/userinfo
	 * - /api/oidc/jwks → /api/auth/jwks (JWKS is at basePath, not oauth2)
	 *
	 * @param req - Express request
	 * @returns Response data from Better Auth
	 */
	async handleOidcRequest(req: import('express').Request): Promise<{
		status: number;
		headers: Record<string, string>;
		body: unknown;
	}> {
		try {
			// Map incoming paths to Better Auth's expected paths
			let mappedPath = req.originalUrl;

			// Map .well-known to Better Auth's basePath
			if (mappedPath.startsWith('/.well-known/')) {
				mappedPath = `/api/auth${mappedPath}`;
			}
			// Map /api/oidc/jwks to /api/auth/jwks (JWKS is not under oauth2)
			else if (mappedPath.startsWith('/api/oidc/jwks')) {
				mappedPath = mappedPath.replace('/api/oidc/jwks', '/api/auth/jwks');
			}
			// Map /api/oidc/* to /api/auth/oauth2/*
			else if (mappedPath.startsWith('/api/oidc/')) {
				mappedPath = mappedPath.replace('/api/oidc/', '/api/auth/oauth2/');
			}

			// Convert Express request to Fetch Request
			const url = new URL(
				mappedPath,
				this.configService.get<string>('BASE_URL') ||
					`http://localhost:${this.configService.get<number>('PORT') || 3001}`
			);

			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) {
				if (value) {
					headers.set(key, Array.isArray(value) ? value[0] : value);
				}
			}

			// Prepare body based on content type
			let requestBody: string | undefined;
			if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
				const contentType = req.headers['content-type'] || '';
				if (contentType.includes('application/x-www-form-urlencoded')) {
					// Convert object to URL-encoded form data
					const params = new URLSearchParams();
					for (const [key, value] of Object.entries(req.body)) {
						if (value !== undefined && value !== null) {
							params.append(key, String(value));
						}
					}
					requestBody = params.toString();
				} else {
					// Default to JSON
					requestBody = JSON.stringify(req.body);
					// Ensure content-type is set for JSON
					if (!headers.has('content-type')) {
						headers.set('content-type', 'application/json');
					}
				}
			}

			// Create Fetch Request
			const fetchRequest = new Request(url.toString(), {
				method: req.method,
				headers,
				body: requestBody,
			});

			// Call Better Auth's handler
			const response = await this.auth.handler(fetchRequest);

			// Convert Response to our format
			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			// Get body - handle empty responses gracefully
			let body: unknown;
			const contentType = response.headers.get('content-type');
			const textBody = await response.text();

			if (contentType?.includes('application/json') && textBody.length > 0) {
				try {
					body = JSON.parse(textBody);
				} catch {
					body = textBody;
				}
			} else {
				body = textBody;
			}

			return {
				status: response.status,
				headers: responseHeaders,
				body,
			};
		} catch (error) {
			this.logger.error(
				'OIDC request handling failed',
				error instanceof Error ? error.stack : undefined
			);
			throw error;
		}
	}
}
