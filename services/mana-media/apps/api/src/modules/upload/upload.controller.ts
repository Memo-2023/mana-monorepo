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

	@Get(':id')
	async get(@Param('id') id: string): Promise<UploadResponse> {
		const record = await this.uploadService.get(id);
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

	@Delete(':id')
	async delete(@Param('id') id: string): Promise<{ success: boolean }> {
		const deleted = await this.uploadService.delete(id);
		if (!deleted) {
			throw new NotFoundException('Media not found');
		}
		return { success: true };
	}

	private toResponse(record: MediaRecord): UploadResponse {
		const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3050/api/v1';

		return {
			id: record.id,
			status: record.status,
			originalName: record.originalName,
			mimeType: record.mimeType,
			size: record.size,
			urls: {
				original: `${baseUrl}/media/${record.id}/file`,
				thumbnail: record.keys.thumbnail ? `${baseUrl}/media/${record.id}/file/thumb` : undefined,
				medium: record.keys.medium ? `${baseUrl}/media/${record.id}/file/medium` : undefined,
				large: record.keys.large ? `${baseUrl}/media/${record.id}/file/large` : undefined,
			},
			createdAt: record.createdAt,
		};
	}
}
