import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ErrorLogsService } from './error-logs.service';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateErrorLogDto, BatchErrorLogDto } from './dto';

@Controller('api/v1/errors')
export class ErrorLogsController {
	constructor(private readonly errorLogsService: ErrorLogsService) {}

	/**
	 * Create a single error log entry
	 * Authentication is optional - uses user context if available
	 */
	@Post()
	@UseGuards(OptionalAuthGuard)
	async createErrorLog(
		@CurrentUser() user: CurrentUserData | null,
		@Body() dto: CreateErrorLogDto,
		@Headers('x-app-id') appIdHeader?: string
	) {
		return this.errorLogsService.createErrorLog(dto, appIdHeader, user?.userId);
	}

	/**
	 * Create multiple error log entries in batch
	 * Useful for batch reporting of errors (e.g., on app startup or periodic sync)
	 */
	@Post('batch')
	@UseGuards(OptionalAuthGuard)
	async createErrorLogsBatch(
		@CurrentUser() user: CurrentUserData | null,
		@Body() dto: BatchErrorLogDto,
		@Headers('x-app-id') appIdHeader?: string
	) {
		return this.errorLogsService.createErrorLogsBatch(dto.errors, appIdHeader, user?.userId);
	}
}
