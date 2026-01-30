import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Model {
	id: string;
	name: string;
	description?: string;
	isDefault?: boolean;
	defaultWidth?: number;
	defaultHeight?: number;
}

export interface GenerateOptions {
	prompt: string;
	negativePrompt?: string;
	modelId?: string;
	width?: number;
	height?: number;
	steps?: number;
	style?: string;
}

export interface GenerateResult {
	generationId: string;
	status: string;
	image?: {
		id: string;
		publicUrl?: string;
		width?: number;
		height?: number;
	};
	creditsUsed?: number;
}

export interface ImageInfo {
	id: string;
	prompt?: string;
	width: number;
	height: number;
	publicUrl?: string;
	createdAt: string;
}

@Injectable()
export class PictureService {
	private readonly logger = new Logger(PictureService.name);
	private readonly backendUrl: string;
	private readonly apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl =
			this.configService.get<string>('picture.backendUrl') || 'http://localhost:3006';
		this.apiPrefix = this.configService.get<string>('picture.apiPrefix') || '/api/v1';
	}

	private getApiUrl(path: string): string {
		return `${this.backendUrl}${this.apiPrefix}${path}`;
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch (error) {
			this.logger.error('Health check failed:', error);
			return false;
		}
	}

	async getModels(): Promise<Model[]> {
		try {
			const response = await fetch(this.getApiUrl('/models'));

			if (!response.ok) {
				throw new Error(`Failed to fetch models: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			this.logger.error('Failed to fetch models:', error);
			throw error;
		}
	}

	async getModel(modelId: string): Promise<Model> {
		try {
			const response = await fetch(this.getApiUrl(`/models/${modelId}`));

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Model not found');
				}
				throw new Error(`Failed to fetch model: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Failed to fetch model ${modelId}:`, error);
			throw error;
		}
	}

	async generateImage(token: string, options: GenerateOptions): Promise<GenerateResult> {
		try {
			// First, get default model if none specified
			let modelId = options.modelId;
			if (!modelId) {
				const models = await this.getModels();
				const defaultModel = models.find((m) => m.isDefault) || models[0];
				if (!defaultModel) {
					throw new Error('No models available');
				}
				modelId = defaultModel.id;
			}

			const response = await fetch(this.getApiUrl('/generate'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					prompt: options.prompt,
					negativePrompt: options.negativePrompt,
					modelId,
					width: options.width,
					height: options.height,
					steps: options.steps,
					style: options.style,
					waitForResult: true, // Sync mode for Matrix bot
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Generation failed: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error('Generation error:', error);
			throw error;
		}
	}

	async getImages(token: string, limit: number = 10): Promise<ImageInfo[]> {
		try {
			const response = await fetch(this.getApiUrl(`/images?limit=${limit}`), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch images: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			this.logger.error('Failed to fetch images:', error);
			throw error;
		}
	}

	async deleteImage(token: string, imageId: string): Promise<void> {
		try {
			const response = await fetch(this.getApiUrl(`/images/${imageId}`), {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to delete image: ${response.status}`);
			}
		} catch (error) {
			this.logger.error(`Failed to delete image ${imageId}:`, error);
			throw error;
		}
	}

	async getCredits(token: string): Promise<number> {
		try {
			// Credits are managed by mana-core, but we can try to get them via the backend
			// If the backend doesn't expose this endpoint, return a placeholder
			const response = await fetch(this.getApiUrl('/credits/balance'), {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				// Credits endpoint might not exist, return placeholder
				return -1;
			}

			const data = await response.json();
			return data.balance ?? data.credits ?? -1;
		} catch (error) {
			this.logger.warn('Failed to fetch credits:', error);
			return -1;
		}
	}
}
