/**
 * Better Auth Passthrough Controller
 *
 * This controller handles Better Auth's native routes that are generated
 * with the `/api/auth/*` prefix (without the NestJS `/api/v1` prefix).
 *
 * Routes handled:
 * - GET /api/auth/get-session - SSO session check (cookie-based)
 * - GET /api/auth/verify-email - Email verification from verification emails
 * - GET /api/auth/reset-password/:token - Password reset from reset emails
 *
 * This is necessary because Better Auth generates URLs with `/api/auth/*`
 * but our NestJS API uses `/api/v1/*` as the global prefix.
 */

import { Controller, Get, Post, All, Param, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { BetterAuthService } from './services/better-auth.service';
import { LoggerService } from '../common/logger';

@Controller('api/auth')
export class BetterAuthPassthroughController {
	private readonly defaultFrontendUrl = 'https://mana.how';
	private readonly logger: LoggerService;

	constructor(
		private readonly betterAuthService: BetterAuthService,
		private readonly configService: ConfigService,
		loggerService: LoggerService
	) {
		this.logger = loggerService.setContext('BetterAuthPassthrough');
	}

	/**
	 * Forward requests to Better Auth's handler
	 *
	 * Converts Express request to Fetch Request and passes it to Better Auth.
	 * Copies response status, headers (including Set-Cookie), and body back.
	 */
	private async forwardToBetterAuth(req: Request, res: Response) {
		const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
		const url = new URL(req.originalUrl, baseUrl);

		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value && typeof value === 'string') {
				headers.set(key, value);
			} else if (Array.isArray(value)) {
				headers.set(key, value[0]);
			}
		}

		const fetchRequest = new Request(url.toString(), {
			method: req.method,
			headers,
			body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
		});

		const handler = this.betterAuthService.getHandler();
		const response = await handler(fetchRequest);

		res.status(response.status);

		response.headers.forEach((value: string, key: string) => {
			if (key.toLowerCase() === 'set-cookie') {
				res.append(key, value);
			} else {
				res.setHeader(key, value);
			}
		});

		const body = await response.text();
		try {
			return res.json(JSON.parse(body));
		} catch {
			return res.send(body);
		}
	}

	/**
	 * Two-Factor Authentication passthrough
	 *
	 * Forwards all /api/auth/two-factor/* requests to Better Auth's handler.
	 * The twoFactor plugin registers these routes:
	 * - POST /two-factor/enable
	 * - POST /two-factor/disable
	 * - POST /two-factor/verify-totp
	 * - POST /two-factor/verify-backup-code
	 * - POST /two-factor/get-totp-uri
	 * - POST /two-factor/generate-backup-codes
	 */
	@All('two-factor/*')
	async twoFactorPassthrough(@Req() req: Request, @Res() res: Response) {
		try {
			return await this.forwardToBetterAuth(req, res);
		} catch (error) {
			this.logger.error(
				'Two-factor passthrough failed',
				error instanceof Error ? error.stack : undefined
			);
			return res.status(500).json({ error: 'Two-factor request failed' });
		}
	}

	/**
	 * Magic Link passthrough
	 *
	 * Forwards all /api/auth/magic-link/* requests to Better Auth's handler.
	 * The magicLink plugin registers these routes:
	 * - POST /magic-link/send-magic-link
	 * - GET /magic-link/verify (callback from email)
	 */
	@All('magic-link/*')
	async handleMagicLink(@Req() req: Request, @Res() res: Response) {
		try {
			return await this.forwardToBetterAuth(req, res);
		} catch (error) {
			this.logger.error(
				'Magic link passthrough failed',
				error instanceof Error ? error.stack : undefined
			);
			return res.status(500).json({ error: 'Magic link request failed' });
		}
	}

	/**
	 * Handle SSO get-session request
	 *
	 * This endpoint is called by client apps to check if the user has a valid
	 * session cookie (set by auth.mana.how). Used for cross-subdomain SSO.
	 *
	 * The request includes cookies, and we forward them to Better Auth's handler.
	 */
	@Get('get-session')
	async getSession(@Req() req: Request, @Res() res: Response) {
		try {
			// Build the cookie header from Express request
			const cookieHeader = req.headers.cookie || '';

			// Get the base URL from config
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const url = new URL('/api/auth/get-session', baseUrl);

			// Create a fetch Request with the cookies
			const headers = new Headers({
				Cookie: cookieHeader,
			});

			const fetchRequest = new Request(url.toString(), {
				method: 'GET',
				headers,
			});

			// Forward to Better Auth's handler
			const handler = this.betterAuthService.getHandler();
			const response = await handler(fetchRequest);

			// Copy status and body to Express response
			const body = await response.json();
			return res.status(response.status).json(body);
		} catch (error) {
			this.logger.error('SSO get-session failed', error instanceof Error ? error.stack : undefined);
			return res.status(401).json({ error: 'Session check failed' });
		}
	}

	/**
	 * Validate redirect URL for security
	 *
	 * Only allows redirects to:
	 * - *.mana.how domains
	 * - mana.how (main domain)
	 * - localhost (for development)
	 *
	 * @param redirectTo - URL to validate
	 * @returns Validated origin URL or null if invalid
	 */
	private validateRedirectUrl(redirectTo?: string): string | null {
		if (!redirectTo) return null;

		try {
			const url = new URL(redirectTo);

			// Allow *.mana.how, mana.how, and localhost
			if (
				url.hostname.endsWith('.mana.how') ||
				url.hostname === 'mana.how' ||
				url.hostname === 'localhost'
			) {
				return url.origin;
			}
		} catch {
			// Invalid URL, return null
		}

		return null;
	}

	/**
	 * Handle email verification
	 *
	 * Better Auth sends verification emails with links to:
	 * {baseURL}/api/auth/verify-email?token=...&redirectTo=...
	 *
	 * This endpoint:
	 * 1. Calls Better Auth's verifyEmail API
	 * 2. Gets the source app URL from the store (set during registration)
	 * 3. Redirects the user to the app's login page with verified=true and email
	 */
	@Get('verify-email')
	async verifyEmail(
		@Query('token') token: string,
		@Query('redirectTo') redirectTo: string | undefined,
		@Res() res: Response
	) {
		const fallbackUrl = process.env.FRONTEND_URL || this.defaultFrontendUrl;

		try {
			if (!token) {
				return res.redirect(`${fallbackUrl}/verification-failed?error=missing_token`);
			}

			// Call Better Auth's verifyEmail API
			const result = await this.betterAuthService.verifyEmail(token);

			if (result.success) {
				const email = result.email || '';

				// Determine redirect URL:
				// 1. First try the redirectTo query param (passed through URL)
				// 2. Then try the sourceAppStore (set during registration)
				// 3. Finally fall back to default frontend URL
				let baseUrl = this.validateRedirectUrl(redirectTo);

				if (!baseUrl && email) {
					// Try to get source app URL from store (set during registration)
					const storedUrl = this.betterAuthService.getSourceAppUrl(email);
					baseUrl = this.validateRedirectUrl(storedUrl || undefined);
				}

				if (!baseUrl) {
					baseUrl = fallbackUrl;
				}

				// Redirect to app's login page with verified=true and email
				const loginUrl = new URL('/login', baseUrl);
				loginUrl.searchParams.set('verified', 'true');
				if (email) {
					loginUrl.searchParams.set('email', email);
				}

				return res.redirect(loginUrl.toString());
			} else {
				// Redirect to error page
				return res.redirect(`${fallbackUrl}/verification-failed?error=${result.error}`);
			}
		} catch (error) {
			this.logger.error(
				'Email verification failed',
				error instanceof Error ? error.stack : undefined
			);
			return res.redirect(`${fallbackUrl}/verification-failed?error=verification_failed`);
		}
	}

	/**
	 * Handle password reset link from email
	 *
	 * Better Auth sends password reset emails with links to:
	 * {baseURL}/api/auth/reset-password/{token}?callbackURL=...
	 *
	 * This endpoint:
	 * 1. Extracts the reset token from the URL
	 * 2. Redirects the user to the frontend /reset-password page with the token
	 * 3. The frontend then shows a form to enter the new password
	 * 4. Frontend submits to POST /api/v1/auth/reset-password with token + newPassword
	 */
	@Get('reset-password/:token')
	async resetPassword(
		@Param('token') token: string,
		@Query('callbackURL') callbackURL: string | undefined,
		@Res() res: Response
	) {
		const fallbackUrl = process.env.FRONTEND_URL || this.defaultFrontendUrl;

		try {
			if (!token) {
				return res.redirect(`${fallbackUrl}/login?error=missing_reset_token`);
			}

			// Determine redirect URL:
			// 1. First try the callbackURL query param (from the email link)
			// 2. Fall back to default frontend URL
			let baseUrl = this.validateRedirectUrl(callbackURL);

			if (!baseUrl) {
				baseUrl = fallbackUrl;
			}

			// Redirect to frontend's reset-password page with token
			const resetUrl = new URL('/reset-password', baseUrl);
			resetUrl.searchParams.set('token', token);

			this.logger.debug('Password reset redirect', { destination: baseUrl });
			return res.redirect(resetUrl.toString());
		} catch (error) {
			this.logger.error(
				'Password reset redirect failed',
				error instanceof Error ? error.stack : undefined
			);
			return res.redirect(`${fallbackUrl}/login?error=reset_failed`);
		}
	}
}
