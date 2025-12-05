import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { GoogleService } from './google.service';
import { GoogleCallbackDto, GoogleImportDto } from './dto/google.dto';

@Controller('google')
@UseGuards(JwtAuthGuard)
export class GoogleController {
	constructor(private readonly googleService: GoogleService) {}

	/**
	 * Get OAuth2 authorization URL
	 */
	@Get('auth-url')
	getAuthUrl(@Query('state') state?: string) {
		const url = this.googleService.getAuthUrl(state);
		return { url };
	}

	/**
	 * Handle OAuth2 callback
	 */
	@Post('callback')
	async handleCallback(@CurrentUser() user: CurrentUserData, @Body() dto: GoogleCallbackDto) {
		const account = await this.googleService.handleCallback(user.userId, dto.code);
		return { success: true, account };
	}

	/**
	 * Get connected account status
	 */
	@Get('status')
	async getStatus(@CurrentUser() user: CurrentUserData) {
		const account = await this.googleService.getConnectedAccount(user.userId);
		return {
			connected: !!account,
			account: account
				? {
						id: account.id,
						providerEmail: account.providerEmail,
						createdAt: account.createdAt,
					}
				: null,
		};
	}

	/**
	 * Disconnect Google account
	 */
	@Delete('disconnect')
	async disconnect(@CurrentUser() user: CurrentUserData) {
		await this.googleService.disconnect(user.userId);
		return { success: true };
	}

	/**
	 * Fetch contacts from Google
	 */
	@Get('contacts')
	async fetchContacts(
		@CurrentUser() user: CurrentUserData,
		@Query('pageToken') pageToken?: string
	) {
		return this.googleService.fetchContacts(user.userId, pageToken);
	}

	/**
	 * Import selected Google contacts
	 */
	@Post('import')
	async importContacts(@CurrentUser() user: CurrentUserData, @Body() dto: GoogleImportDto) {
		return this.googleService.importContacts(user.userId, dto.resourceNames, dto.all);
	}
}
