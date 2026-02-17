import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Plant {
	id: string;
	name: string;
	scientificName?: string;
	commonName?: string;
	species?: string;
	lightRequirements?: 'low' | 'medium' | 'bright' | 'direct';
	wateringFrequencyDays?: number;
	humidity?: 'low' | 'medium' | 'high';
	temperature?: string;
	soilType?: string;
	careNotes?: string;
	healthStatus?: 'healthy' | 'needs_attention' | 'sick';
	acquiredAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface WateringSchedule {
	id: string;
	plantId: string;
	frequencyDays: number;
	lastWateredAt?: string;
	nextWateringAt?: string;
	reminderEnabled: boolean;
}

export interface WateringLog {
	id: string;
	plantId: string;
	wateredAt: string;
	notes?: string;
}

export interface UpcomingWatering {
	plant: Plant;
	schedule: WateringSchedule;
	daysUntilWatering: number;
	isOverdue: boolean;
}

export interface PlantPhoto {
	id: string;
	plantId?: string;
	storagePath: string;
	publicUrl?: string;
	isPrimary: boolean;
	isAnalyzed: boolean;
}

export interface PlantAnalysis {
	id: string;
	photoId: string;
	identifiedSpecies?: string;
	scientificName?: string;
	commonNames?: string[];
	confidence?: number;
	healthAssessment?: string;
	healthDetails?: string;
	issues?: string[];
	wateringAdvice?: string;
	lightAdvice?: string;
	generalTips?: string[];
}

@Injectable()
export class PlantaService {
	private readonly logger = new Logger(PlantaService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl =
			this.configService.get<string>('planta.backendUrl') || 'http://localhost:3022';
		this.apiPrefix = this.configService.get<string>('planta.apiPrefix') || '/api';
	}

	private async request<T>(
		token: string,
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	// Plant operations
	async getPlants(token: string): Promise<{ data?: Plant[]; error?: string }> {
		return this.request<Plant[]>(token, '/plants');
	}

	async getPlant(token: string, plantId: string): Promise<{ data?: Plant; error?: string }> {
		return this.request<Plant>(token, `/plants/${plantId}`);
	}

	async createPlant(
		token: string,
		name: string,
		options: Partial<Plant> = {}
	): Promise<{ data?: Plant; error?: string }> {
		return this.request<Plant>(token, '/plants', {
			method: 'POST',
			body: JSON.stringify({ name, ...options }),
		});
	}

	async updatePlant(
		token: string,
		plantId: string,
		updates: Partial<Plant>
	): Promise<{ data?: Plant; error?: string }> {
		return this.request<Plant>(token, `/plants/${plantId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
	}

	async deletePlant(token: string, plantId: string): Promise<{ error?: string }> {
		return this.request(token, `/plants/${plantId}`, { method: 'DELETE' });
	}

	// Watering operations
	async getUpcomingWaterings(
		token: string
	): Promise<{ data?: UpcomingWatering[]; error?: string }> {
		return this.request<UpcomingWatering[]>(token, '/watering/upcoming');
	}

	async waterPlant(
		token: string,
		plantId: string,
		notes?: string
	): Promise<{ data?: WateringLog; error?: string }> {
		return this.request<WateringLog>(token, `/watering/${plantId}/water`, {
			method: 'POST',
			body: JSON.stringify({ notes }),
		});
	}

	async updateWateringSchedule(
		token: string,
		plantId: string,
		frequencyDays: number
	): Promise<{ data?: WateringSchedule; error?: string }> {
		return this.request<WateringSchedule>(token, `/watering/${plantId}`, {
			method: 'PUT',
			body: JSON.stringify({ frequencyDays }),
		});
	}

	async getWateringHistory(
		token: string,
		plantId: string
	): Promise<{ data?: WateringLog[]; error?: string }> {
		return this.request<WateringLog[]>(token, `/watering/${plantId}/history`);
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Upload a photo for analysis
	 */
	async uploadPhoto(
		token: string,
		imageBuffer: Buffer,
		mimeType: string,
		filename: string,
		plantId?: string
	): Promise<{ data?: PlantPhoto; error?: string }> {
		try {
			const formData = new FormData();
			// Convert Buffer to Blob - use type assertion to bypass strict TypeScript check
			const blob = new Blob([imageBuffer as unknown as BlobPart], { type: mimeType });
			formData.append('file', blob, filename);

			let url = `${this.backendUrl}${this.apiPrefix}/photos/upload`;
			if (plantId) {
				url += `?plantId=${plantId}`;
			}

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error('Photo upload failed:', error);
			return { error: 'Foto-Upload fehlgeschlagen' };
		}
	}

	/**
	 * Analyze a photo with AI
	 */
	async analyzePhoto(
		token: string,
		photoId: string,
		plantId?: string
	): Promise<{ data?: PlantAnalysis; error?: string }> {
		try {
			const body: Record<string, string> = { photoId };
			if (plantId) body.plantId = plantId;

			const response = await fetch(`${this.backendUrl}${this.apiPrefix}/analysis/identify`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error('Photo analysis failed:', error);
			return { error: 'Analyse fehlgeschlagen' };
		}
	}

	/**
	 * Upload and analyze a photo in one step
	 */
	async uploadAndAnalyze(
		token: string,
		imageBuffer: Buffer,
		mimeType: string,
		filename: string,
		plantId?: string
	): Promise<{ data?: PlantAnalysis; error?: string }> {
		// Step 1: Upload
		const uploadResult = await this.uploadPhoto(token, imageBuffer, mimeType, filename, plantId);
		if (uploadResult.error || !uploadResult.data) {
			return { error: uploadResult.error || 'Upload fehlgeschlagen' };
		}

		// Step 2: Analyze
		return this.analyzePhoto(token, uploadResult.data.id, plantId);
	}
}
