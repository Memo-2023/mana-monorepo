import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { BatchService } from './batch.service';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CreateBatchDto, GetBatchQueryDto } from './dto/batch.dto';

@Controller('batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
	constructor(private readonly batchService: BatchService) {}

	/**
	 * Create a new batch generation
	 */
	@Post()
	async createBatch(@CurrentUser() user: CurrentUserData, @Body() dto: CreateBatchDto) {
		return this.batchService.createBatch(user.userId, dto);
	}

	/**
	 * Get all batches for the current user
	 */
	@Get()
	async getUserBatches(@CurrentUser() user: CurrentUserData, @Query() query: GetBatchQueryDto) {
		return this.batchService.getUserBatches(user.userId, query);
	}

	/**
	 * Get a specific batch by ID with its items
	 */
	@Get(':id')
	async getBatch(@CurrentUser() user: CurrentUserData, @Param('id') batchId: string) {
		return this.batchService.getBatch(batchId, user.userId);
	}

	/**
	 * Get batch progress (for polling)
	 */
	@Get(':id/progress')
	async getBatchProgress(@CurrentUser() user: CurrentUserData, @Param('id') batchId: string) {
		return this.batchService.getBatchProgress(batchId, user.userId);
	}

	/**
	 * Retry failed generations in a batch
	 */
	@Post(':id/retry')
	async retryFailed(@CurrentUser() user: CurrentUserData, @Param('id') batchId: string) {
		return this.batchService.retryFailed(batchId, user.userId);
	}

	/**
	 * Cancel a batch
	 */
	@Post(':id/cancel')
	async cancelBatch(@CurrentUser() user: CurrentUserData, @Param('id') batchId: string) {
		return this.batchService.cancelBatch(batchId, user.userId);
	}

	/**
	 * Delete a batch and all its generations
	 */
	@Delete(':id')
	async deleteBatch(@CurrentUser() user: CurrentUserData, @Param('id') batchId: string) {
		return this.batchService.deleteBatch(batchId, user.userId);
	}
}
