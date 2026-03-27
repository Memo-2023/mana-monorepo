import type {
	GenerateImageOptions,
	GenerateImageResult,
	ImageGenHealthResponse,
	GpuServiceConfig,
} from './types';
import { resolveServiceUrl } from './resolve-url';

export class ImageClient {
	private baseUrl: string;
	private timeout: number;

	constructor(config: GpuServiceConfig) {
		this.baseUrl = resolveServiceUrl(config, 'image');
		this.timeout = config.timeout ?? 120_000;
	}

	/** Generate an image from a text prompt. */
	async generate(options: GenerateImageOptions): Promise<GenerateImageResult> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.baseUrl}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: options.prompt,
					width: options.width ?? 1024,
					height: options.height ?? 1024,
					steps: options.steps ?? 4,
					seed: options.seed,
					output_format: options.outputFormat ?? 'png',
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ detail: response.statusText }));
				throw new Error(
					`Image generation error ${response.status}: ${(error as { detail: string }).detail}`
				);
			}

			return (await response.json()) as GenerateImageResult;
		} finally {
			clearTimeout(timer);
		}
	}

	/** Get the full URL for a generated image. */
	imageUrl(relativePath: string): string {
		return `${this.baseUrl}${relativePath}`;
	}

	/** Download a generated image as ArrayBuffer. */
	async downloadImage(relativePath: string): Promise<ArrayBuffer> {
		const response = await fetch(this.imageUrl(relativePath), {
			signal: AbortSignal.timeout(30_000),
		});
		if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
		return response.arrayBuffer();
	}

	/** Check if the image generation service is healthy. */
	async health(): Promise<ImageGenHealthResponse> {
		const response = await fetch(`${this.baseUrl}/health`, {
			signal: AbortSignal.timeout(5000),
		});
		return (await response.json()) as ImageGenHealthResponse;
	}
}
