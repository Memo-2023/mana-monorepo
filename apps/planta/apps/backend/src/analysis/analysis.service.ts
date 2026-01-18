import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { plantAnalyses, plantPhotos } from '../db/schema';
import { VisionService } from './vision.service';
import { PhotoService } from '../photo/photo.service';
import { PlantService } from '../plant/plant.service';

@Injectable()
export class AnalysisService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private visionService: VisionService,
		private photoService: PhotoService,
		private plantService: PlantService
	) {}

	async analyzePhoto(photoId: string, userId: string, plantId?: string) {
		// Get photo
		const photo = await this.photoService.findOne(photoId, userId);

		if (photo.isAnalyzed) {
			// Return existing analysis
			const [existing] = await this.db
				.select()
				.from(plantAnalyses)
				.where(eq(plantAnalyses.photoId, photoId))
				.limit(1);

			if (existing) {
				return existing;
			}
		}

		// Download image for analysis
		const imageBuffer = await this.photoService.getPhotoBuffer(photo.storagePath);

		// Analyze with Gemini Vision
		const result = await this.visionService.analyzePlantImage(
			imageBuffer,
			photo.mimeType || 'image/jpeg'
		);

		if (!result) {
			throw new BadRequestException('Failed to analyze plant image');
		}

		// Store analysis
		const [analysis] = await this.db
			.insert(plantAnalyses)
			.values({
				photoId,
				plantId: plantId || photo.plantId,
				userId,
				identifiedSpecies: result.identification.scientificName,
				scientificName: result.identification.scientificName,
				commonNames: result.identification.commonNames,
				confidence: result.identification.confidence,
				healthAssessment: result.health.status,
				healthDetails: result.health.details,
				issues: result.health.issues,
				wateringAdvice: `Alle ${result.care.wateringFrequencyDays} Tage gießen`,
				lightAdvice: this.formatLightAdvice(result.care.light),
				generalTips: result.care.tips,
				rawResponse: result,
				model: 'gemini-2.0-flash',
			})
			.returning();

		// Mark photo as analyzed
		await this.photoService.markAnalyzed(photoId);

		// If linked to a plant, update plant with analysis data
		const targetPlantId = plantId || photo.plantId;
		if (targetPlantId) {
			await this.plantService.updateFromAnalysis(targetPlantId, {
				scientificName: result.identification.scientificName,
				commonName: result.identification.commonNames[0],
				lightRequirements: result.care.light,
				wateringFrequencyDays: result.care.wateringFrequencyDays,
				humidity: result.care.humidity,
				temperature: result.care.temperature,
				soilType: result.care.soilType,
				careNotes: result.care.tips.join('\n'),
				healthStatus: this.mapHealthStatus(result.health.status),
			});
		}

		return analysis;
	}

	async getAnalysis(photoId: string, userId: string) {
		const [analysis] = await this.db
			.select()
			.from(plantAnalyses)
			.where(eq(plantAnalyses.photoId, photoId))
			.limit(1);

		if (!analysis) {
			throw new NotFoundException('Analysis not found');
		}

		// Verify user owns this analysis
		if (analysis.userId !== userId) {
			throw new NotFoundException('Analysis not found');
		}

		return analysis;
	}

	private formatLightAdvice(light: string): string {
		const lightMap: Record<string, string> = {
			low: 'Wenig Licht - Schattige Standorte geeignet',
			medium: 'Mittleres Licht - Heller Standort ohne direkte Sonne',
			bright: 'Helles Licht - Heller Standort mit indirektem Sonnenlicht',
			direct: 'Direkte Sonne - Sonniger Standort mit direkter Sonneneinstrahlung',
		};
		return lightMap[light] || 'Mittleres Licht empfohlen';
	}

	private mapHealthStatus(assessment: string): string {
		const statusMap: Record<string, string> = {
			healthy: 'healthy',
			minor_issues: 'needs_attention',
			needs_care: 'needs_attention',
			critical: 'sick',
		};
		return statusMap[assessment] || 'healthy';
	}
}
