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
import { ConfigService } from '@nestjs/config';
import { createBetterAuth } from '../better-auth.config';
import type { BetterAuthInstance } from '../better-auth.config';
import { getDb } from '../../db/connection';
import { balances, organizationBalances } from '../../db/schema/credits.schema';
import { hasUser, hasToken, hasMember, hasMembers, hasSession } from '../types/better-auth.types';
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
import * as jwt from 'jsonwebtoken';
import { jwtVerify, createRemoteJWKSet } from 'jose';

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

	/**
	 * Typed accessor for organization plugin API methods
	 * Better Auth's organization plugin adds methods dynamically, so we provide
	 * a typed accessor to avoid casting throughout the service.
	 */
	private get orgApi(): BetterAuthAPI {
		return this.auth.api as unknown as BetterAuthAPI;
	}

	constructor(private configService: ConfigService) {
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
			console.error('Error fetching organization members:', error);
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
				console.warn('[signIn] Better Auth signJWT failed, using manual JWT generation:', jwtError);

				// Fallback: Generate JWT manually using jsonwebtoken
				const privateKey = this.configService.get<string>('jwt.privateKey');
				const issuer = this.configService.get<string>('jwt.issuer') || 'manacore';
				const audience = this.configService.get<string>('jwt.audience') || 'manacore';

				console.log('[signIn] Private key exists:', !!privateKey);
				console.log('[signIn] Private key length:', privateKey?.length);
				console.log('[signIn] Private key starts with:', privateKey?.substring(0, 30));
				console.log('[signIn] Issuer:', issuer);
				console.log('[signIn] Audience:', audience);

				if (privateKey) {
					const payload = {
						sub: user.id,
						email: user.email,
						role: (user as BetterAuthUser).role || 'user',
						sid: session?.id || '',
					};

					accessToken = jwt.sign(payload, privateKey, {
						algorithm: 'RS256',
						expiresIn: '15m',
						issuer,
						audience,
					});

					console.log('[signIn] Generated JWT (first 50 chars):', accessToken?.substring(0, 50));
					// Decode to verify
					const decoded = jwt.decode(accessToken, { complete: true });
					console.log('[signIn] Generated JWT header:', decoded?.header);
					console.log('[signIn] Generated JWT payload:', decoded?.payload);
				} else {
					console.error('[signIn] No JWT private key configured');
					accessToken = sessionToken;
				}
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
			console.error('Error during sign out:', error);
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
			console.error('Error listing organizations:', error);
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

			// Generate new session
			const sessionId = randomUUID();
			const newRefreshToken = nanoid(64);
			const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
			const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

			await db.insert(sessions).values({
				id: sessionId,
				userId: user.id,
				token: sessionId,
				refreshToken: newRefreshToken,
				refreshTokenExpiresAt,
				ipAddress: session.ipAddress,
				userAgent: session.userAgent,
				deviceId: session.deviceId,
				deviceName: session.deviceName,
				expiresAt: accessTokenExpiresAt,
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
			console.log('[validateToken] Token (first 50 chars):', token?.substring(0, 50));

			// Decode to check the algorithm
			const decoded = jwt.decode(token, { complete: true });
			console.log('[validateToken] Decoded header:', decoded?.header);

			// Use our JWKS endpoint (NestJS prefix: /api/v1)
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const jwksUrl = new URL('/api/v1/auth/jwks', baseUrl);

			console.log('[validateToken] Using JWKS from:', jwksUrl.toString());

			// Create JWKS fetcher
			const JWKS = createRemoteJWKSet(jwksUrl);

			// Get issuer/audience from config (Better Auth uses BASE_URL by default)
			const issuer = this.configService.get<string>('jwt.issuer') || baseUrl;
			const audience = this.configService.get<string>('jwt.audience') || baseUrl;

			console.log('[validateToken] Issuer:', issuer);
			console.log('[validateToken] Audience:', audience);

			// Verify using jose library with Better Auth's JWKS
			const { payload } = await jwtVerify(token, JWKS, {
				issuer,
				audience,
			});

			console.log('[validateToken] Verification SUCCESS');
			console.log('[validateToken] Payload:', payload);

			return {
				valid: true,
				payload: payload as unknown as TokenPayload,
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('[validateToken] Verification FAILED:', errorMessage);
			return {
				valid: false,
				error: errorMessage,
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
			console.error('[getJwks] Error:', error);
			return { keys: [] };
		}
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
			console.error('Error creating personal credit balance:', error);
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
			console.error('Error creating organization credit balance:', error);
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
}
