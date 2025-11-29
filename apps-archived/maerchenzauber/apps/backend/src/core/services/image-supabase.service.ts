import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from './settings.service';
import { ImageOptimizationService } from './image-optimization.service';
const Replicate = require('replicate');
import { streamToBuffer } from '../util/functions';
import { Result, createFailure } from '../models/error';
import { GoogleGenAI } from '@google/genai';
import { ImageUrlWithPage } from '../models/shared.models';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AppConfig } from '../../config/app.config';
import { IMAGE_MODELS, ImageModelId } from '../models/image-models';
import { categorizeError, getUserFriendlyError } from '../consts/user-errors.const';
import { ErrorLoggingService } from './error-logging.service';

@Injectable()
export class ImageSupabaseService {
	private readonly logger = new Logger(ImageSupabaseService.name);
	private readonly replicateClient: any;
	private readonly bucket: string = 'user-uploads';
	private readonly ai: GoogleGenAI;

	// Temporary storage for BlurHashes mapped to image URLs
	// This allows generateImage() to remain backwards compatible
	private readonly blurHashCache = new Map<string, string>();

	constructor(
		private readonly settingsService: SettingsService,
		private readonly configService: ConfigService,
		private readonly imageOptimizationService: ImageOptimizationService,
		private readonly errorLoggingService: ErrorLoggingService
	) {
		const config = this.configService.get<AppConfig>('app');
		const replicateApiKey = config?.replicate?.apiToken;
		const googleGenAiApiKey = config?.google?.genAiApiKey;

		if (!replicateApiKey) {
			this.logger.warn('Replicate API token not configured');
		} else {
			this.logger.log(
				`Initializing Replicate client with API key: ${replicateApiKey.substring(
					0,
					10
				)}... (length: ${replicateApiKey.length})`
			);
		}

		if (!googleGenAiApiKey) {
			this.logger.warn('Google GenAI API key not configured');
		}

		this.replicateClient = new Replicate({
			auth: replicateApiKey || 'dummy-key',
			useFileOutput: true,
		});

		this.ai = new GoogleGenAI({
			apiKey: googleGenAiApiKey || 'dummy-key',
		});
	}

	async generateIllustration(
		prompt: string,
		desc: string,
		page: number,
		story: string,
		storyId: string,
		token?: string
	): Promise<any> {
		try {
			const response = await this.generateImage(prompt, `stories/${storyId}`, token);

			if (response.error) {
				throw new Error(response.error);
			}

			return {
				status: 'success',
				data: {
					image: response.data,
					page,
					description: desc,
					story,
				},
			};
		} catch (error: any) {
			console.error('Error generating illustration:', error);
			const errorMessage =
				error?.response?.data?.error || (error instanceof Error ? error.message : 'Unknown error');
			return {
				status: 'error',
				data: {
					error: errorMessage,
					page,
					description: desc,
				},
			};
		}
	}

	async generateImageWithReplicate(
		prompt: string,
		path: string,
		token?: string,
		userId?: string,
		characterImageUrl?: string
	): Promise<Result<string>> {
		let modelId: ImageModelId | null = null; // Declare outside try block for error logging

		try {
			// Check if Replicate API key is configured
			const config = this.configService.get<AppConfig>('app');
			const replicateApiKey = config?.replicate?.apiToken;
			if (!replicateApiKey || replicateApiKey === 'dummy-key') {
				throw new Error(
					'Replicate API key not configured. Please set MAERCHENZAUBER_REPLICATE_API_KEY environment variable.'
				);
			}

			const model = this.settingsService.getReplicateModel(userId) as any;
			this.logger.log(`Using Replicate model: ${model}`);

			// Get model ID from the replicate ID
			modelId = this.getModelIdFromReplicateId(model);

			// Determine image type from path
			const isCharacterImage = path.includes('/characters');
			const isStoryImage = path.includes('/stories');

			// Get optimized input based on model
			const optimizedInput = this.getOptimizedModelInput(
				prompt,
				modelId,
				isCharacterImage,
				isStoryImage,
				characterImageUrl
			);
			this.logger.log(
				`Using optimized input for model ${modelId}:`,
				JSON.stringify(optimizedInput).substring(0, 200)
			);

			const replicateOutput = await this.replicateClient.run(model, {
				input: optimizedInput,
			});

			// Handle both single URI string and array of URI strings
			const output = Array.isArray(replicateOutput) ? replicateOutput[0] : replicateOutput;

			if (!output) {
				throw new Error('Invalid output format from Replicate API');
			}

			// Convert string to ReadableStream if necessary
			const stream =
				typeof output === 'string'
					? new ReadableStream({
							start(controller) {
								controller.enqueue(Buffer.from(output));
								controller.close();
							},
						})
					: output;

			// Convert stream to buffer
			const imageBuffer = await streamToBuffer(stream);

			// Upload to Supabase Storage
			const uploadResult = await this.uploadToSupabaseStorage(imageBuffer, path, 'jpg', token);
			this.logger.log(`Successfully generated image with Replicate: ${uploadResult.url}`);
			this.logger.log(`BlurHash: ${uploadResult.blurHash}`);

			return {
				data: uploadResult.url,
				error: null,
			};
		} catch (error) {
			this.logger.error('Error generating image with Replicate:', error);

			// Extract error message
			let errorMessage = 'Unknown error occurred';
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			this.logger.error(`Replicate error details: ${errorMessage}`);

			// Categorize error and get user-friendly message
			const category = categorizeError(errorMessage);
			const userError = getUserFriendlyError(errorMessage, category);

			// Log error for monitoring
			await this.errorLoggingService.logError({
				errorCategory: category,
				technicalMessage: errorMessage,
				technicalStack: error instanceof Error ? error.stack : undefined,
				context: { prompt, modelId },
			});

			// Return error with user-friendly metadata
			return createFailure(new Error(`Replicate generation failed: ${errorMessage}`), {
				category: userError.category,
				messageDE: userError.messageDE,
				messageEN: userError.messageEN,
				retryable: userError.retryable,
				technicalDetails: errorMessage,
			});
		}
	}

	/**
	 * Upload image buffer to Supabase Storage with optimization
	 * @param imageBuffer The image buffer to upload
	 * @param path The path where the image should be stored
	 * @param fileExtension The file extension (will be converted to webp)
	 * @param token Optional authentication token
	 * @returns Object with URL and BlurHash
	 */
	private async uploadToSupabaseStorage(
		imageBuffer: Buffer,
		path: string,
		fileExtension = 'jpg',
		token?: string
	): Promise<{ url: string; blurHash: string }> {
		// Use the publishable key with JWT token for storage operations
		const url = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_URL');
		const anonKey = this.configService.get<string>('MAERCHENZAUBER_SUPABASE_ANON_KEY');

		if (!url || !anonKey) {
			throw new Error('Supabase configuration is missing');
		}

		// Optimize image and generate multiple sizes
		this.logger.log('Optimizing image before upload...');
		const optimizedImages = await this.imageOptimizationService.optimizeImage(imageBuffer);

		// Generate BlurHash for smooth placeholders
		const blurHash = await this.imageOptimizationService.generateBlurHash(imageBuffer);

		// Create client with anon key and user's JWT token
		const supabaseConfig: any = {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		};

		// If token is provided, add it to the Authorization header
		if (token) {
			supabaseConfig.global = {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			};
			this.logger.log('Using JWT token for storage upload');
		} else {
			this.logger.log('No JWT token provided for storage upload - using anon key only');
		}

		const supabase = createClient(url, anonKey, supabaseConfig);

		// Generate base filename
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(7);
		const baseFilename = `${path}/${timestamp}-${randomId}`;

		// Upload all versions in parallel
		this.logger.log('Uploading optimized image versions...');
		const uploadPromises = [
			// Large version (1200px)
			supabase.storage
				.from(this.bucket)
				.upload(`${baseFilename}-large.webp`, optimizedImages.large, {
					contentType: 'image/webp',
					upsert: false,
				}),
			// Medium version (800px) - default
			supabase.storage
				.from(this.bucket)
				.upload(`${baseFilename}-medium.webp`, optimizedImages.medium, {
					contentType: 'image/webp',
					upsert: false,
				}),
			// Thumbnail (200px)
			supabase.storage
				.from(this.bucket)
				.upload(`${baseFilename}-thumb.webp`, optimizedImages.thumbnail, {
					contentType: 'image/webp',
					upsert: false,
				}),
		];

		const results = await Promise.all(uploadPromises);

		// Check for errors
		const errors = results.filter((r) => r.error);
		if (errors.length > 0) {
			this.logger.error('Supabase storage upload errors:', errors);
			throw new Error(`Failed to upload to Supabase Storage: ${errors[0].error?.message}`);
		}

		// Return medium URL as default (can be changed in API response to include all sizes)
		const publicUrl = `${url}/storage/v1/object/public/${this.bucket}/${baseFilename}-medium.webp`;

		this.logger.log(`Image uploaded successfully: ${publicUrl}`);
		this.logger.log(`BlurHash: ${blurHash}`);

		// Cache BlurHash for this URL
		this.blurHashCache.set(publicUrl, blurHash);

		// Return both URL and BlurHash for database storage
		return {
			url: publicUrl,
			blurHash,
		};
	}

	/**
	 * Get BlurHash for a previously uploaded image
	 * @param imageUrl The image URL
	 * @returns BlurHash string or undefined
	 */
	getBlurHashForUrl(imageUrl: string): string | undefined {
		return this.blurHashCache.get(imageUrl);
	}

	/**
	 * Prepare a character image URL for external services like Replicate
	 * If the URL is already public, return it as-is
	 * If it's private, create a signed URL (currently not needed for user-uploads bucket)
	 * @param imageUrl The Supabase Storage URL
	 * @returns A publicly accessible URL
	 */
	async createSignedUrlForCharacterImage(imageUrl: string): Promise<Result<string>> {
		try {
			// Check if the URL contains '/public/' - meaning it's already publicly accessible
			if (imageUrl.includes('/storage/v1/object/public/')) {
				this.logger.log(
					`Image URL is already public, using directly: ${imageUrl.substring(0, 80)}...`
				);
				return { data: imageUrl, error: null };
			}

			// If URL is private (contains '/storage/v1/object/sign/' or similar), we would need to create a signed URL
			// But for user-uploads bucket, all images are public
			this.logger.warn(`Unexpected URL format: ${imageUrl}`);
			return { data: imageUrl, error: null };
		} catch (error) {
			this.logger.error('Error preparing character image URL:', error);
			return {
				data: null,
				error: error instanceof Error ? error : new Error('Unknown error'),
			};
		}
	}

	async generateImage(
		prompt: string,
		path: string,
		token?: string,
		userId?: string,
		characterImageUrl?: string
	): Promise<Result<string>> {
		// Check if Replicate API key is configured
		const config = this.configService.get<AppConfig>('app');
		const replicateApiKey = config?.replicate?.apiToken;
		if (!replicateApiKey || replicateApiKey === 'dummy-key') {
			const errorMsg =
				'Replicate API key not configured. Please set MAERCHENZAUBER_REPLICATE_API_KEY environment variable.';
			this.logger.error(errorMsg);
			return {
				data: null,
				error: new Error(errorMsg),
			};
		}

		// Generate image with Replicate
		this.logger.log('Generating image with Replicate');
		const replicateResult = await this.generateImageWithReplicate(
			prompt,
			path,
			token,
			userId,
			characterImageUrl
		);

		return replicateResult;
	}

	async generateIllustrationForPage(
		prompt: string,
		path: string,
		page: number,
		token?: string,
		userId?: string,
		characterImageUrl?: string
	): Promise<Result<ImageUrlWithPage>> {
		// Check if Replicate is configured
		const config = this.configService.get<AppConfig>('app');
		const replicateApiKey = config?.replicate?.apiToken;
		if (!replicateApiKey || replicateApiKey === 'dummy-key') {
			const errorMsg =
				'Replicate API key not configured. Please set MAERCHENZAUBER_REPLICATE_API_KEY environment variable.';
			this.logger.error(errorMsg);

			const userError = getUserFriendlyError(errorMsg, 'SERVICE_UNAVAILABLE' as any);

			await this.errorLoggingService.logError({
				userId,
				errorCategory: userError.category,
				technicalMessage: errorMsg,
				context: { page, characterImageUrl },
			});

			return createFailure(new Error(errorMsg), {
				category: userError.category,
				messageDE: userError.messageDE,
				messageEN: userError.messageEN,
				retryable: userError.retryable,
				technicalDetails: errorMsg,
			});
		}

		// Use Replicate as primary image generation service
		this.logger.log(`Generating illustration for page ${page} with Replicate`);
		const imageResult = await this.generateImageWithReplicate(
			prompt,
			path,
			token,
			userId,
			characterImageUrl
		);

		if (imageResult?.error) {
			this.logger.error(
				`Error generating illustration with Replicate for page ${page}:`,
				imageResult.error
			);
			return {
				error: imageResult.error,
				data: null,
			};
		}

		// Handle success from Replicate
		const blurHash = this.getBlurHashForUrl(imageResult.data!) || '';

		return {
			error: null,
			data: {
				imageUrl: imageResult.data!,
				page,
				blurHash,
			},
		};
	}

	/**
	 * Save an uploaded image to Supabase Storage and return the URL
	 * @param imageBuffer The buffer containing the image data
	 * @param path The path where the image should be stored
	 * @param fileExtension The file extension of the uploaded image
	 * @param token Optional authentication token
	 * @returns The URL of the saved image
	 */
	async saveUploadedImage(
		imageBuffer: Buffer,
		path: string,
		fileExtension = 'jpg',
		token?: string
	): Promise<Result<{ url: string; blurHash: string }>> {
		try {
			const result = await this.uploadToSupabaseStorage(imageBuffer, path, fileExtension, token);
			return {
				data: result,
				error: null,
			};
		} catch (error) {
			console.error('Error saving uploaded image:', error);
			return {
				data: null,
				error: error,
			};
		}
	}

	/**
	 * Analyze an image using Google Vertex AI Vision and get a description
	 * @param imageUrl The URL of the image to analyze
	 * @returns A description of the animal in the image
	 */
	async analyzeImage(imageUrl: string): Promise<Result<string>> {
		try {
			// Fetch the image to provide as input
			const imageResponse = await axios.get(imageUrl, {
				responseType: 'arraybuffer',
			});
			const imageData = Buffer.from(imageResponse.data).toString('base64');

			const prompt =
				'Describe this animal in detail. Include species, physical characteristics, colors, and any unique features. Format your response as a short paragraph.';

			const detectedAnimalReq = await this.ai.models.generateContent({
				model: 'gemini-2.0-flash',
				contents: {
					inlineData: {
						data: imageData,
						mimeType: 'image/jpeg',
					},
				},
				config: {
					systemInstruction: prompt,
				},
			});

			const detectedAnimal = await detectedAnimalReq?.text;

			if (!detectedAnimal) {
				return {
					data: null,
					error: 'Failed to detect animal',
				};
			}

			return {
				data: detectedAnimal,
				error: null,
			};
		} catch (error) {
			console.error('Error analyzing image:', error);
			return {
				data: null,
				error: error,
			};
		}
	}

	/**
	 * Get model ID from Replicate ID string
	 */
	private getModelIdFromReplicateId(replicateId: string): ImageModelId | null {
		for (const [modelId, modelConfig] of Object.entries(IMAGE_MODELS)) {
			if (modelConfig.replicateId === replicateId) {
				return modelId as ImageModelId;
			}
		}
		return null;
	}

	/**
	 * Get optimized input parameters based on model type
	 */
	private getOptimizedModelInput(
		prompt: string,
		modelId: ImageModelId | null,
		isCharacterImage = false,
		isStoryImage = false,
		characterImageUrl?: string
	): any {
		// Default children's book style enhancement
		const defaultEnhancement =
			"Style: Pixar-like 3D cartoon, bright vibrant colors, children's book illustration, whimsical, friendly, suitable for ages 3-8.";

		// Determine aspect ratio based on image type
		let aspectRatio = '1:1'; // Default
		if (isCharacterImage) {
			aspectRatio = '1:1';
		} else if (isStoryImage) {
			aspectRatio = '3:4';
		}

		// Base configuration for all models
		const baseConfig = {
			prompt: `${prompt}. ${defaultEnhancement}`,
			output_format: 'jpg',
		};

		// Return base config if model not found
		if (!modelId) {
			return { ...baseConfig, disable_safety_checker: true };
		}

		// Model-specific optimizations
		switch (modelId) {
			case 'flux-schnell':
				return {
					...baseConfig,
					num_inference_steps: 4,
					go_fast: true,
					disable_safety_checker: true,
					megapixels: '1',
					output_quality: 90,
				};

			case 'flux-pro':
				return {
					prompt: `${prompt}. ${defaultEnhancement}`,
					aspect_ratio: '16:9',
					output_format: 'png',
					output_quality: 100,
					safety_tolerance: 6, // Most permissive - no restrictions (1=most strict, 6=most permissive)
					prompt_upsampling: true,
				};

			case 'imagen-4-fast':
				return {
					prompt: `${prompt}. Children's illustration style, colorful and friendly.`,
					aspect_ratio: '16:9',
					safety_filter_level: 'block_most', // Maximum safety
					person_generation: 'dont_allow',
					output_format: 'jpg',
				};

			case 'imagen-4':
				return {
					prompt: `${prompt}. Premium children's book illustration, detailed and whimsical.`,
					aspect_ratio: '16:9',
					safety_filter_level: 'block_most',
					person_generation: 'dont_allow',
					output_format: 'png',
					quality: 'standard', // or 'ultra' for highest quality
				};

			case 'seedream-4':
				const seedreamConfig: any = {
					prompt: `${prompt}. ${defaultEnhancement}`,
					size: '4K',
					aspect_ratio: aspectRatio,
					max_images: 1,
					sequential_image_generation: 'disabled',
				};

				// Add character image for consistent character generation in stories
				if (characterImageUrl && isStoryImage) {
					seedreamConfig.image_input = [characterImageUrl];
					this.logger.log(`Using character image for consistent generation: ${characterImageUrl}`);
				}

				return seedreamConfig;

			case 'ideogram-v3-turbo':
				return {
					prompt: `${prompt}`,
					style_preset: 'cartoon_3d', // Perfect for children's books
					magic_prompt: true, // Auto-optimize prompt
					color_palette: 'pastel',
					commercial_use: true,
					output_format: 'jpg',
				};

			case 'qwen-image':
				return {
					prompt: `${prompt}. ${defaultEnhancement}`,
					guidance_scale: 7.5,
					num_inference_steps: 30,
					scheduler: 'DPMSolverMultistep',
					output_format: 'jpg',
				};

			case 'sd-3.5-large-turbo':
				return {
					prompt: `${prompt}. ${defaultEnhancement}`,
					negative_prompt: 'scary, dark, violent, horror, gore, adult content, inappropriate',
					num_inference_steps: 4, // Turbo mode
					guidance_scale: 3.5,
					output_format: 'jpg',
					disable_safety_checker: false,
				};

			case 'sd-3.5-medium':
				return {
					prompt: `${prompt}. ${defaultEnhancement}`,
					negative_prompt: 'scary, dark, violent, inappropriate for children',
					aspect_ratio: '16:9',
					num_inference_steps: 28,
					guidance_scale: 4.5,
					output_format: 'webp',
				};

			case 'nano-banana':
				return {
					prompt: `${prompt}. Consistent character design for children's story.`,
					consistency_mode: 'high',
					multi_image_fusion: false,
					synth_id_watermark: true, // AI transparency
					output_format: 'jpg',
				};

			case 'sdxl':
			default:
				return {
					...baseConfig,
					disable_safety_checker: true,
					num_inference_steps: 25,
					guidance_scale: 7.5,
				};
		}
	}

	/**
	 * Get batch generation capability for a model
	 */
	private supportsBatchGeneration(modelId: ImageModelId): boolean {
		return modelId === 'seedream-4';
	}

	/**
	 * Generate multiple images in batch for supported models
	 */
	async generateBatchImages(
		prompts: string[],
		path: string,
		modelId: ImageModelId,
		token?: string
	): Promise<Result<string[]>> {
		try {
			if (!this.supportsBatchGeneration(modelId)) {
				// Fall back to sequential generation
				const results = await Promise.all(
					prompts.map((prompt) => this.generateImage(prompt, path, token))
				);

				const errors = results.filter((r) => r.error);
				if (errors.length > 0) {
					return {
						data: null,
						error: new Error(`Failed to generate ${errors.length} images`),
					};
				}

				return {
					data: results.map((r) => r.data!),
					error: null,
				};
			}

			// Use batch generation for Seedream-4
			const modelConfig = IMAGE_MODELS[modelId];
			const batchPrompt = prompts.join(' | ');

			const batchResult = await this.replicateClient.run(modelConfig.replicateId, {
				input: {
					prompt: batchPrompt,
					num_images: prompts.length,
					sequential_mode: true,
					resolution: '4K',
					style: 'children_illustration',
				},
			});

			// Process batch results
			const urls: string[] = [];
			const outputs = Array.isArray(batchResult) ? batchResult : [batchResult];

			for (const output of outputs) {
				const stream =
					typeof output === 'string'
						? new ReadableStream({
								start(controller) {
									controller.enqueue(Buffer.from(output));
									controller.close();
								},
							})
						: output;

				const imageBuffer = await streamToBuffer(stream);
				const uploadResult = await this.uploadToSupabaseStorage(imageBuffer, path, 'jpg', token);
				urls.push(uploadResult.url);
			}

			return {
				data: urls,
				error: null,
			};
		} catch (error) {
			this.logger.error('Batch generation failed:', error);
			return {
				data: null,
				error: error instanceof Error ? error : new Error('Batch generation failed'),
			};
		}
	}
}
