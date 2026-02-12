import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { figures } from '../db/schema';
import type { Figure } from '../db/schema';
import type {
	FigureLanguage,
	FigureRarity,
	FigureStatus,
	CardStyle,
	GeneratedProfile,
} from '@figgos/shared';
import { GeminiService } from './gemini.service';
import { ImageProcessingService } from './image-processing.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class GenerationService {
	private readonly logger = new Logger(GenerationService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private readonly geminiService: GeminiService,
		private readonly imageProcessingService: ImageProcessingService,
		private readonly storageService: StorageService
	) {}

	async generateFigure(
		figureId: string,
		userId: string,
		input: {
			name: string;
			description: string;
			language: FigureLanguage;
			rarity: FigureRarity;
			cardStyle: CardStyle;
			faceImage?: string;
		}
	): Promise<Figure> {
		try {
			// Phase 1: Generate profile via LLM
			await this.updateStatus(figureId, 'generating_profile');
			const profile = await this.geminiService.generateProfile(
				input.name,
				input.description,
				input.rarity,
				input.language
			);

			// Save profile immediately (even if image gen fails, we keep the text)
			await this.updateProfile(figureId, profile);
			await this.updateStatus(figureId, 'generating_image');

			// Phase 2: Generate image
			const itemLabels = profile.items.map((item) => `${item.name} — ${item.description}`);
			const pngBuffer = await this.geminiService.generateImage(
				input.name,
				profile.subtitle,
				profile.visualDescription,
				itemLabels,
				input.cardStyle,
				input.faceImage
			);

			// Phase 3: Process image (bg removal + WebP)
			await this.updateStatus(figureId, 'processing');
			const webpBuffer = await this.imageProcessingService.removeBackground(pngBuffer);

			// Phase 4: Upload to S3
			const imageUrl = await this.storageService.uploadFigureImage(userId, figureId, webpBuffer);

			// Phase 5: Finalize
			const [completed] = await this.db
				.update(figures)
				.set({
					imageUrl,
					status: 'completed',
					updatedAt: new Date(),
				})
				.where(eq(figures.id, figureId))
				.returning();

			this.logger.log(`Figure "${input.name}" generation completed`);
			return completed;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Generation failed for "${input.name}": ${message}`);

			try {
				const [failed] = await this.db
					.update(figures)
					.set({
						status: 'failed',
						errorMessage: message,
						updatedAt: new Date(),
					})
					.where(eq(figures.id, figureId))
					.returning();

				return failed;
			} catch (dbError) {
				this.logger.error(`Failed to update error status for figure ${figureId}`, dbError);
				throw error;
			}
		}
	}

	private async updateStatus(figureId: string, status: FigureStatus): Promise<void> {
		await this.db
			.update(figures)
			.set({ status, updatedAt: new Date() })
			.where(eq(figures.id, figureId));
	}

	private async updateProfile(figureId: string, profile: GeneratedProfile): Promise<void> {
		await this.db
			.update(figures)
			.set({ generatedProfile: profile, updatedAt: new Date() })
			.where(eq(figures.id, figureId));
	}
}
