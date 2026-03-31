import { Controller, Post, Body, UseGuards, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { AudioCleanupService } from './audio-cleanup.service';
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { CleanupResult } from './interfaces/cleanup.interfaces';

/**
 * Controller for audio cleanup operations.
 * Protected by InternalServiceGuard - only accessible via internal API key.
 */
@Controller('cleanup')
export class AudioCleanupController {
	private readonly logger = new Logger(AudioCleanupController.name);

	constructor(private readonly audioCleanupService: AudioCleanupService) {}

	/**
	 * Trigger the full cleanup job.
	 * Called by pg_cron or manually for testing.
	 * Fetches users with cleanup enabled and processes their old audio files.
	 */
	@Post('trigger-from-cron')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	async triggerFromCron(): Promise<CleanupResult> {
		this.logger.log('Cleanup triggered from cron job');
		return this.audioCleanupService.runCleanup();
	}

	/**
	 * Process cleanup for specific user IDs.
	 * Used when the caller already knows which users to process.
	 */
	@Post('process-old-audios')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	async processOldAudios(@Body() body: { userIds: string[] }): Promise<CleanupResult> {
		this.logger.log(`Processing cleanup for ${body.userIds?.length || 0} users`);

		if (!body.userIds || body.userIds.length === 0) {
			return {
				success: true,
				usersProcessed: 0,
				filesDeleted: 0,
				filesFailed: 0,
				errors: [],
				startedAt: new Date().toISOString(),
				completedAt: new Date().toISOString(),
			};
		}

		return this.audioCleanupService.deleteOldAudiosForUsers(body.userIds);
	}

	/**
	 * Manual trigger for testing/admin purposes.
	 * Same as trigger-from-cron but with a different endpoint name for clarity.
	 */
	@Post('trigger-manual')
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	async triggerManual(): Promise<CleanupResult> {
		this.logger.log('Cleanup triggered manually');
		return this.audioCleanupService.runCleanup();
	}
}
