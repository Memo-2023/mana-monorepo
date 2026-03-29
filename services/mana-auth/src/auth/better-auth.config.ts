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
import { oidcProvider } from 'better-auth/plugins/oidc-provider';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { magicLink } from 'better-auth/plugins/magic-link';
import { getDb } from '../db/connection';
import { organizations, members, invitations } from '../db/schema/organizations';
import {
	users,
	sessions,
	accounts,
	verificationTokens,
	jwks,
	oauthApplications,
	oauthAccessTokens,
	oauthAuthorizationCodes,
	oauthConsents,
	twoFactorAuth,
} from '../db/schema/auth';
import {
	sendPasswordResetEmail,
	sendInvitationEmail,
	sendVerificationEmail,
	sendMagicLinkEmail,
} from '../email/send';
import { sourceAppStore, passwordResetRedirectStore } from './stores';

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

				// Two-Factor Authentication table
				twoFactor: twoFactorAuth,

				// OIDC Provider tables
				oauthApplication: oauthApplications,
				oauthAccessToken: oauthAccessTokens,
				oauthAuthorizationCode: oauthAuthorizationCodes,
				oauthConsent: oauthConsents,
			},
		}),

		// Email/password authentication with password reset
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,

			/**
			 * Password Reset Configuration
			 *
			 * Better Auth provides password reset via:
			 * - auth.api.requestPasswordReset({ body: { email } }) - Sends reset email
			 * - auth.api.resetPassword({ body: { newPassword, token } }) - Resets password
			 *
			 * The reset URL is modified to include callbackURL parameter
			 * so users are redirected back to the app they requested reset from.
			 *
			 * @see https://www.better-auth.com/docs/authentication/email-password#password-reset
			 */
			sendResetPassword: async ({
				user,
				url,
			}: {
				user: { email: string; name: string };
				url: string;
			}) => {
				// Check if we have a redirect URL stored for this user's password reset request
				const redirectUrl = passwordResetRedirectStore.get(user.email);

				// Modify reset URL to include callbackURL parameter
				let resetUrl = url;
				if (redirectUrl) {
					const urlObj = new URL(url);
					urlObj.searchParams.set('callbackURL', redirectUrl);
					resetUrl = urlObj.toString();
				}

				await sendPasswordResetEmail(user.email, resetUrl, user.name);
			},
		},

		/**
		 * Email Verification Configuration
		 *
		 * Sends verification email when user registers.
		 * User must verify email before they can log in.
		 *
		 * The verification URL is modified to include redirectTo parameter
		 * so users are redirected back to the app they registered from.
		 */
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({
				user,
				url,
			}: {
				user: { email: string; name: string };
				url: string;
			}) => {
				// Check if we have a source app URL stored for this user
				// Note: We get the URL without deleting it here since it might be needed
				// during the verification process in the passthrough controller
				const sourceAppUrl = sourceAppStore.get(user.email);

				// Modify verification URL to include redirectTo parameter
				let verificationUrl = url;
				if (sourceAppUrl) {
					const urlObj = new URL(url);
					urlObj.searchParams.set('redirectTo', sourceAppUrl);
					verificationUrl = urlObj.toString();
				}

				await sendVerificationEmail(user.email, verificationUrl, user.name);
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
		 * Advanced Cookie Configuration for Cross-Domain SSO
		 *
		 * By setting the cookie domain to '.mana.how', session cookies are shared
		 * across all subdomains (calendar.mana.how, todo.mana.how, etc.).
		 * This enables Single Sign-On: login once, authenticated everywhere.
		 *
		 * For local development (localhost), leave domain undefined to use default behavior.
		 */
		advanced: {
			// Cookie prefix for all auth cookies
			cookiePrefix: 'mana',

			// Cross-subdomain cookie configuration
			crossSubDomainCookies: {
				// Enable cross-subdomain cookies in production
				enabled: !!process.env.COOKIE_DOMAIN,
				// Domain for cookies (e.g., '.mana.how' - note the leading dot)
				domain: process.env.COOKIE_DOMAIN || undefined,
			},

			// Default cookie options for all auth cookies
			defaultCookieAttributes: {
				// Secure in production, allow http in development
				secure: process.env.NODE_ENV === 'production',
				// SameSite=None is required for cross-subdomain SSO via fetch()
				// Lax only sends cookies on top-level navigations, not programmatic fetch()
				// None requires Secure=true (ensured by production check above)
				sameSite: process.env.COOKIE_DOMAIN ? ('none' as const) : ('lax' as const),
				// Cookies accessible to all paths
				path: '/',
				// Prevent JavaScript access to cookies
				httpOnly: true,
			},
		},

		// Trusted origins for cross-origin requests (must match CORS_ORIGINS in production)
		// IMPORTANT: Every app that uses SSO must be listed here, otherwise
		// Better Auth will reject cross-origin requests with credentials.
		// When adding a new app, add its production domain here AND to
		// CORS_ORIGINS in docker-compose.macmini.yml.
		trustedOrigins: [
			// Production domains - auth service
			'https://auth.mana.how',
			'https://mana.how',
			// Production domains - all apps (keep alphabetical)
			'https://calc.mana.how',
			'https://calendar.mana.how',
			'https://chat.mana.how',
			'https://clock.mana.how',
			'https://contacts.mana.how',
			'https://context.mana.how',
			'https://docs.mana.how',
			'https://element.mana.how',
			'https://inventar.mana.how',
			'https://link.mana.how',
			'https://manadeck.mana.how',
			'https://matrix.mana.how',
			'https://mchat.mana.how',
			'https://mukke.mana.how',
			'https://nutriphi.mana.how',
			'https://photos.mana.how',
			'https://picture.mana.how',
			'https://planta.mana.how',
			'https://playground.mana.how',
			'https://presi.mana.how',
			'https://questions.mana.how',
			'https://skilltree.mana.how',
			'https://storage.mana.how',
			'https://taktik.mana.how',
			'https://todo.mana.how',
			'https://traces.mana.how',
			'https://zitare.mana.how',
			// Local development
			'http://localhost:3001',
			'http://localhost:5173',
			'http://localhost:5174',
			'http://localhost:5190',
		],

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
					// For OIDC compatibility, issuer MUST match the discovery document
					// Use BASE_URL to match /.well-known/openid-configuration issuer
					issuer: process.env.BASE_URL || process.env.JWT_ISSUER || 'http://localhost:3001',
					audience: process.env.JWT_AUDIENCE || 'manacore',
					expirationTime: '15m',

					/**
					 * Define minimal JWT payload
					 *
					 * Only includes static user info that doesn't change frequently.
					 */
					definePayload({ user, session }: { user: any; session: any }) {
						return {
							sub: user.id,
							email: user.email,
							role: (user as { role?: string }).role || 'user',
							sid: session.id,
						};
					},
				},
			}),

			/**
			 * OIDC Provider Plugin
			 *
			 * Enables Mana Core Auth to act as an OpenID Connect Provider.
			 * This allows Matrix/Synapse and other services to use SSO.
			 *
			 * Endpoints provided:
			 * - GET /.well-known/openid-configuration
			 * - GET /api/oidc/authorize
			 * - POST /api/oidc/token
			 * - GET /api/oidc/userinfo
			 * - GET /api/oidc/jwks
			 */
			oidcProvider({
				// Login page for OIDC authorization
				loginPage: '/login',
				// Consent page (skipped for trusted clients)
				consentPage: '/consent',
				// Use JWT plugin for token signing (EdDSA instead of HS256)
				// This is required for Synapse OIDC which verifies via JWKS
				useJWTPlugin: true,
				metadata: {
					issuer: process.env.BASE_URL || 'http://localhost:3001',
				},
				// Trusted clients that skip consent screen
				// These clients are considered first-party and don't need user consent
				trustedClients: [
					{
						clientId: 'matrix-synapse',
						clientSecret: process.env.SYNAPSE_OIDC_CLIENT_SECRET || '',
						name: 'Matrix Synapse',
						type: 'web',
						disabled: false,
						metadata: {},
						redirectUrls: ['https://matrix.mana.how/_synapse/client/oidc/callback'],
						skipConsent: true,
					},
				],
			}),
			/**
			 * Two-Factor Authentication Plugin (TOTP)
			 *
			 * Provides TOTP-based 2FA with backup codes.
			 * Endpoints provided automatically by Better Auth passthrough:
			 * - POST /two-factor/enable (requires password)
			 * - POST /two-factor/disable (requires password)
			 * - POST /two-factor/verify-totp (during login)
			 * - POST /two-factor/verify-backup-code (during login)
			 * - POST /two-factor/get-totp-uri
			 * - POST /two-factor/generate-backup-codes
			 */
			twoFactor({
				issuer: 'ManaCore',
			}),
			/**
			 * Magic Link Plugin (Passwordless Email Login)
			 *
			 * Sends a one-time login link via email.
			 * Endpoints via Better Auth passthrough:
			 * - POST /magic-link/send-magic-link
			 * - GET /magic-link/verify (callback from email)
			 */
			magicLink({
				sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
					await sendMagicLinkEmail(email, url);
				},
				expiresIn: 600, // 10 minutes
			}),
		],
	});
}

/**
 * Export type for Better Auth instance
 */
export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
