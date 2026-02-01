import {
	Controller,
	Get,
	Param,
	Query,
	Res,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { UploadService } from '../upload/upload.service';
import { ProcessService } from '../process/process.service';
import { StorageService } from '../storage/storage.service';

type Variant = 'thumb' | 'medium' | 'large';

@Controller('media')
export class DeliveryController {
	constructor(
		private uploadService: UploadService,
		private processService: ProcessService,
		private storage: StorageService
	) {}

	@Get(':id/file')
	async getOriginal(@Param('id') id: string, @Res() res: Response): Promise<void> {
		const record = await this.uploadService.get(id);
		if (!record) {
			throw new NotFoundException('Media not found');
		}

		await this.streamFile(res, record.keys.original, record.mimeType);
	}

	@Get(':id/file/:variant')
	async getVariant(
		@Param('id') id: string,
		@Param('variant') variant: Variant,
		@Res() res: Response
	): Promise<void> {
		const record = await this.uploadService.get(id);
		if (!record) {
			throw new NotFoundException('Media not found');
		}

		const variantMap: Record<Variant, string | undefined> = {
			thumb: record.keys.thumbnail,
			medium: record.keys.medium,
			large: record.keys.large,
		};

		const key = variantMap[variant];
		if (!key) {
			// Fallback to original if variant doesn't exist
			await this.streamFile(res, record.keys.original, record.mimeType);
			return;
		}

		await this.streamFile(res, key, 'image/webp');
	}

	@Get(':id/transform')
	async transform(
		@Param('id') id: string,
		@Query('w') width?: string,
		@Query('h') height?: string,
		@Query('fit') fit?: string,
		@Query('format') format?: string,
		@Query('q') quality?: string,
		@Res() res?: Response
	): Promise<void> {
		if (!res) return;

		const record = await this.uploadService.get(id);
		if (!record) {
			throw new NotFoundException('Media not found');
		}

		if (!record.mimeType.startsWith('image/')) {
			throw new BadRequestException('Transform only supported for images');
		}

		// Download original
		const originalBuffer = await this.storage.download(record.keys.original);

		// Transform
		const transformedBuffer = await this.processService.transformImage(originalBuffer, {
			width: width ? parseInt(width) : undefined,
			height: height ? parseInt(height) : undefined,
			fit: (fit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside') || 'inside',
			format: (format as 'webp' | 'jpeg' | 'png' | 'avif') || 'webp',
			quality: quality ? parseInt(quality) : 85,
		});

		const mimeTypes: Record<string, string> = {
			webp: 'image/webp',
			jpeg: 'image/jpeg',
			png: 'image/png',
			avif: 'image/avif',
		};

		res.set('Content-Type', mimeTypes[format || 'webp']);
		res.set('Cache-Control', 'public, max-age=31536000');
		res.send(transformedBuffer);
	}

	private async streamFile(res: Response, key: string, contentType: string): Promise<void> {
		try {
			const stream = await this.storage.getStream(key);

			res.set('Content-Type', contentType);
			res.set('Cache-Control', 'public, max-age=31536000');

			stream.pipe(res);
		} catch (error) {
			throw new NotFoundException('File not found');
		}
	}
}
