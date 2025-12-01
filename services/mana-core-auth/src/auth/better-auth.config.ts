/**
 * Better Auth Configuration
 *
 * This file configures Better Auth with:
 * - Email/password authentication
 * - Organization plugin for B2B (multi-tenant)
 * - JWT plugin with custom claims (credit_balance, customer_type, organization)
 * - Drizzle adapter for PostgreSQL
 *
 * @see https://www.better-auth.com/docs
 * @see BETTER_AUTH_FINAL_PLAN.md
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt } from 'better-auth/plugins/jwt';
import { organization } from 'better-auth/plugins/organization';
import { getDb } from '../db/connection';
import { eq, and } from 'drizzle-orm';
import { balances } from '../db/schema/credits.schema';
import { organizations, members } from '../db/schema/organizations.schema';
import type { JWTPayloadContext } from './types/better-auth.types';

/**
 * JWT Custom Payload Interface
 *
 * Defines the structure of custom claims included in JWT tokens.
 * These claims are added to the standard JWT payload (sub, iat, exp, etc.)
 */
export interface JWTCustomPayload {
	/** User ID (standard JWT claim) */
	sub: string;

	/** User email */
	email: string;

	/** User role (user, admin, service) */
	role: string;

	/** Customer type: B2C (individual) or B2B (organization member) */
	customer_type: 'b2c' | 'b2b';

	/** Organization context (null for B2C users) */
	organization: {
		id: string;
		name: string;
		role: 'owner' | 'admin' | 'member';
	} | null;

	/** User's credit balance (personal for B2C, allocated for B2B) */
	credit_balance: number;

	/** Application ID (memoro, chat, picture, etc.) */
	app_id?: string;

	/** Device ID (for mobile apps) */
	device_id?: string;
}

/**
 * Helper function to get personal credit balance (B2C users)
 *
 * @param userId - User ID
 * @param databaseUrl - Database connection URL
 * @returns Credit balance or 0 if not found
 */
async function getPersonalCreditBalance(userId: string, databaseUrl: string): Promise<number> {
	try {
		const db = getDb(databaseUrl);

		const [balance] = await db
			.select({ balance: balances.balance })
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		return balance?.balance ?? 0;
	} catch (error) {
		console.error('Error fetching personal credit balance:', error);
		return 0;
	}
}

/**
 * Helper function to get employee credit balance (B2B users)
 *
 * For B2B employees, this returns their allocated credit balance.
 * The balance is stored in the same balances table but tracked separately per employee.
 *
 * @param userId - Employee user ID
 * @param organizationId - Organization ID
 * @param databaseUrl - Database connection URL
 * @returns Allocated credit balance or 0 if not found
 */
async function getEmployeeCreditBalance(
	userId: string,
	organizationId: string,
	databaseUrl: string
): Promise<number> {
	try {
		const db = getDb(databaseUrl);

		// Get employee's personal balance (which represents their allocated credits from the org)
		const [balance] = await db
			.select({ balance: balances.balance })
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		return balance?.balance ?? 0;
	} catch (error) {
		console.error('Error fetching employee credit balance:', error);
		return 0;
	}
}

/**
 * Helper function to get organization membership data
 *
 * Queries the organization and member tables to get:
 * - Organization name
 * - User's role in the organization
 *
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param databaseUrl - Database connection URL
 * @returns Organization data with name and role, or null if not found
 */
async function getOrganizationMembership(
	userId: string,
	organizationId: string,
	databaseUrl: string
): Promise<{ name: string; role: 'owner' | 'admin' | 'member' } | null> {
	try {
		const db = getDb(databaseUrl);

		// Query member table to get user's role in the organization
		const [memberRecord] = await db
			.select({
				role: members.role,
			})
			.from(members)
			.where(and(eq(members.userId, userId), eq(members.organizationId, organizationId)))
			.limit(1);

		if (!memberRecord) {
			return null;
		}

		// Query organization table to get organization name
		const [orgRecord] = await db
			.select({
				name: organizations.name,
			})
			.from(organizations)
			.where(eq(organizations.id, organizationId))
			.limit(1);

		if (!orgRecord) {
			return null;
		}

		return {
			name: orgRecord.name,
			role: memberRecord.role as 'owner' | 'admin' | 'member',
		};
	} catch (error) {
		console.error('Error fetching organization membership:', error);
		return null;
	}
}

/**
 * Create Better Auth instance
 *
 * This function initializes Better Auth with the database connection URL.
 * It must be called with the database URL from the configuration.
 *
 * @param databaseUrl - PostgreSQL connection URL
 * @returns Better Auth instance
 */
export function createBetterAuth(databaseUrl: string) {
	const db = getDb(databaseUrl);

	return betterAuth({
		// Database adapter (Drizzle with PostgreSQL)
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				// Auth tables
				user: 'auth.users',
				session: 'auth.sessions',
				account: 'auth.accounts',
				verification: 'auth.verification_tokens',

				// Organization tables (Better Auth creates these schemas)
				organization: 'auth.organizations',
				member: 'auth.members',
				invitation: 'auth.invitations',
			},
		}),

		// Email/password authentication only
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false, // Can enable later
			minPasswordLength: 12,
			maxPasswordLength: 128,
		},

		// Session configuration
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // Update session once per day
		},

		// Base URL for callbacks and redirects
		baseURL: process.env.BASE_URL || 'http://localhost:3001',

		// Plugins
		plugins: [
			/**
			 * Organization Plugin (B2B)
			 *
			 * Provides complete organization management:
			 * - Create/update/delete organizations
			 * - Invite/add/remove members
			 * - Role-based access control
			 * - Email-based invitations
			 */
			organization({
				// Allow users to create their own organizations
				allowUserToCreateOrganization: true,

				// Email invitation handler
				async sendInvitationEmail(data) {
					const { email, organization } = data;

					// TODO: Implement email sending service
					console.log('TODO: Send invitation email', {
						to: email,
						organization: organization.name,
						invitationId: data.id,
					});

					// Example email template:
					// Subject: Join ${organization.name} on Mana Universe
					// Body: You've been invited to join ${organization.name}
					//       Click here to accept: ${baseURL}/invite/${data.id}
				},

				// Custom roles and permissions
				organizationRole: {
					/**
					 * Owner Role
					 * - Full organization control
					 * - Can delete organization
					 * - Can manage all members
					 * - Can allocate credits to employees
					 */
					owner: {
						permissions: [
							'organization:update',
							'organization:delete',
							'members:invite',
							'members:remove',
							'members:update_role',
							'credits:allocate', // Custom permission
							'credits:view_all', // Custom permission
						],
					},

					/**
					 * Admin Role
					 * - Can update organization settings
					 * - Can invite and remove members
					 * - Can view all credit usage
					 */
					admin: {
						permissions: [
							'organization:update',
							'members:invite',
							'members:remove',
							'credits:view_all',
						],
					},

					/**
					 * Member Role
					 * - Basic organization access
					 * - Can only view their own credits
					 */
					member: {
						permissions: ['credits:view_own'],
					},
				},
			}),

			/**
			 * JWT Plugin
			 *
			 * Generates JWT tokens with custom claims for:
			 * - Credit balance
			 * - Customer type (B2C vs B2B)
			 * - Organization context
			 * - App/device metadata
			 */
			jwt({
				jwt: {
					issuer: 'mana-core',
					audience: process.env.JWT_AUDIENCE || 'manacore',
					expirationTime: '15m', // 15 minutes for access tokens

					/**
					 * Define custom JWT payload
					 *
					 * This function is called when generating a JWT token.
					 * It enriches the standard JWT claims with custom data.
					 *
					 * @param context - JWT payload context with user and session
					 * @returns Custom JWT payload
					 */
					async definePayload({ user, session }: JWTPayloadContext) {
						// Get user's active organization (from session metadata or first membership)
						const activeOrgId = session.activeOrganizationId;

						let organizationData: JWTCustomPayload['organization'] = null;
						let creditBalance = 0;
						let customerType: 'b2c' | 'b2b' = 'b2c';

						if (activeOrgId) {
							// B2B user - get organization membership from database
							try {
								// Query actual organization and membership data
								const membership = await getOrganizationMembership(
									user.id,
									activeOrgId,
									databaseUrl
								);

								if (membership) {
									// Get employee's allocated credit balance
									creditBalance = await getEmployeeCreditBalance(
										user.id,
										activeOrgId,
										databaseUrl
									);

									organizationData = {
										id: activeOrgId,
										name: membership.name,
										role: membership.role,
									};

									customerType = 'b2b';
								} else {
									// User is not a member of this organization, fall back to B2C
									console.warn(
										`User ${user.id} is not a member of organization ${activeOrgId}`
									);
									creditBalance = await getPersonalCreditBalance(user.id, databaseUrl);
								}
							} catch (error) {
								console.error('Error fetching organization data:', error);
								// Fall back to B2C on error
								creditBalance = await getPersonalCreditBalance(user.id, databaseUrl);
							}
						} else {
							// B2C user - get personal credit balance
							creditBalance = await getPersonalCreditBalance(user.id, databaseUrl);
						}

						// Build custom JWT payload
						const payload: Partial<JWTCustomPayload> = {
							// Standard claims
							sub: user.id,
							email: user.email,
							role: user.role || 'user',

							// Customer type
							customer_type: customerType,

							// Organization (null for B2C)
							organization: organizationData,

							// Credits
							credit_balance: creditBalance,

							// App metadata (from session)
							app_id: (session.metadata?.appId as string) || undefined,
							device_id: (session.metadata?.deviceId as string) || undefined,
						};

						return payload;
					},
				},
			}),
		],
	});
}

/**
 * Export type for Better Auth instance
 */
export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
