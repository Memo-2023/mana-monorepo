export interface MediaResult {
	id: string;
	status: 'uploading' | 'processing' | 'ready' | 'failed';
	originalName: string;
	mimeType: string;
	size: number;
	urls: {
		original: string;
		thumbnail?: string;
		medium?: string;
		large?: string;
	};
	createdAt: Date;
}

export interface UploadOptions {
	app?: string;
	userId?: string;
	skipProcessing?: boolean;
}

export interface SearchOptions {
	type?: 'image' | 'video' | 'audio' | 'document';
	app?: string;
	limit?: number;
}

export interface TransformOptions {
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	format?: 'webp' | 'jpeg' | 'png' | 'avif';
	quality?: number;
}

export class MediaClient {
	private baseUrl: string;
	private apiKey?: string;

	constructor(baseUrl: string, apiKey?: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.apiKey = apiKey;
	}

	/**
	 * Upload a file to the media service
	 */
	async upload(
		file: File | Blob | ArrayBuffer,
		options?: UploadOptions & { filename?: string }
	): Promise<MediaResult> {
		const formData = new FormData();

		if (file instanceof ArrayBuffer) {
			// ArrayBuffer (works in both Node.js and browser)
			const blob = new Blob([file]);
			formData.append('file', blob, options?.filename || 'file');
		} else {
			// Browser File/Blob
			formData.append('file', file, options?.filename);
		}

		if (options?.app) formData.append('app', options.app);
		if (options?.userId) formData.append('userId', options.userId);
		if (options?.skipProcessing) formData.append('skipProcessing', 'true');

		const response = await fetch(`${this.baseUrl}/api/v1/media/upload`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Get media by ID
	 */
	async get(id: string): Promise<MediaResult> {
		const response = await fetch(`${this.baseUrl}/api/v1/media/${id}`, {
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			throw new Error(`Get failed: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * List media
	 */
	async list(options?: { app?: string; userId?: string; limit?: number }): Promise<MediaResult[]> {
		const params = new URLSearchParams();
		if (options?.app) params.append('app', options.app);
		if (options?.userId) params.append('userId', options.userId);
		if (options?.limit) params.append('limit', options.limit.toString());

		const response = await fetch(`${this.baseUrl}/api/v1/media?${params}`, {
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			throw new Error(`List failed: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Delete media
	 */
	async delete(id: string): Promise<boolean> {
		const response = await fetch(`${this.baseUrl}/api/v1/media/${id}`, {
			method: 'DELETE',
			headers: this.getHeaders(),
		});

		return response.ok;
	}

	/**
	 * Get URL for original file
	 */
	getOriginalUrl(id: string): string {
		return `${this.baseUrl}/api/v1/media/${id}/file`;
	}

	/**
	 * Get URL for thumbnail
	 */
	getThumbnailUrl(id: string): string {
		return `${this.baseUrl}/api/v1/media/${id}/file/thumb`;
	}

	/**
	 * Get URL for medium variant
	 */
	getMediumUrl(id: string): string {
		return `${this.baseUrl}/api/v1/media/${id}/file/medium`;
	}

	/**
	 * Get URL for large variant
	 */
	getLargeUrl(id: string): string {
		return `${this.baseUrl}/api/v1/media/${id}/file/large`;
	}

	/**
	 * Get URL for custom transform
	 */
	getTransformUrl(id: string, options: TransformOptions): string {
		const params = new URLSearchParams();
		if (options.width) params.append('w', options.width.toString());
		if (options.height) params.append('h', options.height.toString());
		if (options.fit) params.append('fit', options.fit);
		if (options.format) params.append('format', options.format);
		if (options.quality) params.append('q', options.quality.toString());

		return `${this.baseUrl}/api/v1/media/${id}/transform?${params}`;
	}

	/**
	 * Wait for media processing to complete
	 */
	async waitForReady(id: string, timeoutMs = 30000, pollIntervalMs = 1000): Promise<MediaResult> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeoutMs) {
			const result = await this.get(id);

			if (result.status === 'ready') {
				return result;
			}

			if (result.status === 'failed') {
				throw new Error('Media processing failed');
			}

			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
		}

		throw new Error('Timeout waiting for media to be ready');
	}

	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		return headers;
	}
}

export default MediaClient;
