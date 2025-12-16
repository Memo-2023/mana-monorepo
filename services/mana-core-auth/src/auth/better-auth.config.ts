/**
 * Better Auth Configuration
 *
 * This file configures Better Auth with:
 * - Email/password authentication
 * - Organization plugin for B2B (multi-tenant)
 * - JWT plugin with minimal claims
 * - Drizzle adapter for PostgreSQL
 *
 * ARCHITECTURE DECISION (2024-12):
 * We use MINIMAL JWT claims. Organization and credit data should be fetched
 * via API calls, not embedded in JWTs. See docs/AUTHENTICATION_ARCHITECTURE.md
 *
 * @see https://www.better-auth.com/docs
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt } from 'better-auth/plugins/jwt';
import { organization } from 'better-auth/plugins/organization';
import { z } from 'zod';
import { getDb } from '../db/connection';
import { organizations, members, invitations } from '../db/schema/organizations.schema';
import { users, sessions, accounts, verificationTokens, jwks } from '../db/schema/auth.schema';
import { sendPasswordResetEmail, sendOrganizationInviteEmail } from '../email/brevo-client';

/**
 * User role schema with Zod runtime validation
 *
 * Ensures only valid role values can be assigned to users.
 * This provides defense-in-depth alongside `input: false`.
 *
 * Valid roles:
 * - 'user': Standard user (default)
 * - 'admin': Administrator with elevated privileges
 * - 'service': Service account for automated systems
 */
export const userRoleSchema = z.enum(['user', 'admin', 'service'], {
	errorMap: () => ({ message: 'Invalid user role. Must be one of: user, admin, service' }),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isValidUserRole(role: unknown): role is UserRole {
	return userRoleSchema.safeParse(role).success;
}

/**
 * JWT Custom Payload Interface
 *
 * MINIMAL claims only. Organization context and credits are available via:
 * - GET /organization/get-active-member - org membership & role
 * - GET /api/v1/credits/balance - credit balance
 *
 * Why minimal claims?
 * 1. Credit balance changes frequently - JWT would be stale
 * 2. Organization context available via Better Auth org plugin APIs
 * 3. Smaller tokens = better performance
 * 4. Follows Better Auth's session-based design
 */
export interface JWTCustomPayload {
	/** User ID (standard JWT claim) */
	sub: string;

	/** User email */
	email: string;

	/** User role (user, admin, service) */
	role: string;

	/** Session ID for reference */
	sid: string;
}

/**
 * Create Better Auth instance
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
				// Auth tables (actual Drizzle table objects)
				user: users,
				session: sessions,
				account: accounts,
				verification: verificationTokens,

				// Organization tables
				organization: organizations,
				member: members,
				invitation: invitations,

				// JWT plugin table
				jwks: jwks,
			},
		}),

		// Email/password authentication with password reset
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false, // Can enable later
			minPasswordLength: 12,
			maxPasswordLength: 128,

			/**
			 * Password Reset Configuration
			 *
			 * Better Auth provides password reset via:
			 * - auth.api.requestPasswordReset({ body: { email } }) - Sends reset email
			 * - auth.api.resetPassword({ body: { newPassword, token } }) - Resets password
			 *
			 * Uses Brevo API to send transactional emails.
			 * Set BREVO_API_KEY environment variable to enable email sending.
			 * Without the API key, emails are logged to console (dev mode).
			 *
			 * The reset URL points to the frontend's reset-password page, not the API.
			 * Set FRONTEND_URL environment variable for production.
			 *
			 * @see https://www.better-auth.com/docs/authentication/email-password#password-reset
			 */
			sendResetPassword: async ({ user, token }) => {
				// Construct URL pointing to frontend's reset-password page
				const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
				const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

				await sendPasswordResetEmail({
					email: user.email,
					name: user.name || undefined,
					resetUrl,
				});
			},
		},

		// Session configuration
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // Update session once per day
		},

		// Base URL for callbacks and redirects
		baseURL: process.env.BASE_URL || 'http://localhost:3001',

		/**
		 * User Additional Fields
		 *
		 * Define custom user fields that Better Auth should be aware of.
		 * This enables proper type inference via $Infer pattern.
		 *
		 * @see https://www.better-auth.com/docs/concepts/database#additional-fields
		 */
		user: {
			additionalFields: {
				/**
				 * User role (user, admin, service)
				 *
				 * Security:
				 * - input=false prevents clients from setting their own role
				 * - Zod validator ensures only valid role values are accepted
				 *
				 * Roles must be assigned server-side only.
				 *
				 * @see userRoleSchema for valid values
				 */
				role: {
					type: 'string',
					required: false,
					defaultValue: 'user',
					input: false, // Clients cannot set role during registration
					validator: {
						input: userRoleSchema, // Runtime validation with Zod
					},
				},
			},
		},

		// Plugins
		plugins: [
			/**
			 * Organization Plugin (B2B)
			 *
			 * Provides complete organization management:
			 * - Create/update/delete organizations
			 * - Invite/add/remove members
			 * - Role-based access control
			 * - Active organization tracking (session.activeOrganizationId)
			 *
			 * Client apps use these endpoints for org context:
			 * - GET /organization/get-active-member
			 * - GET /organization/get-active-member-role
			 * - POST /organization/set-active
			 */
			organization({
				// Allow users to create their own organizations
				allowUserToCreateOrganization: true,

				/**
				 * Email invitation handler
				 *
				 * Uses Brevo API to send organization invitation emails.
				 * Set BREVO_API_KEY environment variable to enable email sending.
				 * Without the API key, emails are logged to console (dev mode).
				 */
				async sendInvitationEmail(data) {
					const { email, organization, role, inviter } = data;
					const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
					const inviteUrl = `${baseUrl}/accept-invitation?id=${data.id}`;

					await sendOrganizationInviteEmail({
						email,
						organizationName: organization.name,
						inviterName: inviter?.user?.name || undefined,
						inviteUrl,
						role: role || 'member',
					});
				},

				// Custom roles and permissions
				organizationRole: {
					owner: {
						permissions: [
							'organization:update',
							'organization:delete',
							'members:invite',
							'members:remove',
							'members:update_role',
							'credits:allocate',
							'credits:view_all',
						],
					},
					admin: {
						permissions: [
							'organization:update',
							'members:invite',
							'members:remove',
							'credits:view_all',
						],
					},
					member: {
						permissions: ['credits:view_own'],
					},
				},
			}),

			/**
			 * JWT Plugin
			 *
			 * Generates JWT tokens with MINIMAL claims.
			 *
			 * DO NOT add complex claims like:
			 * - credit_balance (stale after 15min, fetch via API instead)
			 * - organization details (use Better Auth org plugin APIs)
			 * - customer_type (derive from activeOrganizationId presence)
			 *
			 * Apps should call APIs for dynamic data:
			 * - Credits: GET /api/v1/credits/balance
			 * - Org info: GET /organization/get-active-member
			 */
			jwt({
				jwt: {
					issuer: process.env.JWT_ISSUER || 'manacore',
					audience: process.env.JWT_AUDIENCE || 'manacore',
					expirationTime: '15m',

					/**
					 * Define minimal JWT payload
					 *
					 * Only includes static user info that doesn't change frequently.
					 */
					definePayload({ user, session }) {
						return {
							sub: user.id,
							email: user.email,
							role: user.role ?? 'user',
							sid: session.id,
						};
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

/**
 * Inferred types from Better Auth instance
 *
 * These types are automatically derived from the auth configuration,
 * including all plugins and additional fields. Use these instead of
 * manual interface definitions.
 *
 * @see https://www.better-auth.com/docs/concepts/typescript
 */
export type AuthSession = BetterAuthInstance['$Infer']['Session'];
export type AuthUser = AuthSession['user'];

/**
 * Inferred API type from Better Auth instance
 *
 * This type includes all methods from core auth and plugins
 * (organization, jwt, etc.). Use this instead of manual BetterAuthAPI interface.
 */
export type AuthAPI = BetterAuthInstance['api'];
