import sharp from 'sharp';
import { StorageService } from './storage';
import { ExifService, type ExifData } from './exif';
import { IMAGE_VARIANTS, SUPPORTED_IMAGE_TYPES } from '../constants';

export interface ProcessResult {
	thumbnail?: string;
	medium?: string;
	large?: string;
	metadata?: {
		width?: number;
		height?: number;
		format?: string;
		hasAlpha?: boolean;
	};
	exif?: ExifData;
}

export class ProcessService {
	constructor(
		private storage: StorageService,
		private exifService: ExifService
	) {}

	async processImage(
		mediaId: string,
		originalKey: string,
		mimeType: string
	): Promise<ProcessResult> {
		if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) return {};

		const originalBuffer = await this.storage.download(originalKey);
		const image = sharp(originalBuffer);
		const metadata = await image.metadata();
		const exifData = await this.exifService.extract(originalBuffer);

		const result: ProcessResult = {
			metadata: {
				width: metadata.width,
				height: metadata.height,
				format: metadata.format,
				hasAlpha: metadata.hasAlpha,
			},
			exif: exifData || undefined,
		};

		const basePath = originalKey.replace(/^originals\//, 'processed/').replace(/\.[^.]+$/, '');

		// Thumbnail
		const thumbKey = `${basePath}/thumb.webp`;
		const thumbBuffer = await sharp(originalBuffer)
			.resize(IMAGE_VARIANTS.thumbnail.width, IMAGE_VARIANTS.thumbnail.height, {
				fit: IMAGE_VARIANTS.thumbnail.fit,
			})
			.webp({ quality: 80 })
			.toBuffer();
		await this.storage.upload(thumbKey, thumbBuffer, 'image/webp');
		result.thumbnail = thumbKey;

		// Medium
		if (
			(metadata.width || 0) > IMAGE_VARIANTS.medium.width ||
			(metadata.height || 0) > IMAGE_VARIANTS.medium.height
		) {
			const mediumKey = `${basePath}/medium.webp`;
			const mediumBuffer = await sharp(originalBuffer)
				.resize(IMAGE_VARIANTS.medium.width, IMAGE_VARIANTS.medium.height, {
					fit: IMAGE_VARIANTS.medium.fit,
					withoutEnlargement: true,
				})
				.webp({ quality: 85 })
				.toBuffer();
			await this.storage.upload(mediumKey, mediumBuffer, 'image/webp');
			result.medium = mediumKey;
		}

		// Large
		if (
			(metadata.width || 0) > IMAGE_VARIANTS.large.width ||
			(metadata.height || 0) > IMAGE_VARIANTS.large.height
		) {
			const largeKey = `${basePath}/large.webp`;
			const largeBuffer = await sharp(originalBuffer)
				.resize(IMAGE_VARIANTS.large.width, IMAGE_VARIANTS.large.height, {
					fit: IMAGE_VARIANTS.large.fit,
					withoutEnlargement: true,
				})
				.webp({ quality: 90 })
				.toBuffer();
			await this.storage.upload(largeKey, largeBuffer, 'image/webp');
			result.large = largeKey;
		}

		return result;
	}

	async transformImage(
		buffer: Buffer,
		options: {
			width?: number;
			height?: number;
			fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
			format?: 'webp' | 'jpeg' | 'png' | 'avif';
			quality?: number;
		}
	): Promise<Buffer> {
		let pipeline = sharp(buffer);

		if (options.width || options.height) {
			pipeline = pipeline.resize(options.width, options.height, {
				fit: options.fit || 'inside',
				withoutEnlargement: true,
			});
		}

		const format = options.format || 'webp';
		const quality = options.quality || 85;

		switch (format) {
			case 'webp':
				pipeline = pipeline.webp({ quality });
				break;
			case 'jpeg':
				pipeline = pipeline.jpeg({ quality });
				break;
			case 'png':
				pipeline = pipeline.png();
				break;
			case 'avif':
				pipeline = pipeline.avif({ quality });
				break;
		}

		return pipeline.toBuffer();
	}
}
