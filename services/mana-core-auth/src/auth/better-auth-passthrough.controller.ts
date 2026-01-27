/**
 * Better Auth Passthrough Controller
 *
 * This controller handles Better Auth's native routes that are generated
 * with the `/api/auth/*` prefix (without the NestJS `/api/v1` prefix).
 *
 * Routes handled:
 * - GET /api/auth/verify-email - Email verification from verification emails
 *
 * This is necessary because Better Auth generates URLs with `/api/auth/*`
 * but our NestJS API uses `/api/v1/*` as the global prefix.
 */

import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BetterAuthService } from './services/better-auth.service';

@Controller('api/auth')
export class BetterAuthPassthroughController {
	private readonly defaultFrontendUrl = 'https://mana.how';

	constructor(private readonly betterAuthService: BetterAuthService) {}

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
			console.error('[verify-email] Error:', error);
			return res.redirect(`${fallbackUrl}/verification-failed?error=verification_failed`);
		}
	}
}
