import { Controller, Post, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
	constructor(private readonly syncService: SyncService) {}

	@Post('accounts/:accountId')
	async syncAccount(
		@CurrentUser() user: CurrentUserData,
		@Param('accountId', ParseUUIDPipe) accountId: string
	) {
		const result = await this.syncService.syncAccount(accountId, user.userId);
		return result;
	}

	@Post('accounts/:accountId/folders/:folderId')
	async syncFolder(
		@CurrentUser() user: CurrentUserData,
		@Param('accountId', ParseUUIDPipe) accountId: string,
		@Param('folderId', ParseUUIDPipe) folderId: string
	) {
		const result = await this.syncService.syncFolder(accountId, user.userId, folderId);
		return result;
	}

	@Post('emails/:emailId/fetch')
	async fetchFullEmail(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string
	) {
		// Get the email to find its account
		await this.syncService.fetchFullEmail('', user.userId, emailId);
		return { success: true };
	}
}
