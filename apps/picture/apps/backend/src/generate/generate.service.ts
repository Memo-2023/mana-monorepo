import {
	Injectable,
	Inject,
	NotFoundException,
	ForbiddenException,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, desc, sql } from 'drizzle-orm';
import { CreditClientService } from '@manacore/nestjs-integration';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { imageGenerations, images, models } from '../db/schema';
import type { ImageGeneration, Image } from '../db/schema';
import { ReplicateService, GenerationParams } from './replicate.service';
import { StorageService } from '../upload/storage.service';
import { GenerateImageDto } from './dto/generate.dto';

const CREDITS_PER_GENERATION = 10;

export interface GenerateResponse {
	generationId: string;
	status: string;
	image?: Image;
	creditsUsed?: number;
}

@Injectable()
export class GenerateService {
	private readonly logger = new Logger(GenerateService.name);
	private readonly webhookBaseUrl: string;
	private readonly isProduction: boolean;
	private readonly canUseWebhooks: boolean;

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly replicateService: ReplicateService,
		private readonly storageService: StorageService,
		private readonly creditClient: CreditClientService,
		private configService: ConfigService
	) {
		this.webhookBaseUrl =
			this.configService.get<string>('WEBHOOK_BASE_URL') || 'http://localhost:3003';
		// Credit system only enforced in production
		this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
		// Replicate requires HTTPS webhooks - detect if we can use them
		this.canUseWebhooks = this.webhookBaseUrl.startsWith('https://');
		if (!this.canUseWebhooks) {
			this.logger.warn(
				`Webhook URL is not HTTPS (${this.webhookBaseUrl}). Falling back to sync mode for all generations.`
			);
		}
	}

	/**
	 * Check if user has enough credits to generate
	 * Credits are only enforced in production (NODE_ENV=production)
	 */
	async checkGenerationAccess(userId: string): Promise<{
		canGenerate: boolean;
		creditsRequired: number;
		currentBalance?: number;
	}> {
		// In development, skip credit check (users get 150 free credits on signup anyway)
		if (!this.isProduction) {
			return {
				canGenerate: true,
				creditsRequired: CREDITS_PER_GENERATION,
			};
		}

		// In production, check actual credit balance
		try {
			const balance = await this.creditClient.getBalance(userId);
			const hasEnoughCredits = balance.balance >= CREDITS_PER_GENERATION;

			return {
				canGenerate: hasEnoughCredits,
				creditsRequired: CREDITS_PER_GENERATION,
				currentBalance: balance.balance,
			};
		} catch (error) {
			this.logger.warn(`Failed to check credit balance for user ${userId}`, error);
			// On error, allow generation (fail open for better UX)
			return {
				canGenerate: true,
				creditsRequired: CREDITS_PER_GENERATION,
			};
		}
	}

	/**
	 * Generate an image - supports both async (webhook) and sync (polling) modes
	 */
	async generateImage(userId: string, dto: GenerateImageDto): Promise<GenerateResponse> {
		try {
			// Check if user has enough credits (only enforced in production)
			const access = await this.checkGenerationAccess(userId);

			if (!access.canGenerate) {
				throw new HttpException(
					`Insufficient credits. You need ${access.creditsRequired} credits. Current balance: ${access.currentBalance ?? 0}`,
					HttpStatus.PAYMENT_REQUIRED
				);
			}

			// Get model info
			const modelResult = await this.db
				.select()
				.from(models)
				.where(eq(models.id, dto.modelId))
				.limit(1);

			if (modelResult.length === 0) {
				throw new NotFoundException(`Model with id ${dto.modelId} not found`);
			}

			const model = modelResult[0];

			// Create generation record
			const generationResult = await this.db
				.insert(imageGenerations)
				.values({
					userId,
					modelId: dto.modelId,
					prompt: dto.prompt,
					negativePrompt: dto.negativePrompt,
					model: model.name,
					style: dto.style,
					width: dto.width || model.defaultWidth || 1024,
					height: dto.height || model.defaultHeight || 1024,
					steps: dto.steps || model.defaultSteps || 25,
					guidanceScale: dto.guidanceScale || model.defaultGuidanceScale || 7.5,
					seed: dto.seed,
					sourceImageUrl: dto.sourceImageUrl,
					generationStrength: dto.generationStrength,
					status: 'pending',
				})
				.returning();

			const generation = generationResult[0];

			// Build generation params
			const generationParams: GenerationParams = {
				prompt: dto.prompt,
				negativePrompt: dto.negativePrompt,
				modelId: model.replicateId,
				modelVersion: dto.modelVersion || model.version,
				width: dto.width || model.defaultWidth || 1024,
				height: dto.height || model.defaultHeight || 1024,
				steps: dto.steps || model.defaultSteps || 25,
				guidanceScale: dto.guidanceScale || model.defaultGuidanceScale || 7.5,
				seed: dto.seed,
				sourceImageUrl: dto.sourceImageUrl,
				strength: dto.generationStrength,
				style: dto.style,
			};

			// Use sync mode if:
			// 1. Client explicitly requested waitForResult
			// 2. Webhooks are not available (no HTTPS URL)
			const useSyncMode = dto.waitForResult || !this.canUseWebhooks;

			if (useSyncMode) {
				if (!this.canUseWebhooks && !dto.waitForResult) {
					this.logger.debug('Using sync mode because webhooks are not available (no HTTPS)');
				}

				const result = await this.generateSync(generation, generationParams);

				// Consume credits after successful generation (only in production)
				if (result.status === 'completed' && this.isProduction) {
					await this.consumeCreditsForGeneration(userId, generation.id);
					result.creditsUsed = CREDITS_PER_GENERATION;
				}

				return result;
			}

			// Otherwise use async generation with webhook (credits consumed on webhook completion)
			return this.generateAsync(generation, model, generationParams);
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof HttpException) {
				throw error;
			}
			this.logger.error('Error generating image', error);
			throw error;
		}
	}

	/**
	 * Consume credits for a generation
	 */
	private async consumeCreditsForGeneration(userId: string, generationId: string): Promise<void> {
		try {
			await this.creditClient.consumeCredits(
				userId,
				'image_generation',
				CREDITS_PER_GENERATION,
				`Image generation: ${generationId}`
			);
			this.logger.log(`Consumed ${CREDITS_PER_GENERATION} credits for user ${userId}`);
		} catch (error) {
			this.logger.error(`Failed to consume credits for generation ${generationId}`, error);
			// Don't fail the generation if credit consumption fails
		}
	}

	/**
	 * Synchronous generation - polls until complete
	 */
	private async generateSync(
		generation: ImageGeneration,
		params: GenerationParams
	): Promise<GenerateResponse> {
		try {
			// Update status to processing
			await this.db
				.update(imageGenerations)
				.set({ status: 'processing' })
				.where(eq(imageGenerations.id, generation.id));

			// Process generation with polling
			const result = await this.replicateService.processGeneration(params);

			if (!result.success || !result.outputUrl) {
				await this.db
					.update(imageGenerations)
					.set({
						status: 'failed',
						errorMessage: result.error || 'Generation failed',
					})
					.where(eq(imageGenerations.id, generation.id));

				return {
					generationId: generation.id,
					status: 'failed',
				};
			}

			// Download and upload to storage
			const { storagePath, publicUrl } = await this.storageService.uploadFromUrl(
				result.outputUrl,
				generation.userId,
				`generated-${generation.id}.${result.format || 'png'}`
			);

			// Create image record
			const imageResult = await this.db
				.insert(images)
				.values({
					userId: generation.userId,
					generationId: generation.id,
					prompt: generation.prompt,
					negativePrompt: generation.negativePrompt,
					model: generation.model,
					style: generation.style,
					storagePath,
					publicUrl,
					filename: `generated-${generation.id}.${result.format || 'png'}`,
					width: result.width || generation.width,
					height: result.height || generation.height,
					format: result.format || 'png',
				})
				.returning();

			// Update generation as completed
			await this.db
				.update(imageGenerations)
				.set({
					status: 'completed',
					generationTimeSeconds: result.generationTimeSeconds,
					completedAt: new Date(),
				})
				.where(eq(imageGenerations.id, generation.id));

			return {
				generationId: generation.id,
				status: 'completed',
				image: imageResult[0],
			};
		} catch (error) {
			this.logger.error(`Error in sync generation for ${generation.id}`, error);

			await this.db
				.update(imageGenerations)
				.set({
					status: 'failed',
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
				})
				.where(eq(imageGenerations.id, generation.id));

			return {
				generationId: generation.id,
				status: 'failed',
			};
		}
	}

	/**
	 * Async generation - uses webhook for completion
	 */
	private async generateAsync(
		generation: ImageGeneration,
		model: any,
		params: GenerationParams
	): Promise<GenerateResponse> {
		try {
			const webhookUrl = `${this.webhookBaseUrl}/api/generate/webhook`;

			const prediction = await this.replicateService.createPrediction(
				model.replicateId,
				params.modelVersion || model.version || '',
				params,
				webhookUrl
			);

			// Update generation with prediction ID
			await this.db
				.update(imageGenerations)
				.set({
					replicatePredictionId: prediction.id,
					status: 'processing',
				})
				.where(eq(imageGenerations.id, generation.id));

			return {
				generationId: generation.id,
				status: 'processing',
			};
		} catch (error) {
			// Update generation as failed
			await this.db
				.update(imageGenerations)
				.set({
					status: 'failed',
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
				})
				.where(eq(imageGenerations.id, generation.id));

			throw error;
		}
	}

	async checkStatus(
		generationId: string,
		userId: string
	): Promise<ImageGeneration & { image?: Image }> {
		try {
			const result = await this.db
				.select()
				.from(imageGenerations)
				.where(eq(imageGenerations.id, generationId))
				.limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Generation with id ${generationId} not found`);
			}

			const generation = result[0];

			if (generation.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// If still processing, check Replicate status
			if (generation.status === 'processing' && generation.replicatePredictionId) {
				const prediction = await this.replicateService.getPrediction(
					generation.replicatePredictionId
				);

				if (prediction.status === 'succeeded' && prediction.output) {
					// Process the completed generation
					await this.processCompletedGeneration(generation, prediction.output);

					// Refetch the updated generation
					const updatedResult = await this.db
						.select()
						.from(imageGenerations)
						.where(eq(imageGenerations.id, generationId))
						.limit(1);

					const updated = updatedResult[0];

					// Get the created image
					const imageResult = await this.db
						.select()
						.from(images)
						.where(eq(images.generationId, generationId))
						.limit(1);

					return {
						...updated,
						image: imageResult[0],
					};
				} else if (prediction.status === 'failed') {
					await this.db
						.update(imageGenerations)
						.set({
							status: 'failed',
							errorMessage: prediction.error || 'Generation failed',
						})
						.where(eq(imageGenerations.id, generationId));

					return {
						...generation,
						status: 'failed',
						errorMessage: prediction.error || 'Generation failed',
					};
				}
			}

			// Get associated image if completed
			if (generation.status === 'completed') {
				const imageResult = await this.db
					.select()
					.from(images)
					.where(eq(images.generationId, generationId))
					.limit(1);

				return {
					...generation,
					image: imageResult[0],
				};
			}

			return generation;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error checking status for generation ${generationId}`, error);
			throw error;
		}
	}

	async cancelGeneration(generationId: string, userId: string): Promise<void> {
		try {
			const result = await this.db
				.select()
				.from(imageGenerations)
				.where(eq(imageGenerations.id, generationId))
				.limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Generation with id ${generationId} not found`);
			}

			const generation = result[0];

			if (generation.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			if (generation.status !== 'pending' && generation.status !== 'processing') {
				return; // Already completed or failed
			}

			// Cancel on Replicate
			if (generation.replicatePredictionId) {
				try {
					await this.replicateService.cancelPrediction(generation.replicatePredictionId);
				} catch (error) {
					this.logger.warn('Failed to cancel prediction on Replicate', error);
				}
			}

			// Update status
			await this.db
				.update(imageGenerations)
				.set({
					status: 'cancelled',
					errorMessage: 'Cancelled by user',
				})
				.where(eq(imageGenerations.id, generationId));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error cancelling generation ${generationId}`, error);
			throw error;
		}
	}

	/**
	 * Get user's credit balance
	 */
	async getCreditBalance(userId: string): Promise<{
		balance: number;
		totalEarned: number;
		totalSpent: number;
		creditsPerGeneration: number;
	}> {
		const creditBalance = await this.creditClient.getBalance(userId);

		return {
			balance: creditBalance.balance,
			totalEarned: creditBalance.totalEarned,
			totalSpent: creditBalance.totalSpent,
			creditsPerGeneration: CREDITS_PER_GENERATION,
		};
	}

	/**
	 * Get user's generation history with associated images, paginated
	 */
	async getGenerationHistory(
		userId: string,
		page: number,
		limit: number
	): Promise<{
		data: (ImageGeneration & { image?: Image })[];
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	}> {
		const offset = (page - 1) * limit;

		// Get total count
		const countResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(imageGenerations)
			.where(eq(imageGenerations.userId, userId));

		const total = countResult[0]?.count ?? 0;

		// Get paginated generations
		const generations = await this.db
			.select()
			.from(imageGenerations)
			.where(eq(imageGenerations.userId, userId))
			.orderBy(desc(imageGenerations.createdAt))
			.limit(limit)
			.offset(offset);

		// Fetch associated images for completed generations
		const generationIds = generations.filter((g) => g.status === 'completed').map((g) => g.id);

		let imageMap = new Map<string, Image>();

		if (generationIds.length > 0) {
			const generationImages = await this.db
				.select()
				.from(images)
				.where(
					sql`${images.generationId} IN (${sql.join(
						generationIds.map((id) => sql`${id}`),
						sql`, `
					)})`
				);

			for (const img of generationImages) {
				if (img.generationId) {
					imageMap.set(img.generationId, img);
				}
			}
		}

		// Merge images into generations
		const data = generations.map((generation) => ({
			...generation,
			image: imageMap.get(generation.id),
		}));

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async handleWebhook(body: any): Promise<{ received: boolean }> {
		try {
			const { id, status, output, error } = body;

			if (!id) {
				return { received: false };
			}

			// Find the generation by prediction ID
			const result = await this.db
				.select()
				.from(imageGenerations)
				.where(eq(imageGenerations.replicatePredictionId, id))
				.limit(1);

			if (result.length === 0) {
				this.logger.warn(`No generation found for prediction ${id}`);
				return { received: false };
			}

			const generation = result[0];

			if (status === 'succeeded' && output) {
				await this.processCompletedGeneration(generation, output);

				// Consume credits in production
				if (this.isProduction) {
					await this.consumeCreditsForGeneration(generation.userId, generation.id);
				}
			} else if (status === 'failed') {
				await this.db
					.update(imageGenerations)
					.set({
						status: 'failed',
						errorMessage: error || 'Generation failed',
					})
					.where(eq(imageGenerations.id, generation.id));
			}

			return { received: true };
		} catch (error) {
			this.logger.error('Error handling webhook', error);
			return { received: false };
		}
	}

	private async processCompletedGeneration(
		generation: ImageGeneration,
		output: string[] | string | { url?: string }
	): Promise<void> {
		try {
			// Extract output URL
			let imageUrl: string;
			if (Array.isArray(output)) {
				imageUrl = output[0];
			} else if (typeof output === 'string') {
				imageUrl = output;
			} else if (output && typeof output === 'object' && output.url) {
				imageUrl = output.url;
			} else {
				throw new Error('No output URL from generation');
			}

			// Determine format from URL
			let format = 'png';
			if (imageUrl.includes('.webp')) format = 'webp';
			else if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) format = 'jpeg';
			else if (imageUrl.includes('.svg')) format = 'svg';

			// Download and upload to storage
			const { storagePath, publicUrl } = await this.storageService.uploadFromUrl(
				imageUrl,
				generation.userId,
				`generated-${generation.id}.${format}`
			);

			// Create image record and update generation status atomically
			await this.db.transaction(async (tx) => {
				await tx.insert(images).values({
					userId: generation.userId,
					generationId: generation.id,
					prompt: generation.prompt,
					negativePrompt: generation.negativePrompt,
					model: generation.model,
					style: generation.style,
					storagePath,
					publicUrl,
					filename: `generated-${generation.id}.${format}`,
					width: generation.width,
					height: generation.height,
					format,
				});

				await tx
					.update(imageGenerations)
					.set({
						status: 'completed',
						completedAt: new Date(),
					})
					.where(eq(imageGenerations.id, generation.id));
			});
		} catch (error) {
			this.logger.error(`Error processing completed generation ${generation.id}`, error);

			await this.db
				.update(imageGenerations)
				.set({
					status: 'failed',
					errorMessage: error instanceof Error ? error.message : 'Processing failed',
				})
				.where(eq(imageGenerations.id, generation.id));
		}
	}
}
