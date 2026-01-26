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
import { getDb } from '../db/connection';
import { organizations, members, invitations } from '../db/schema/organizations.schema';
import { users, sessions, accounts, verificationTokens, jwks } from '../db/schema/auth.schema';
import type { JWTPayloadContext } from './types/better-auth.types';
import { sendPasswordResetEmail, sendInvitationEmail } from '../email/email.service';

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
			minPasswordLength: 8,
			maxPasswordLength: 128,

			/**
			 * Password Reset Configuration
			 *
			 * Better Auth provides password reset via:
			 * - auth.api.forgetPassword({ email }) - Sends reset email
			 * - auth.api.resetPassword({ newPassword, token }) - Resets password
			 *
			 * @see https://www.better-auth.com/docs/authentication/email-password#password-reset
			 */
			sendResetPassword: async ({ user, url }) => {
				await sendPasswordResetEmail(user.email, url, user.name);
			},
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

				// Email invitation handler
				async sendInvitationEmail(data) {
					const { email, organization, inviter } = data;
					const baseUrl = process.env.BASE_URL || 'https://mana.how';
					const inviteUrl = `${baseUrl}/accept-invitation?id=${data.id}`;
					await sendInvitationEmail(
						email,
						organization.name,
						inviter?.user?.name || 'Ein Teammitglied',
						inviteUrl
					);
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
					definePayload({ user, session }: JWTPayloadContext) {
						return {
							sub: user.id,
							email: user.email,
							role: (user as { role?: string }).role || 'user',
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
