import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';

export interface GenerationParams {
	prompt: string;
	negativePrompt?: string | null;
	modelId: string;
	modelVersion?: string | null;
	width: number;
	height: number;
	steps: number;
	guidanceScale: number;
	seed?: number | null;
	sourceImageUrl?: string | null;
	strength?: number | null;
	style?: string | null;
}

export interface GenerationResult {
	success: boolean;
	outputUrl?: string;
	format?: string;
	width?: number;
	height?: number;
	error?: string;
	generationTimeSeconds?: number;
}

export interface Prediction {
	id: string;
	status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
	output?: string[] | string | { url?: string };
	error?: string;
	metrics?: {
		predict_time?: number;
	};
}

@Injectable()
export class ReplicateService {
	private readonly logger = new Logger(ReplicateService.name);
	private replicate: Replicate | null = null;
	private readonly apiToken: string | undefined;

	constructor(private configService: ConfigService) {
		this.apiToken = this.configService.get<string>('REPLICATE_API_TOKEN');
		if (this.apiToken) {
			this.replicate = new Replicate({ auth: this.apiToken });
		} else {
			this.logger.warn('REPLICATE_API_TOKEN not configured');
		}
	}

	/**
	 * Calculate greatest common divisor for aspect ratio simplification
	 */
	private gcd(a: number, b: number): number {
		return b === 0 ? a : this.gcd(b, a % b);
	}

	/**
	 * Simplify aspect ratio to smallest whole numbers (e.g., 1920:1080 -> 16:9)
	 */
	private simplifyAspectRatio(width: number, height: number): string {
		const divisor = this.gcd(width, height);
		const simplifiedWidth = width / divisor;
		const simplifiedHeight = height / divisor;
		return `${simplifiedWidth}:${simplifiedHeight}`;
	}

	/**
	 * Convert image URL to base64 data URI for img2img
	 */
	private async convertImageToBase64(imageUrl: string): Promise<string> {
		this.logger.debug(`Converting image to base64: ${imageUrl}`);

		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			throw new Error('Failed to fetch source image');
		}

		const imageBuffer = await imageResponse.arrayBuffer();
		const base64String = Buffer.from(imageBuffer).toString('base64');
		const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
		const dataUri = `data:${contentType};base64,${base64String}`;

		this.logger.debug(`Image converted to base64, length: ${dataUri.length}`);
		return dataUri;
	}

	/**
	 * Build model-specific input parameters for Replicate API
	 */
	private buildModelInput(
		params: GenerationParams,
		sourceImageBase64?: string | null
	): { input: any; finalWidth: number; finalHeight: number } {
		const { prompt, modelId, width, height, steps, guidanceScale, seed, strength } = params;

		let finalWidth = width;
		let finalHeight = height;
		const simplifiedRatio = this.simplifyAspectRatio(width, height);

		this.logger.debug(`Building input for model: ${modelId}`);
		this.logger.debug(`Dimensions: ${finalWidth}x${finalHeight}`);
		this.logger.debug(`Aspect ratio: ${simplifiedRatio}`);

		let input: any = {};

		// FLUX Schnell - Uses aspect_ratio with specific supported ratios
		if (modelId.includes('flux-schnell')) {
			const supportedRatios = [
				'1:1',
				'16:9',
				'21:9',
				'3:2',
				'2:3',
				'4:5',
				'5:4',
				'3:4',
				'4:3',
				'9:16',
				'9:21',
			];

			// Find closest supported ratio
			let fluxAspectRatio = simplifiedRatio;
			if (!supportedRatios.includes(simplifiedRatio)) {
				const [w, h] = simplifiedRatio.split(':').map(Number);
				const targetRatio = w / h;

				let closestRatio = '1:1';
				let minDiff = Infinity;

				for (const ratio of supportedRatios) {
					const [rw, rh] = ratio.split(':').map(Number);
					const r = rw / rh;
					const diff = Math.abs(r - targetRatio);
					if (diff < minDiff) {
						minDiff = diff;
						closestRatio = ratio;
					}
				}

				fluxAspectRatio = closestRatio;
				this.logger.debug(
					`Mapped ${simplifiedRatio} to closest supported ratio: ${fluxAspectRatio}`
				);
			}

			// Calculate actual dimensions (Flux Schnell uses 1024px on shorter side)
			const [aspectW, aspectH] = fluxAspectRatio.split(':').map(Number);
			if (aspectW > aspectH) {
				finalHeight = 1024;
				finalWidth = Math.round((finalHeight * aspectW) / aspectH);
			} else if (aspectW < aspectH) {
				finalWidth = 1024;
				finalHeight = Math.round((finalWidth * aspectH) / aspectW);
			} else {
				finalWidth = 1024;
				finalHeight = 1024;
			}

			input = {
				prompt,
				num_inference_steps: steps,
				guidance: guidanceScale,
				num_outputs: 1,
				aspect_ratio: fluxAspectRatio,
				output_format: 'webp',
				output_quality: 90,
			};
		}
		// FLUX Dev / FLUX Krea Dev - Supports dimensions and img2img
		else if (modelId.includes('flux-krea-dev') || modelId.includes('flux-dev')) {
			input = {
				prompt,
				num_inference_steps: steps,
				guidance_scale: guidanceScale,
				num_outputs: 1,
				width: finalWidth,
				height: finalHeight,
				output_format: 'webp',
				output_quality: 90,
			};

			if (sourceImageBase64 && strength !== null && strength !== undefined) {
				input.image = sourceImageBase64;
				input.prompt_strength = 1 - strength; // Flux uses inverse
				this.logger.debug(
					`Added img2img params for Flux Dev, prompt_strength: ${input.prompt_strength}`
				);
			}
		}
		// Ideogram V3 Turbo - Uses aspect_ratio
		else if (modelId.includes('ideogram-v3-turbo') || modelId.includes('ideogram')) {
			input = {
				prompt,
				aspect_ratio: simplifiedRatio,
				model: 'turbo',
				style_type: 'auto',
			};
			if (seed) input.seed = seed;
		}
		// Imagen 4 Fast - Uses aspect_ratio
		else if (modelId.includes('imagen-4-fast') || modelId.includes('imagen')) {
			input = {
				prompt,
				aspect_ratio: simplifiedRatio,
				safety_tolerance: 2,
				output_format: 'png',
			};
		}
		// SDXL Lightning - 4 steps, no guidance, supports img2img
		else if (modelId.includes('sdxl-lightning')) {
			input = {
				prompt,
				width: finalWidth,
				height: finalHeight,
				num_inference_steps: 4, // Always 4 for Lightning
				guidance_scale: 0, // No guidance for Lightning
				disable_safety_checker: false,
				output_format: 'webp',
				output_quality: 90,
			};

			if (sourceImageBase64 && strength !== null && strength !== undefined) {
				input.image = sourceImageBase64;
				input.strength = strength;
				this.logger.debug(`Added img2img params for SDXL Lightning, strength: ${input.strength}`);
			}

			if (seed) input.seed = seed;
		}
		// Regular SDXL - Full parameters, supports img2img
		else if (modelId.includes('sdxl')) {
			input = {
				prompt,
				width: finalWidth,
				height: finalHeight,
				num_inference_steps: steps,
				guidance_scale: guidanceScale,
				refine: 'expert_ensemble_refiner',
				high_noise_frac: 0.8,
				output_format: 'webp',
				output_quality: 90,
			};

			if (sourceImageBase64 && strength !== null && strength !== undefined) {
				input.image = sourceImageBase64;
				input.prompt_strength = strength;
				this.logger.debug(
					`Added img2img params for SDXL, prompt_strength: ${input.prompt_strength}`
				);
			}

			if (seed) input.seed = seed;
		}
		// SeeDream 4 - Uses size preset and aspect_ratio
		else if (modelId.includes('seedream-4')) {
			let sizePreset = '2K';
			if (finalWidth >= 4096 || finalHeight >= 4096) {
				sizePreset = '4K';
			} else if (finalWidth <= 1024 && finalHeight <= 1024) {
				sizePreset = '1K';
			}

			input = {
				prompt,
				size: sizePreset,
				width: finalWidth,
				height: finalHeight,
				max_images: 1,
				aspect_ratio: simplifiedRatio,
			};

			if (sourceImageBase64 && strength !== null && strength !== undefined) {
				input.image_input = [sourceImageBase64];
				this.logger.debug('Added img2img params for SeeDream 4');
			}
		}
		// SeeDream 3 - Standard dimensions
		else if (modelId.includes('seedream-3') || modelId.includes('seedream')) {
			input = {
				prompt,
				width: finalWidth,
				height: finalHeight,
				num_inference_steps: steps,
				guidance_scale: guidanceScale,
			};
			if (seed) input.seed = seed;
		}
		// FLUX 1.1 Pro - Uses aspect_ratio
		else if (modelId.includes('flux-1.1-pro')) {
			input = {
				prompt,
				aspect_ratio: simplifiedRatio,
				output_format: 'webp',
				output_quality: 90,
				safety_tolerance: 2,
			};
			if (seed) input.seed = seed;
		}
		// Recraft V3 SVG - Vector output
		else if (modelId.includes('recraft-v3-svg')) {
			input = {
				prompt,
				width: finalWidth,
				height: finalHeight,
				output_format: 'svg',
				style: 'vector_illustration',
			};
			if (seed) input.seed = seed;
		}
		// Recraft V3 - Uses size parameter
		else if (modelId.includes('recraft-v3') || modelId.includes('recraft')) {
			input = {
				prompt,
				size: `${finalWidth}x${finalHeight}`,
				style: 'realistic_image',
			};
		}
		// Stable Diffusion 3.5 Large
		else if (modelId.includes('stable-diffusion-3.5') || modelId.includes('sd-3-5')) {
			input = {
				prompt,
				aspect_ratio: simplifiedRatio,
				cfg: guidanceScale,
				steps: steps,
				output_format: 'webp',
				output_quality: 90,
			};
			if (seed) input.seed = seed;
		}
		// Qwen Image - Specific parameter requirements
		else if (modelId.includes('qwen-image') || modelId.includes('qwen')) {
			input = {
				prompt,
				aspect_ratio: simplifiedRatio,
				num_inference_steps: steps,
				guidance: guidanceScale,
				go_fast: true,
				image_size: 'optimize_for_quality',
				output_format: 'webp',
				output_quality: 90,
				enhance_prompt: false,
				disable_safety_checker: false,
			};
			if (seed) input.seed = seed;
		}
		// Default/fallback for unknown models
		else {
			input = {
				prompt,
				width: finalWidth,
				height: finalHeight,
				num_inference_steps: steps,
				guidance_scale: guidanceScale,
			};
			if (seed) input.seed = seed;
		}

		return { input, finalWidth, finalHeight };
	}

	/**
	 * Determine output format from model ID and output URL
	 */
	private determineOutputFormat(
		modelId: string,
		outputUrl: string
	): { format: string; contentType: string } {
		if (modelId.includes('recraft-v3-svg')) {
			return { format: 'svg', contentType: 'image/svg+xml' };
		}
		if (modelId.includes('imagen-4')) {
			return { format: 'png', contentType: 'image/png' };
		}
		if (outputUrl.includes('.png')) {
			return { format: 'png', contentType: 'image/png' };
		}
		if (outputUrl.includes('.jpg') || outputUrl.includes('.jpeg')) {
			return { format: 'jpeg', contentType: 'image/jpeg' };
		}
		// Default to webp
		return { format: 'webp', contentType: 'image/webp' };
	}

	/**
	 * Extract output URL from various response formats
	 */
	private extractOutputUrl(output: string[] | string | { url?: string } | any): string {
		if (Array.isArray(output)) {
			return output[0];
		}
		if (typeof output === 'string') {
			return output;
		}
		if (output && typeof output === 'object' && output.url) {
			return output.url;
		}
		throw new Error('Unexpected output format from model');
	}

	/**
	 * Main function: Process image generation via Replicate API
	 * Handles all model-specific parameter mapping and polling
	 */
	async processGeneration(params: GenerationParams): Promise<GenerationResult> {
		const startTime = Date.now();

		if (!this.apiToken) {
			return {
				success: false,
				error: 'Replicate not configured',
			};
		}

		try {
			this.logger.log('=== PROCESS GENERATION START ===');
			this.logger.log(`Model: ${params.modelId}`);
			this.logger.debug(`Prompt: ${params.prompt.substring(0, 100)}...`);

			// Handle image-to-image conversion if needed
			let sourceImageBase64: string | null = null;
			if (params.sourceImageUrl && params.strength !== null && params.strength !== undefined) {
				this.logger.log('Image-to-image mode detected');
				sourceImageBase64 = await this.convertImageToBase64(params.sourceImageUrl);
			}

			// Build model-specific input
			const { input, finalWidth, finalHeight } = this.buildModelInput(params, sourceImageBase64);

			this.logger.debug(`Replicate API input: ${JSON.stringify(input, null, 2)}`);

			// Prepare Replicate API request
			const requestBody: any = { input };

			if (params.modelVersion) {
				requestBody.version = params.modelVersion;
				this.logger.debug(`Using version hash: ${params.modelVersion}`);
			} else {
				requestBody.model = params.modelId;
				this.logger.debug(`Using model ID (official model): ${params.modelId}`);
			}

			// Call Replicate API to start prediction
			this.logger.log('Calling Replicate API...');
			const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
				method: 'POST',
				headers: {
					Authorization: `Token ${this.apiToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!replicateResponse.ok) {
				const errorText = await replicateResponse.text();
				this.logger.error(`Replicate API error: ${errorText}`);
				throw new Error(`Replicate API error (${replicateResponse.status}): ${errorText}`);
			}

			const prediction = await replicateResponse.json();
			this.logger.log(`Prediction created: ${prediction.id}, Status: ${prediction.status}`);

			// Poll for completion
			const maxAttempts = 120; // 10 minutes max (5 second intervals)
			let attempts = 0;

			while (attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
				attempts++;

				const statusResponse = await fetch(
					`https://api.replicate.com/v1/predictions/${prediction.id}`,
					{
						headers: {
							Authorization: `Token ${this.apiToken}`,
						},
					}
				);

				if (!statusResponse.ok) {
					this.logger.warn('Failed to get prediction status');
					continue; // Retry
				}

				const result = await statusResponse.json();
				this.logger.debug(`Poll ${attempts}: ${result.status}`);

				// Success - Extract output URL
				if (result.status === 'succeeded' && result.output) {
					const outputUrl = this.extractOutputUrl(result.output);
					this.logger.log(`Generation succeeded! Output URL: ${outputUrl}`);

					const { format } = this.determineOutputFormat(params.modelId, outputUrl);
					const generationTime = Math.floor((Date.now() - startTime) / 1000);

					this.logger.log('=== PROCESS GENERATION COMPLETE ===');
					this.logger.log(`Time taken: ${generationTime} seconds`);

					return {
						success: true,
						outputUrl,
						format,
						width: finalWidth,
						height: finalHeight,
						generationTimeSeconds: generationTime,
					};
				}

				// Failed or canceled
				if (result.status === 'failed' || result.status === 'canceled') {
					const errorMsg = result.error || `Generation ${result.status}`;
					this.logger.error(`Generation failed: ${errorMsg}`);
					throw new Error(errorMsg);
				}
			}

			// Timeout after max attempts
			throw new Error('Generation timeout after 10 minutes');
		} catch (error: any) {
			this.logger.error(`Error in processGeneration: ${error.message}`);

			return {
				success: false,
				error: error.message || 'Unknown error during generation',
			};
		}
	}

	/**
	 * Create a prediction and return immediately (for webhook-based flow)
	 */
	async createPrediction(
		modelId: string,
		version: string,
		params: GenerationParams,
		webhookUrl?: string
	): Promise<Prediction> {
		if (!this.apiToken) {
			throw new Error('Replicate not configured');
		}

		try {
			// Handle image-to-image conversion if needed
			let sourceImageBase64: string | null = null;
			if (params.sourceImageUrl && params.strength !== null && params.strength !== undefined) {
				sourceImageBase64 = await this.convertImageToBase64(params.sourceImageUrl);
			}

			// Build model-specific input
			const { input } = this.buildModelInput(params, sourceImageBase64);

			const requestBody: any = {
				input,
				webhook: webhookUrl,
				webhook_events_filter: ['completed'],
			};

			if (version) {
				requestBody.version = version;
			} else {
				requestBody.model = modelId;
			}

			const response = await fetch('https://api.replicate.com/v1/predictions', {
				method: 'POST',
				headers: {
					Authorization: `Token ${this.apiToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Replicate API error: ${errorText}`);
			}

			const prediction = await response.json();

			return {
				id: prediction.id,
				status: prediction.status as Prediction['status'],
				output: prediction.output,
				error: prediction.error,
			};
		} catch (error) {
			this.logger.error('Error creating prediction', error);
			throw error;
		}
	}

	async getPrediction(predictionId: string): Promise<Prediction> {
		if (!this.apiToken) {
			throw new Error('Replicate not configured');
		}

		try {
			const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
				headers: {
					Authorization: `Token ${this.apiToken}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to get prediction: ${response.status}`);
			}

			const prediction = await response.json();

			return {
				id: prediction.id,
				status: prediction.status as Prediction['status'],
				output: prediction.output,
				error: prediction.error,
				metrics: prediction.metrics,
			};
		} catch (error) {
			this.logger.error(`Error getting prediction ${predictionId}`, error);
			throw error;
		}
	}

	async cancelPrediction(predictionId: string): Promise<void> {
		if (!this.apiToken) {
			throw new Error('Replicate not configured');
		}

		try {
			await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
				method: 'POST',
				headers: {
					Authorization: `Token ${this.apiToken}`,
				},
			});
		} catch (error) {
			this.logger.error(`Error canceling prediction ${predictionId}`, error);
			throw error;
		}
	}
}
