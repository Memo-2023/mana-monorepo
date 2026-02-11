import {
	Controller,
	Post,
	Get,
	Delete,
	Param,
	Query,
	Body,
	UploadedFile,
	UseInterceptors,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, MediaRecord } from './upload.service';

interface UploadResponse {
	id: string;
	status: MediaRecord['status'];
	originalName: string | null;
	mimeType: string;
	size: number;
	hash: string;
	urls: {
		original: string;
		thumbnail?: string;
		medium?: string;
		large?: string;
	};
	metadata?: {
		width?: number;
		height?: number;
		format?: string;
	};
	exif?: {
		cameraMake?: string;
		cameraModel?: string;
		dateTaken?: Date;
		focalLength?: string;
		aperture?: string;
		iso?: number;
		exposureTime?: string;
		gpsLatitude?: string;
		gpsLongitude?: string;
	};
	createdAt: Date;
}

interface ListAllResponse {
	items: UploadResponse[];
	total: number;
	hasMore: boolean;
}

interface StatsResponse {
	totalCount: number;
	totalSize: number;
	byApp: Record<string, { count: number; size: number }>;
	byYear: Record<string, number>;
}

interface ImportFromMatrixDto {
	mxcUrl: string;
	app: string;
	userId: string;
	skipProcessing?: boolean;
}

@Controller('media')
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 100 * 1024 * 1024, // 100 MB
			},
		})
	)
	async upload(
		@UploadedFile() file: Express.Multer.File,
		@Body('app') app?: string,
		@Body('userId') userId?: string,
		@Body('skipProcessing') skipProcessing?: string
	): Promise<UploadResponse> {
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		const record = await this.uploadService.upload(file, {
			app,
			userId,
			skipProcessing: skipProcessing === 'true',
		});

		return this.toResponse(record);
	}

	/**
	 * Import media from a Matrix MXC URL
	 * Copies the file from Matrix to our storage with deduplication
	 */
	@Post('import/matrix')
	async importFromMatrix(@Body() dto: ImportFromMatrixDto): Promise<UploadResponse> {
		if (!dto.mxcUrl) {
			throw new BadRequestException('mxcUrl is required');
		}
		if (!dto.app) {
			throw new BadRequestException('app is required');
		}
		if (!dto.userId) {
			throw new BadRequestException('userId is required');
		}

		const record = await this.uploadService.importFromMatrix(dto.mxcUrl, {
			app: dto.app,
			userId: dto.userId,
			skipProcessing: dto.skipProcessing,
		});

		if (!record) {
			throw new BadRequestException(
				'Failed to import from Matrix. Invalid MXC URL or download failed.'
			);
		}

		return this.toResponse(record);
	}

	@Get(':id')
	async get(@Param('id') id: string): Promise<UploadResponse> {
		const record = await this.uploadService.get(id);
		if (!record) {
			throw new NotFoundException('Media not found');
		}
		return this.toResponse(record);
	}

	/**
	 * Get media by content hash (SHA-256)
	 * Useful for checking if a file already exists before uploading
	 */
	@Get('hash/:hash')
	async getByHash(@Param('hash') hash: string): Promise<UploadResponse> {
		const record = await this.uploadService.getByHash(hash);
		if (!record) {
			throw new NotFoundException('Media not found');
		}
		return this.toResponse(record);
	}

	@Get()
	async list(
		@Query('app') app?: string,
		@Query('userId') userId?: string,
		@Query('limit') limit?: string
	): Promise<UploadResponse[]> {
		const records = await this.uploadService.list({
			app,
			userId,
			limit: limit ? parseInt(limit) : 50,
		});
		return records.map((r) => this.toResponse(r));
	}

	/**
	 * List media across all apps for a user with advanced filtering
	 * Supports filtering by multiple apps, date range, MIME type, etc.
	 */
	@Get('list/all')
	async listAll(
		@Query('userId') userId: string,
		@Query('apps') apps?: string,
		@Query('mimeType') mimeType?: string,
		@Query('dateFrom') dateFrom?: string,
		@Query('dateTo') dateTo?: string,
		@Query('hasLocation') hasLocation?: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('sortBy') sortBy?: 'createdAt' | 'dateTaken' | 'size',
		@Query('sortOrder') sortOrder?: 'asc' | 'desc'
	): Promise<ListAllResponse> {
		if (!userId) {
			throw new BadRequestException('userId is required');
		}

		const result = await this.uploadService.listAll({
			userId,
			apps: apps ? apps.split(',').map((a) => a.trim()) : undefined,
			mimeType,
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
			dateTo: dateTo ? new Date(dateTo) : undefined,
			hasLocation: hasLocation === 'true',
			limit: limit ? parseInt(limit) : 50,
			offset: offset ? parseInt(offset) : 0,
			sortBy: sortBy || 'createdAt',
			sortOrder: sortOrder || 'desc',
		});

		return {
			items: result.items.map((r) => this.toResponse(r)),
			total: result.total,
			hasMore: result.hasMore,
		};
	}

	/**
	 * Get media statistics for a user
	 */
	@Get('stats')
	async stats(@Query('userId') userId: string): Promise<StatsResponse> {
		if (!userId) {
			throw new BadRequestException('userId is required');
		}
		return this.uploadService.getStats(userId);
	}

	@Delete(':id')
	async delete(@Param('id') id: string): Promise<{ success: boolean }> {
		const deleted = await this.uploadService.delete(id);
		if (!deleted) {
			throw new NotFoundException('Media not found');
		}
		return { success: true };
	}

	private toResponse(record: MediaRecord): UploadResponse {
		const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3015/api/v1';

		return {
			id: record.id,
			status: record.status,
			originalName: record.originalName,
			mimeType: record.mimeType,
			size: record.size,
			hash: record.hash,
			urls: {
				original: `${baseUrl}/media/${record.id}/file`,
				thumbnail: record.keys.thumbnail ? `${baseUrl}/media/${record.id}/file/thumb` : undefined,
				medium: record.keys.medium ? `${baseUrl}/media/${record.id}/file/medium` : undefined,
				large: record.keys.large ? `${baseUrl}/media/${record.id}/file/large` : undefined,
			},
			metadata: record.metadata,
			exif: record.exif,
			createdAt: record.createdAt,
		};
	}
}
