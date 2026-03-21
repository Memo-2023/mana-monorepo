import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import {
	batchGenerations,
	imageGenerations,
	images,
	type BatchGeneration,
	type NewBatchGeneration,
} from '../db/schema';
import { CreateBatchDto, GetBatchQueryDto } from './dto/batch.dto';

export interface BatchWithItems extends BatchGeneration {
	items?: {
		id: string;
		index: number;
		prompt: string;
		status: string;
		errorMessage?: string | null;
		retryCount?: number;
		imageUrl?: string | null;
	}[];
}

@Injectable()
export class BatchService {
	private readonly logger = new Logger(BatchService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	/**
	 * Create a new batch generation
	 */
	async createBatch(userId: string, dto: CreateBatchDto): Promise<BatchWithItems> {
		try {
			// Create the batch record
			const [batch] = await this.db
				.insert(batchGenerations)
				.values({
					userId,
					name: dto.batchName || `Batch ${new Date().toLocaleString()}`,
					totalCount: dto.prompts.length,
					completedCount: 0,
					failedCount: 0,
					processingCount: 0,
					pendingCount: dto.prompts.length,
					status: 'pending',
					modelId: dto.sharedSettings.modelId,
					modelVersion: dto.sharedSettings.modelVersion,
					width: dto.sharedSettings.width,
					height: dto.sharedSettings.height,
					steps: dto.sharedSettings.steps,
					guidanceScale: dto.sharedSettings.guidanceScale,
				} as NewBatchGeneration)
				.returning();

			// Create individual generation records for each prompt
			const generationRecords = dto.prompts.map((prompt, index) => ({
				userId,
				batchId: batch.id,
				prompt: prompt.text,
				negativePrompt: prompt.negativePrompt,
				seed: prompt.seed,
				model: dto.sharedSettings.modelVersion,
				width: dto.sharedSettings.width,
				height: dto.sharedSettings.height,
				steps: dto.sharedSettings.steps,
				guidanceScale: dto.sharedSettings.guidanceScale,
				status: 'pending' as const,
				priority: index,
			}));

			const generations = await this.db
				.insert(imageGenerations)
				.values(generationRecords)
				.returning();

			// Return batch with items
			return {
				...batch,
				items: generations.map((gen, index) => ({
					id: gen.id,
					index,
					prompt: gen.prompt,
					status: gen.status,
					errorMessage: gen.errorMessage,
					retryCount: gen.retryCount,
					imageUrl: null,
				})),
			};
		} catch (error) {
			this.logger.error('Error creating batch', error);
			throw error;
		}
	}

	/**
	 * Get a batch by ID with its items
	 */
	async getBatch(batchId: string, userId: string): Promise<BatchWithItems> {
		try {
			// Get batch
			const [batch] = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.id, batchId))
				.limit(1);

			if (!batch) {
				throw new NotFoundException(`Batch with id ${batchId} not found`);
			}

			if (batch.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Get items with their associated image URLs
			const items = await this.db
				.select({
					id: imageGenerations.id,
					prompt: imageGenerations.prompt,
					status: imageGenerations.status,
					errorMessage: imageGenerations.errorMessage,
					retryCount: imageGenerations.retryCount,
					priority: imageGenerations.priority,
					imageUrl: images.publicUrl,
				})
				.from(imageGenerations)
				.leftJoin(images, eq(images.generationId, imageGenerations.id))
				.where(eq(imageGenerations.batchId, batchId))
				.orderBy(imageGenerations.priority);

			return {
				...batch,
				items: items.map((item, index) => ({
					id: item.id,
					index,
					prompt: item.prompt,
					status: item.status,
					errorMessage: item.errorMessage,
					retryCount: item.retryCount ?? 0,
					imageUrl: item.imageUrl ?? null,
				})),
			};
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error getting batch ${batchId}`, error);
			throw error;
		}
	}

	/**
	 * Get all batches for a user
	 */
	async getUserBatches(userId: string, query: GetBatchQueryDto): Promise<BatchGeneration[]> {
		try {
			const { page = 1, limit = 20 } = query;
			const offset = (page - 1) * limit;

			const batches = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.userId, userId))
				.orderBy(desc(batchGenerations.createdAt))
				.limit(limit)
				.offset(offset);

			return batches;
		} catch (error) {
			this.logger.error('Error getting user batches', error);
			throw error;
		}
	}

	/**
	 * Get batch progress (counts)
	 */
	async getBatchProgress(
		batchId: string,
		userId: string
	): Promise<{
		totalCount: number;
		completedCount: number;
		failedCount: number;
		processingCount: number;
		pendingCount: number;
		status: string;
	}> {
		try {
			// Verify ownership
			const [batch] = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.id, batchId))
				.limit(1);

			if (!batch) {
				throw new NotFoundException(`Batch with id ${batchId} not found`);
			}

			if (batch.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Get actual counts from image_generations
			const counts = await this.db
				.select({
					status: imageGenerations.status,
					count: sql<number>`count(*)`,
				})
				.from(imageGenerations)
				.where(eq(imageGenerations.batchId, batchId))
				.groupBy(imageGenerations.status);

			const statusCounts: Record<string, number> = {};
			counts.forEach((c) => {
				statusCounts[c.status] = Number(c.count);
			});

			const completedCount = statusCounts['completed'] || 0;
			const failedCount = statusCounts['failed'] || 0;
			const processingCount = statusCounts['processing'] || 0;
			const pendingCount = (statusCounts['pending'] || 0) + (statusCounts['queued'] || 0);

			// Determine overall status
			let status: string = batch.status;
			const totalCount = batch.totalCount;

			if (completedCount === totalCount) {
				status = 'completed';
			} else if (failedCount === totalCount) {
				status = 'failed';
			} else if (completedCount > 0 && failedCount > 0) {
				status = 'partial';
			} else if (processingCount > 0 || pendingCount > 0) {
				status = 'processing';
			}

			// Update batch if status changed
			if (status !== batch.status) {
				await this.db
					.update(batchGenerations)
					.set({
						status: status as any,
						completedCount,
						failedCount,
						processingCount,
						pendingCount,
						completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
					})
					.where(eq(batchGenerations.id, batchId));
			}

			return {
				totalCount,
				completedCount,
				failedCount,
				processingCount,
				pendingCount,
				status,
			};
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error getting batch progress ${batchId}`, error);
			throw error;
		}
	}

	/**
	 * Retry failed generations in a batch
	 */
	async retryFailed(batchId: string, userId: string): Promise<{ affected: number }> {
		try {
			// Verify ownership
			const [batch] = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.id, batchId))
				.limit(1);

			if (!batch) {
				throw new NotFoundException(`Batch with id ${batchId} not found`);
			}

			if (batch.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Reset failed generations to pending
			const result = await this.db
				.update(imageGenerations)
				.set({
					status: 'pending',
					errorMessage: null,
					retryCount: 0,
				})
				.where(and(eq(imageGenerations.batchId, batchId), eq(imageGenerations.status, 'failed')))
				.returning();

			// Update batch status
			await this.db
				.update(batchGenerations)
				.set({
					status: 'processing',
					failedCount: 0,
				})
				.where(eq(batchGenerations.id, batchId));

			return { affected: result.length };
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error retrying batch ${batchId}`, error);
			throw error;
		}
	}

	/**
	 * Cancel a batch
	 */
	async cancelBatch(batchId: string, userId: string): Promise<void> {
		try {
			// Verify ownership
			const [batch] = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.id, batchId))
				.limit(1);

			if (!batch) {
				throw new NotFoundException(`Batch with id ${batchId} not found`);
			}

			if (batch.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Cancel pending generations
			await this.db
				.update(imageGenerations)
				.set({
					status: 'cancelled',
					errorMessage: 'Cancelled by user',
				})
				.where(and(eq(imageGenerations.batchId, batchId), eq(imageGenerations.status, 'pending')));

			// Update batch status
			await this.db
				.update(batchGenerations)
				.set({
					status: 'failed',
					completedAt: new Date(),
				})
				.where(eq(batchGenerations.id, batchId));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error cancelling batch ${batchId}`, error);
			throw error;
		}
	}

	/**
	 * Delete a batch and all its generations
	 */
	async deleteBatch(batchId: string, userId: string): Promise<void> {
		try {
			// Verify ownership
			const [batch] = await this.db
				.select()
				.from(batchGenerations)
				.where(eq(batchGenerations.id, batchId))
				.limit(1);

			if (!batch) {
				throw new NotFoundException(`Batch with id ${batchId} not found`);
			}

			if (batch.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Delete generations first
			await this.db.delete(imageGenerations).where(eq(imageGenerations.batchId, batchId));

			// Delete batch
			await this.db.delete(batchGenerations).where(eq(batchGenerations.id, batchId));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error deleting batch ${batchId}`, error);
			throw error;
		}
	}
}
