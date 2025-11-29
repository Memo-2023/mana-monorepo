import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import {
	SyncPushDto,
	SyncPushResponse,
	SyncPullQueryDto,
	SyncPullResponse,
	SyncStatusResponse,
} from './dto/sync.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
	constructor(private readonly syncService: SyncService) {}

	/**
	 * Push local changes to server
	 * POST /api/sync/push
	 */
	@Post('push')
	async pushChanges(
		@Body() dto: SyncPushDto,
		@CurrentUser() user: CurrentUserData
	): Promise<SyncPushResponse> {
		return this.syncService.pushChanges(user.userId, dto);
	}

	/**
	 * Pull changes from server
	 * GET /api/sync/pull?since=2024-01-01T00:00:00Z
	 */
	@Get('pull')
	async pullChanges(
		@Query() query: SyncPullQueryDto,
		@CurrentUser() user: CurrentUserData
	): Promise<SyncPullResponse> {
		return this.syncService.pullChanges(user.userId, query.since);
	}

	/**
	 * Get sync status
	 * GET /api/sync/status
	 */
	@Get('status')
	async getStatus(@CurrentUser() user: CurrentUserData): Promise<SyncStatusResponse> {
		return this.syncService.getStatus(user.userId);
	}
}
