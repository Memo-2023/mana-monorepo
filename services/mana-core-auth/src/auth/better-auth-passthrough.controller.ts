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
	constructor(private readonly betterAuthService: BetterAuthService) {}

	/**
	 * Handle email verification
	 *
	 * Better Auth sends verification emails with links to:
	 * {baseURL}/api/auth/verify-email?token=...
	 *
	 * This endpoint calls Better Auth's verifyEmail API and redirects
	 * the user to the appropriate page.
	 */
	@Get('verify-email')
	async verifyEmail(@Query('token') token: string, @Res() res: Response) {
		try {
			if (!token) {
				return res.redirect('/verification-failed?error=missing_token');
			}

			// Call Better Auth's verifyEmail API
			const result = await this.betterAuthService.verifyEmail(token);

			if (result.success) {
				// Redirect to success page (frontend should handle this)
				const frontendUrl = process.env.FRONTEND_URL || 'https://mana.how';
				return res.redirect(`${frontendUrl}/email-verified`);
			} else {
				// Redirect to error page
				const frontendUrl = process.env.FRONTEND_URL || 'https://mana.how';
				return res.redirect(`${frontendUrl}/verification-failed?error=${result.error}`);
			}
		} catch (error) {
			console.error('[verify-email] Error:', error);
			const frontendUrl = process.env.FRONTEND_URL || 'https://mana.how';
			return res.redirect(`${frontendUrl}/verification-failed?error=verification_failed`);
		}
	}
}
