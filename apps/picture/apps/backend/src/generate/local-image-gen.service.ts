import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GenerationParams, GenerationResult } from './replicate.service';

/**
 * Local image generation service using mana-image-gen (FLUX.2 klein).
 * Runs on the Mac Mini, ~0.8s per 1024x1024 image.
 *
 * API: POST http://localhost:3025/generate
 * Images: GET http://localhost:3025/images/{filename}
 */
@Injectable()
export class LocalImageGenService {
	private readonly logger = new Logger(LocalImageGenService.name);
	private readonly baseUrl: string;
	private readonly timeout: number;
	private isAvailable = false;

	constructor(private configService: ConfigService) {
		this.baseUrl =
			this.configService.get<string>('IMAGE_GEN_SERVICE_URL') || 'http://localhost:3025';
		this.timeout = 60_000; // 60s (FLUX.2 klein is fast, but allow margin)
		this.checkHealth();
	}

	private async checkHealth(): Promise<void> {
		try {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`${this.baseUrl}/health`, {
				signal: controller.signal,
			});
			if (response.ok) {
				const data = await response.json();
				this.isAvailable = data.flux_available === true;
				if (this.isAvailable) {
					this.logger.log(`mana-image-gen connected at ${this.baseUrl}`);
				} else {
					this.logger.warn('mana-image-gen is running but FLUX model not loaded');
				}
			}
		} catch {
			this.isAvailable = false;
			this.logger.warn(`mana-image-gen not available at ${this.baseUrl}`);
		}
	}

	getIsAvailable(): boolean {
		return this.isAvailable;
	}

	/**
	 * Generate an image using the local FLUX.2 klein model.
	 * Compatible with ReplicateService.processGeneration() return type.
	 */
	async processGeneration(params: GenerationParams): Promise<GenerationResult> {
		const startTime = Date.now();

		try {
			this.logger.log(`Local generation: ${params.prompt.substring(0, 80)}...`);

			const controller = new AbortController();
			setTimeout(() => controller.abort(), this.timeout);

			const response = await fetch(`${this.baseUrl}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: params.prompt,
					width: params.width || 1024,
					height: params.height || 1024,
					steps: Math.min(params.steps || 4, 8), // FLUX.2 klein optimal at 4 steps, max 8
					seed: params.seed ?? -1,
					output_format: 'png',
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				this.logger.error(`mana-image-gen error: ${response.status} - ${errorText}`);
				return {
					success: false,
					error: `Local generation failed: ${response.status}`,
				};
			}

			const data = await response.json();
			const generationTimeSeconds = (Date.now() - startTime) / 1000;

			if (!data.success || !data.image_url) {
				return {
					success: false,
					error: data.error || 'No image generated',
				};
			}

			// image_url is relative (e.g., "/images/abc123.png") — make absolute
			const imageUrl = data.image_url.startsWith('http')
				? data.image_url
				: `${this.baseUrl}${data.image_url}`;

			this.logger.log(
				`Local generation complete: ${data.width}x${data.height} in ${data.generation_time?.toFixed(2) ?? generationTimeSeconds.toFixed(2)}s`
			);

			return {
				success: true,
				outputUrl: imageUrl,
				format: 'png',
				width: data.width || params.width,
				height: data.height || params.height,
				generationTimeSeconds: data.generation_time ?? generationTimeSeconds,
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Local generation failed: ${msg}`);

			// Mark as unavailable if connection failed
			if (msg.includes('abort') || msg.includes('ECONNREFUSED')) {
				this.isAvailable = false;
			}

			return {
				success: false,
				error: `Local generation failed: ${msg}`,
			};
		}
	}
}
