import { Controller, Get, Post, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { GoogleOAuthService } from './google-oauth.service';
import { MicrosoftOAuthService } from './microsoft-oauth.service';
import { AccountService } from '../account/account.service';

@Controller('oauth')
export class OAuthController {
	constructor(
		private readonly googleOAuthService: GoogleOAuthService,
		private readonly microsoftOAuthService: MicrosoftOAuthService,
		private readonly accountService: AccountService
	) {}

	// ==================== Google OAuth ====================

	@Post('google/init')
	@UseGuards(JwtAuthGuard)
	async initGoogleOAuth(@CurrentUser() user: CurrentUserData) {
		if (!this.googleOAuthService.isConfigured()) {
			throw new BadRequestException(
				'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.'
			);
		}

		const authUrl = this.googleOAuthService.getAuthUrl(user.userId);
		return { authUrl };
	}

	@Get('google/callback')
	async googleCallback(
		@Query('code') code: string,
		@Query('state') state: string,
		@Query('error') error: string,
		@Res() res: Response
	) {
		// Redirect URL for the frontend
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5186';

		if (error) {
			return res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(error)}`);
		}

		if (!code || !state) {
			return res.redirect(`${frontendUrl}/accounts?error=missing_params`);
		}

		try {
			const { userId, tokens, userInfo } = await this.googleOAuthService.handleCallback(
				code,
				state
			);

			// Create the email account
			await this.accountService.create({
				userId,
				name: userInfo.name || userInfo.email,
				email: userInfo.email,
				provider: 'gmail',
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				tokenExpiresAt: tokens.expiresAt,
				tokenScopes: tokens.scopes,
				syncEnabled: true,
			});

			return res.redirect(`${frontendUrl}/accounts?success=gmail_connected`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			return res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(message)}`);
		}
	}

	// ==================== Microsoft OAuth ====================

	@Post('microsoft/init')
	@UseGuards(JwtAuthGuard)
	async initMicrosoftOAuth(@CurrentUser() user: CurrentUserData) {
		if (!this.microsoftOAuthService.isConfigured()) {
			throw new BadRequestException(
				'Microsoft OAuth is not configured. Please set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REDIRECT_URI.'
			);
		}

		const authUrl = this.microsoftOAuthService.getAuthUrl(user.userId);
		return { authUrl };
	}

	@Get('microsoft/callback')
	async microsoftCallback(
		@Query('code') code: string,
		@Query('state') state: string,
		@Query('error') error: string,
		@Query('error_description') errorDescription: string,
		@Res() res: Response
	) {
		// Redirect URL for the frontend
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5186';

		if (error) {
			const message = errorDescription || error;
			return res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(message)}`);
		}

		if (!code || !state) {
			return res.redirect(`${frontendUrl}/accounts?error=missing_params`);
		}

		try {
			const { userId, tokens, userInfo } = await this.microsoftOAuthService.handleCallback(
				code,
				state
			);

			// Create the email account
			await this.accountService.create({
				userId,
				name: userInfo.name || userInfo.email,
				email: userInfo.email,
				provider: 'outlook',
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				tokenExpiresAt: tokens.expiresAt,
				tokenScopes: tokens.scopes,
				syncEnabled: true,
			});

			return res.redirect(`${frontendUrl}/accounts?success=outlook_connected`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			return res.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(message)}`);
		}
	}

	// ==================== Status ====================

	@Get('status')
	@UseGuards(JwtAuthGuard)
	async getOAuthStatus() {
		return {
			google: {
				configured: this.googleOAuthService.isConfigured(),
			},
			microsoft: {
				configured: this.microsoftOAuthService.isConfigured(),
			},
		};
	}
}
