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
} from '@nestjs/common';
import { LoggerService } from '../../common/logger';
import { ConfigService } from '@nestjs/config';
import { createBetterAuth } from '../better-auth.config';
import type { BetterAuthInstance } from '../better-auth.config';
import { getDb } from '../../db/connection';
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
	OrganizationInvitation,
	Organization,
	BetterAuthAPI,
	SignUpResponse,
	SignInResponse,
	CreateOrganizationResponse,
	BetterAuthUser,
	BetterAuthSession,
} from '../types/better-auth.types';
import { jwtVerify } from 'jose';
import * as jwt from 'jsonwebtoken';
import { createCachedLocalJWKSet } from '../../common/guards/local-jwks-cache';

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

			// Redeem any pending gift codes via mana-credits service
			try {
				const creditsUrl = process.env.MANA_CREDITS_URL || 'http://localhost:3061';
				const serviceKey = process.env.MANA_CORE_SERVICE_KEY || '';
				const giftRes = await fetch(`${creditsUrl}/api/v1/internal/gifts/redeem-pending`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Service-Key': serviceKey },
					body: JSON.stringify({ userId: user.id, email: dto.email }),
				});
				if (giftRes.ok) {
					const giftResult = await giftRes.json();
					if (giftResult.redeemed > 0) {
						this.logger.log('Redeemed pending gifts on registration', {
							userId: user.id,
							redeemedCount: giftResult.redeemed,
							totalCredits: giftResult.totalCredits,
						});
					}
				}
			} catch (error) {
				this.logger.warn('Failed to redeem pending gifts via mana-credits (non-critical)', {
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

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

			// Step 3: Create owner's personal balance (for when they use credits)
			await this.createPersonalCreditBalance(ownerId);

			// Step 4: Initialize guild pool for the organization
			await this.initializeGuildPool(organizationId);

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
	 * Create an organization directly (for guild creation).
	 * The authenticated user becomes the owner.
	 */
	async createOrganizationDirect(
		token: string,
		data: { name: string; slug?: string; logo?: string }
	): Promise<CreateOrganizationResponse> {
		const slug = data.slug || this.slugify(data.name);

		const orgResult = (await this.auth.api.createOrganization({
			body: {
				name: data.name,
				slug,
				...(data.logo && { logo: data.logo }),
			},
			headers: {
				authorization: `Bearer ${token}`,
			},
		})) as CreateOrganizationResponse;

		return orgResult;
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

			// Better Auth returns error objects instead of throwing for some cases
			if (result && typeof result === 'object' && 'error' in result) {
				const errorResult = result as {
					error: { message?: string; code?: string; status?: number };
				};
				const errorMsg = errorResult.error?.message || '';
				const errorCode = errorResult.error?.code || '';
				this.logger.debug(`SignIn error result: ${JSON.stringify(errorResult.error)}`);

				if (
					errorMsg.includes('not verified') ||
					errorMsg.includes('not confirmed') ||
					errorCode === 'EMAIL_NOT_VERIFIED' ||
					errorCode === 'EMAIL_NOT_CONFIRMED'
				) {
					throw new ForbiddenException({
						message: 'Email not verified',
						code: 'EMAIL_NOT_VERIFIED',
					});
				}
			}

			// Check if 2FA is required
			if (
				result &&
				typeof result === 'object' &&
				'twoFactorRedirect' in result &&
				(result as any).twoFactorRedirect
			) {
				this.logger.debug('SignIn: 2FA required, returning redirect');
				return {
					twoFactorRedirect: true,
					user: null,
					accessToken: '',
					refreshToken: '',
					expiresIn: 0,
				} as any;
			}

			if (!hasUser(result)) {
				throw new UnauthorizedException('Invalid credentials');
			}

			const { user } = result;

			// Get session token (the cookie token, not the refresh token)
			const session = hasSession(result) ? result.session : null;
			const sessionToken = session?.token || (hasToken(result) ? result.token : '');

			// Get the actual refreshToken from the database
			const db = getDb(this.databaseUrl);
			const { sessions } = await import('../../db/schema');
			const { eq } = await import('drizzle-orm');
			const { nanoid } = await import('nanoid');

			// Find the session by its token to get the real refreshToken
			const [dbSession] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.token, sessionToken))
				.limit(1);

			let actualRefreshToken: string;

			if (dbSession?.refreshToken) {
				// Session already has a refreshToken - use it
				actualRefreshToken = dbSession.refreshToken;
				this.logger.debug('SignIn: Using existing refreshToken from session');
			} else if (dbSession) {
				// Session exists but no refreshToken - generate one and update the session
				actualRefreshToken = nanoid(64);
				const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

				await db
					.update(sessions)
					.set({
						refreshToken: actualRefreshToken,
						refreshTokenExpiresAt,
						updatedAt: new Date(),
					})
					.where(eq(sessions.id, dbSession.id));

				this.logger.debug('SignIn: Generated new refreshToken for session');
			} else {
				// No session found in DB - this shouldn't happen, but handle it
				this.logger.warn('SignIn: Session not found in database, using session token as fallback');
				actualRefreshToken = sessionToken;
			}

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
				refreshToken: actualRefreshToken,
				expiresIn: 15 * 60, // 15 minutes in seconds
			};
		} catch (error: unknown) {
			// Re-throw NestJS HTTP exceptions directly
			if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
				throw error;
			}

			if (error instanceof Error) {
				this.logger.debug(`SignIn caught error: ${error.message}`);

				if (
					error.message?.toLowerCase().includes('not verified') ||
					error.message?.toLowerCase().includes('not confirmed') ||
					error.message?.includes('EMAIL_NOT_VERIFIED')
				) {
					throw new ForbiddenException({
						message: 'Email not verified',
						code: 'EMAIL_NOT_VERIFIED',
					});
				}
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
	 * Create a session and generate JWT tokens for a user
	 * Used by passkey authentication and other non-password flows
	 */
	async createSessionAndTokens(
		user: { id: string; email: string; name: string; role?: string },
		meta?: { ipAddress?: string; userAgent?: string; deviceId?: string; deviceName?: string }
	) {
		const db = getDb(this.databaseUrl);
		const { sessions } = await import('../../db/schema');
		const { nanoid } = await import('nanoid');

		const sessionId = nanoid();
		const sessionToken = nanoid(64);
		const refreshToken = nanoid(64);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
		const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		// Create session in DB
		await db.insert(sessions).values({
			id: sessionId,
			token: sessionToken,
			userId: user.id,
			expiresAt,
			refreshToken,
			refreshTokenExpiresAt,
			ipAddress: meta?.ipAddress || null,
			userAgent: meta?.userAgent || null,
			deviceId: meta?.deviceId || null,
			deviceName: meta?.deviceName || null,
			lastActivityAt: new Date(),
		});

		// Generate JWT access token
		let accessToken = '';
		try {
			const api = this.auth.api as any;
			const jwtResult = await api.signJWT({
				body: {
					payload: {
						sub: user.id,
						email: user.email,
						role: user.role || 'user',
						sid: sessionId,
					},
				},
			});
			accessToken = jwtResult?.token || '';
			if (!accessToken) throw new Error('signJWT returned empty token');
		} catch (jwtError) {
			this.logger.warn('signJWT failed for passkey auth, using session token as fallback');
			accessToken = sessionToken;
		}

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role || 'user',
			},
			accessToken,
			refreshToken,
			expiresIn: 15 * 60, // 15 minutes
		};
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

	/**
	 * Update organization
	 *
	 * Updates an organization's name, logo, or metadata.
	 * Requires owner or admin role.
	 *
	 * @param organizationId - Organization ID
	 * @param data - Fields to update (name, logo, metadata)
	 * @param token - User's authentication token
	 * @returns Updated organization
	 * @throws ForbiddenException if user lacks permission
	 * @throws NotFoundException if organization not found
	 */
	async updateOrganization(
		organizationId: string,
		data: { name?: string; logo?: string; metadata?: Record<string, unknown> },
		token: string
	): Promise<Organization> {
		try {
			const result = await (this.orgApi as any).updateOrganization({
				body: {
					organizationId,
					data: {
						...(data.name !== undefined && { name: data.name }),
						...(data.logo !== undefined && { logo: data.logo }),
						...(data.metadata !== undefined && { metadata: data.metadata }),
					},
				},
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			return result;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Organization not found');
				}
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('You do not have permission to update this organization');
				}
			}
			throw error;
		}
	}

	/**
	 * Delete organization
	 *
	 * Deletes an organization and all its data.
	 * Requires owner role.
	 *
	 * @param organizationId - Organization ID
	 * @param token - User's authentication token
	 * @throws ForbiddenException if user is not the owner
	 * @throws NotFoundException if organization not found
	 */
	async deleteOrganization(organizationId: string, token: string): Promise<void> {
		try {
			await (this.orgApi as any).deleteOrganization({
				body: { organizationId },
				headers: {
					authorization: `Bearer ${token}`,
				},
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Organization not found');
				}
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('Only the owner can delete the organization');
				}
			}
			throw error;
		}
	}

	/**
	 * Update member role
	 *
	 * Changes a member's role within an organization.
	 * Requires owner or admin role.
	 *
	 * @param organizationId - Organization ID
	 * @param memberId - Member ID to update
	 * @param role - New role ('admin' or 'member')
	 * @param token - User's authentication token
	 * @returns Updated member
	 * @throws ForbiddenException if user lacks permission
	 * @throws NotFoundException if member not found
	 */
	async updateMemberRole(
		organizationId: string,
		memberId: string,
		role: 'admin' | 'member',
		token: string
	): Promise<OrganizationMember> {
		try {
			const result = await (this.orgApi as any).updateMemberRole({
				body: {
					organizationId,
					memberId,
					role,
				},
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			return result?.member || result;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Member not found');
				}
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('You do not have permission to change member roles');
				}
				if (error.message?.includes('owner')) {
					throw new ForbiddenException("Cannot change the owner's role");
				}
			}
			throw error;
		}
	}

	/**
	 * List organization invitations
	 *
	 * Returns all pending invitations for an organization.
	 * Requires owner or admin role.
	 *
	 * @param organizationId - Organization ID
	 * @param token - User's authentication token
	 * @returns List of invitations
	 */
	async listOrganizationInvitations(
		organizationId: string,
		token: string
	): Promise<OrganizationInvitation[]> {
		try {
			const result = await (this.orgApi as any).listInvitations({
				query: { organizationId },
				headers: {
					authorization: `Bearer ${token}`,
				},
			});

			return result?.invitations || result || [];
		} catch (error: unknown) {
			this.logger.error(
				'Failed to list organization invitations',
				error instanceof Error ? error.stack : undefined
			);
			return [];
		}
	}

	/**
	 * List user's pending invitations
	 *
	 * Returns all pending invitations for the authenticated user.
	 *
	 * @param token - User's authentication token
	 * @returns List of invitations
	 */
	async listUserInvitations(token: string): Promise<OrganizationInvitation[]> {
		try {
			const result = (await (this.orgApi as any).getInvitation)
				? await (this.orgApi as any).listUserInvitations({
						headers: {
							authorization: `Bearer ${token}`,
						},
					})
				: [];

			return result?.invitations || result || [];
		} catch (error: unknown) {
			this.logger.error(
				'Failed to list user invitations',
				error instanceof Error ? error.stack : undefined
			);
			return [];
		}
	}

	/**
	 * Cancel an invitation
	 *
	 * Cancels a pending invitation. Used by organization admins/owners.
	 *
	 * @param invitationId - Invitation ID
	 * @param token - User's authentication token
	 * @throws ForbiddenException if user lacks permission
	 * @throws NotFoundException if invitation not found
	 */
	async cancelInvitation(invitationId: string, token: string): Promise<void> {
		try {
			await (this.orgApi as any).cancelInvitation({
				body: { invitationId },
				headers: {
					authorization: `Bearer ${token}`,
				},
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Invitation not found');
				}
				if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
					throw new ForbiddenException('You do not have permission to cancel this invitation');
				}
			}
			throw error;
		}
	}

	/**
	 * Reject an invitation
	 *
	 * Rejects a pending invitation. Used by the invited user.
	 *
	 * @param invitationId - Invitation ID
	 * @param token - User's authentication token
	 * @throws NotFoundException if invitation not found
	 */
	async rejectInvitation(invitationId: string, token: string): Promise<void> {
		try {
			await (this.orgApi as any).rejectInvitation({
				body: { invitationId },
				headers: {
					authorization: `Bearer ${token}`,
				},
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.message?.includes('not found')) {
					throw new NotFoundException('Invitation not found');
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

			// Generate new JWT using Better Auth's signJWT (uses JWKS/EdDSA keys)
			let accessToken = '';
			try {
				const api = this.auth.api as any;
				const jwtResult = await api.signJWT({
					body: {
						payload: {
							sub: user.id,
							email: user.email,
							role: user.role || 'user',
							sid: sessionId,
						},
					},
				});

				accessToken = jwtResult?.token || '';

				if (!accessToken) {
					throw new Error('Better Auth signJWT returned empty token');
				}
			} catch (jwtError) {
				this.logger.error(
					'Token refresh: JWT generation failed',
					jwtError instanceof Error ? jwtError.message : 'Unknown error'
				);
				throw new Error('Failed to generate access token');
			}

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
			// Use local JWKS cache (reads from DB, no self-referential HTTP requests)
			const localJWKS = createCachedLocalJWKSet(this.databaseUrl);

			// IMPORTANT: Match Better Auth signing config exactly (better-auth.config.ts)
			// Signing uses: issuer = BASE_URL, audience = JWT_AUDIENCE || 'manacore'
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const issuer = baseUrl; // Better Auth uses BASE_URL as issuer for OIDC compatibility
			const audience = this.configService.get<string>('jwt.audience') || 'manacore';

			// Verify using jose library with locally cached JWKS keys
			const { payload } = await jwtVerify(token, localJWKS, {
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
	// Profile Management Methods
	// =========================================================================

	/**
	 * Update user profile
	 *
	 * Updates the user's name and/or image.
	 *
	 * @param userId - User ID
	 * @param updates - Fields to update (name, image)
	 * @returns Updated user data
	 */
	async updateProfile(
		userId: string,
		updates: { name?: string; image?: string }
	): Promise<{
		success: boolean;
		user: { id: string; name: string; email: string; image?: string };
	}> {
		const db = getDb(this.databaseUrl);
		const { users } = await import('../../db/schema/auth.schema');
		const { eq } = await import('drizzle-orm');

		// Get current user
		const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!currentUser || currentUser.deletedAt) {
			throw new NotFoundException('User not found');
		}

		// Build update object
		const updateData: Partial<{ name: string; image: string; updatedAt: Date }> = {
			updatedAt: new Date(),
		};

		if (updates.name !== undefined) {
			updateData.name = updates.name;
		}

		if (updates.image !== undefined) {
			updateData.image = updates.image;
		}

		// Update user
		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, userId))
			.returning();

		this.logger.log('Profile updated', { userId });

		return {
			success: true,
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				image: updatedUser.image || undefined,
			},
		};
	}

	/**
	 * Change user password
	 *
	 * Verifies the current password and updates to the new one.
	 * Requires the user to be authenticated.
	 *
	 * @param userId - User ID
	 * @param currentPassword - Current password for verification
	 * @param newPassword - New password to set
	 * @returns Success status
	 * @throws UnauthorizedException if current password is incorrect
	 */
	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<{ success: boolean; message: string }> {
		const db = getDb(this.databaseUrl);
		const { accounts } = await import('../../db/schema/auth.schema');
		const { eq, and } = await import('drizzle-orm');
		const bcrypt = await import('bcryptjs');

		// Get credential account (where password is stored)
		const [account] = await db
			.select()
			.from(accounts)
			.where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
			.limit(1);

		if (!account || !account.password) {
			throw new NotFoundException('No password credential found for this account');
		}

		// Verify current password
		const isValid = await bcrypt.compare(currentPassword, account.password);

		if (!isValid) {
			throw new UnauthorizedException('Current password is incorrect');
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await db
			.update(accounts)
			.set({
				password: hashedPassword,
				updatedAt: new Date(),
			})
			.where(eq(accounts.id, account.id));

		this.logger.log('Password changed', { userId });

		return {
			success: true,
			message: 'Password changed successfully',
		};
	}

	/**
	 * Delete user account
	 *
	 * Soft-deletes the user account after password verification.
	 * Sets deletedAt timestamp instead of hard delete for data retention.
	 *
	 * @param userId - User ID
	 * @param password - Password for verification
	 * @param reason - Optional reason for deletion
	 * @returns Success status
	 * @throws UnauthorizedException if password is incorrect
	 */
	async deleteAccount(
		userId: string,
		password: string,
		reason?: string
	): Promise<{ success: boolean; message: string }> {
		const db = getDb(this.databaseUrl);
		const { accounts, users, sessions } = await import('../../db/schema/auth.schema');
		const { eq, and } = await import('drizzle-orm');
		const bcrypt = await import('bcryptjs');

		// Get credential account
		const [account] = await db
			.select()
			.from(accounts)
			.where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
			.limit(1);

		if (!account || !account.password) {
			throw new NotFoundException('No password credential found for this account');
		}

		// Verify password
		const isValid = await bcrypt.compare(password, account.password);

		if (!isValid) {
			throw new UnauthorizedException('Password is incorrect');
		}

		const now = new Date();

		// Soft delete user
		await db.update(users).set({ deletedAt: now, updatedAt: now }).where(eq(users.id, userId));

		// Revoke all sessions
		await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.userId, userId));

		this.logger.log('Account deleted', { userId, reason });

		return {
			success: true,
			message: 'Account has been deleted',
		};
	}

	/**
	 * Get user profile
	 *
	 * Returns the full user profile data.
	 *
	 * @param userId - User ID
	 * @returns User profile data
	 */
	async getProfile(userId: string): Promise<{
		id: string;
		name: string;
		email: string;
		emailVerified: boolean;
		image?: string;
		role: string;
		createdAt: Date;
	}> {
		const db = getDb(this.databaseUrl);
		const { users } = await import('../../db/schema/auth.schema');
		const { eq } = await import('drizzle-orm');

		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!user || user.deletedAt) {
			throw new NotFoundException('User not found');
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image || undefined,
			role: user.role,
			createdAt: user.createdAt,
		};
	}

	// =========================================================================
	// Private Helper Methods
	// =========================================================================

	/**
	 * Create personal credit balance for user
	 *
	 * Initializes a user's credit balance with balance: 0
	 * Users must purchase credits or receive them as gifts.
	 *
	 * @param userId - User ID
	 * @private
	 */
	/**
	 * Initialize credit balance via mana-credits service.
	 * Non-critical — lazy init on first access if this fails.
	 */
	private async createPersonalCreditBalance(userId: string) {
		try {
			const creditsUrl = process.env.MANA_CREDITS_URL || 'http://localhost:3061';
			const serviceKey = process.env.MANA_CORE_SERVICE_KEY || '';
			await fetch(`${creditsUrl}/api/v1/internal/credits/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': serviceKey },
				body: JSON.stringify({ userId }),
			});
		} catch (error) {
			this.logger.warn('Failed to init credit balance via mana-credits (non-critical)', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Initialize guild pool via mana-credits service.
	 * Non-critical — lazy init on first access if this fails.
	 */
	private async initializeGuildPool(organizationId: string) {
		try {
			const creditsUrl = process.env.MANA_CREDITS_URL || 'http://localhost:3061';
			const serviceKey = process.env.MANA_CORE_SERVICE_KEY || '';
			await fetch(`${creditsUrl}/api/v1/internal/guild-pool/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': serviceKey },
				body: JSON.stringify({ organizationId }),
			});
		} catch (error) {
			this.logger.warn('Failed to init guild pool via mana-credits (non-critical)', {
				organizationId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
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

	// =========================================================================
	// Matrix Bot SSO Methods
	// =========================================================================

	/**
	 * Generate a JWT token for a specific user (used by Matrix bots)
	 *
	 * This method generates a fresh JWT token for an existing user,
	 * without requiring password authentication. It's used by the
	 * Matrix-SSO-Link system to auto-authenticate bot users.
	 *
	 * @param userId - Mana Core Auth user ID
	 * @returns JWT access token or null if user not found
	 */
	async generateTokenForUser(userId: string): Promise<string | null> {
		try {
			const db = getDb(this.databaseUrl);
			const { users } = await import('../../db/schema/auth.schema');
			const { eq } = await import('drizzle-orm');

			// Get user from database
			const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

			if (!user || user.deletedAt) {
				this.logger.warn('generateTokenForUser: User not found', { userId });
				return null;
			}

			// Generate JWT using Better Auth's signJWT
			const api = this.auth.api as any;

			const jwtResult = await api.signJWT({
				body: {
					payload: {
						sub: user.id,
						email: user.email,
						role: user.role || 'user',
						sid: `bot-session-${Date.now()}`, // Pseudo session ID for bots
					},
				},
			});

			const token = jwtResult?.token;

			if (!token) {
				this.logger.error('generateTokenForUser: signJWT returned empty token');
				return null;
			}

			this.logger.debug('Generated token for user via Matrix-SSO-Link', { userId });
			return token;
		} catch (error) {
			this.logger.error(
				'generateTokenForUser failed',
				error instanceof Error ? error.stack : undefined
			);
			return null;
		}
	}

	// =========================================================================
	// SSO Methods
	// =========================================================================

	/**
	 * Exchange session cookie for JWT tokens (SSO)
	 *
	 * This enables cross-domain Single Sign-On. When a user is logged in
	 * on one app (e.g., calendar.mana.how), they have a session cookie on
	 * .mana.how domain. This method allows other apps to exchange that
	 * cookie for JWT tokens they can use for API calls.
	 *
	 * @param req - Express request with cookies
	 * @param res - Express response for setting headers
	 * @returns JWT tokens or throws UnauthorizedException
	 */
	async sessionToToken(
		req: import('express').Request,
		res: import('express').Response
	): Promise<SignInResult> {
		try {
			// Get session cookie name (Better Auth uses this format with our prefix)
			const cookiePrefix = process.env.COOKIE_DOMAIN ? 'mana' : 'better-auth';
			const sessionCookieName = `__Secure-${cookiePrefix}.session_token`;
			const fallbackCookieName = `${cookiePrefix}.session_token`;

			// Try to get session token from cookies
			const sessionToken = req.cookies?.[sessionCookieName] || req.cookies?.[fallbackCookieName];

			if (!sessionToken) {
				this.logger.debug('SSO: No session cookie found', {
					cookies: Object.keys(req.cookies || {}),
				});
				throw new UnauthorizedException('No session cookie found');
			}

			this.logger.debug('SSO: Found session cookie, validating...');

			// Use Better Auth's getSession to validate the cookie
			// We need to create a Request object that Better Auth can process
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const url = new URL('/api/auth/get-session', baseUrl);

			const headers = new Headers({
				Cookie: `${sessionCookieName}=${sessionToken}`,
			});

			const fetchRequest = new Request(url.toString(), {
				method: 'GET',
				headers,
			});

			const response = await this.auth.handler(fetchRequest);

			if (!response.ok) {
				this.logger.debug('SSO: Session validation failed', { status: response.status });
				throw new UnauthorizedException('Invalid or expired session');
			}

			const sessionData = await response.json();

			if (!sessionData?.user || !sessionData?.session) {
				this.logger.debug('SSO: Invalid session response', { sessionData });
				throw new UnauthorizedException('Invalid session data');
			}

			const { user, session } = sessionData;

			this.logger.debug('SSO: Session validated, generating JWT tokens', {
				userId: user.id,
				email: user.email,
			});

			// Get the actual session from database to retrieve the real refreshToken
			const db = getDb(this.databaseUrl);
			const { sessions } = await import('../../db/schema');
			const { eq } = await import('drizzle-orm');
			const { nanoid } = await import('nanoid');

			// Find the session by its token (session.token is the cookie token)
			const [dbSession] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.token, session.token || sessionToken))
				.limit(1);

			let actualRefreshToken: string;

			if (dbSession?.refreshToken) {
				// Session already has a refreshToken - use it
				actualRefreshToken = dbSession.refreshToken;
				this.logger.debug('SSO: Using existing refreshToken from session');
			} else if (dbSession) {
				// Session exists but no refreshToken - generate one and update the session
				actualRefreshToken = nanoid(64);
				const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

				await db
					.update(sessions)
					.set({
						refreshToken: actualRefreshToken,
						refreshTokenExpiresAt,
						updatedAt: new Date(),
					})
					.where(eq(sessions.id, dbSession.id));

				this.logger.debug('SSO: Generated new refreshToken for existing session');
			} else {
				// No session found in DB - this shouldn't happen, but handle it
				this.logger.warn('SSO: Session not found in database, using session token as fallback');
				actualRefreshToken = session.token || sessionToken;
			}

			// Generate JWT access token using Better Auth's JWT plugin
			let accessToken = '';
			try {
				const api = this.auth.api as any;

				const jwtResult = await api.signJWT({
					body: {
						payload: {
							sub: user.id,
							email: user.email,
							role: user.role || 'user',
							sid: session.id || '',
						},
					},
				});

				accessToken = jwtResult?.token || '';

				if (!accessToken) {
					throw new Error('Better Auth signJWT returned empty token');
				}
			} catch (jwtError) {
				this.logger.warn('SSO: JWT generation failed, using session token', {
					error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
				});
				// Use session token as fallback
				accessToken = session.token || sessionToken;
			}

			this.logger.info('SSO: Successfully exchanged session cookie for JWT tokens', {
				userId: user.id,
			});

			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
				accessToken,
				refreshToken: actualRefreshToken,
				expiresIn: 15 * 60, // 15 minutes in seconds
			};
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}

			this.logger.error(
				'SSO: Token exchange failed',
				error instanceof Error ? error.stack : undefined
			);
			throw new UnauthorizedException('Failed to exchange session for tokens');
		}
	}

	/**
	 * Get security events for a user (audit log)
	 */
	async getSecurityEvents(userId: string, limit = 50) {
		const db = getDb(this.databaseUrl);
		const { securityEvents } = await import('../../db/schema');
		const { eq, desc } = await import('drizzle-orm');

		const events = await db
			.select({
				id: securityEvents.id,
				eventType: securityEvents.eventType,
				ipAddress: securityEvents.ipAddress,
				userAgent: securityEvents.userAgent,
				metadata: securityEvents.metadata,
				createdAt: securityEvents.createdAt,
			})
			.from(securityEvents)
			.where(eq(securityEvents.userId, userId))
			.orderBy(desc(securityEvents.createdAt))
			.limit(limit);

		return events;
	}

	/**
	 * List active sessions for a user
	 */
	async listSessions(userId: string) {
		const db = getDb(this.databaseUrl);
		const { sessions } = await import('../../db/schema');
		const { eq, and, isNull, gt } = await import('drizzle-orm');

		const activeSessions = await db
			.select({
				id: sessions.id,
				ipAddress: sessions.ipAddress,
				userAgent: sessions.userAgent,
				deviceId: sessions.deviceId,
				deviceName: sessions.deviceName,
				lastActivityAt: sessions.lastActivityAt,
				createdAt: sessions.createdAt,
				expiresAt: sessions.expiresAt,
			})
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					isNull(sessions.revokedAt),
					gt(sessions.expiresAt, new Date())
				)
			)
			.orderBy(sessions.lastActivityAt);

		return activeSessions;
	}

	/**
	 * Revoke a specific session
	 */
	async revokeSession(userId: string, sessionId: string) {
		const db = getDb(this.databaseUrl);
		const { sessions } = await import('../../db/schema');
		const { eq, and } = await import('drizzle-orm');

		const result = await db
			.update(sessions)
			.set({ revokedAt: new Date() })
			.where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
			.returning({ id: sessions.id });

		if (result.length === 0) {
			throw new NotFoundException('Session not found');
		}
	}
}
