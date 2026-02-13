import {
	Controller,
	Post,
	Body,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

interface GetUploadUrlDto {
	filename: string;
}

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StorageController {
	constructor(private readonly storageService: StorageService) {}

	/**
	 * Get a presigned URL for avatar upload
	 *
	 * Returns a presigned URL that the client can use to upload
	 * the avatar directly to S3/MinIO. This is the recommended approach
	 * for frontend uploads as it's more efficient.
	 */
	@Post('avatar/upload-url')
	@ApiOperation({
		summary: 'Get presigned URL for avatar upload',
		description:
			'Returns a presigned URL for direct upload to storage. Use this URL to PUT the file.',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns presigned upload URL',
		schema: {
			type: 'object',
			properties: {
				uploadUrl: { type: 'string', description: 'PUT this URL with the file' },
				fileUrl: { type: 'string', description: 'Public URL after upload' },
				key: { type: 'string', description: 'Storage key' },
				expiresIn: { type: 'number', description: 'URL expires in seconds' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Invalid file type or storage not configured' })
	async getAvatarUploadUrl(
		@CurrentUser() user: CurrentUserData,
		@Body() dto: GetUploadUrlDto
	): Promise<{
		uploadUrl: string;
		fileUrl: string;
		key: string;
		expiresIn: number;
	}> {
		if (!dto.filename) {
			throw new BadRequestException('filename is required');
		}

		return this.storageService.getAvatarUploadUrl(user.userId, dto.filename);
	}

	/**
	 * Upload avatar directly (multipart/form-data)
	 *
	 * Alternative to presigned URLs. The file is uploaded to the backend
	 * which then uploads it to S3/MinIO. Simpler but less efficient for
	 * large files.
	 */
	@Post('avatar')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		})
	)
	@ApiConsumes('multipart/form-data')
	@ApiOperation({
		summary: 'Upload avatar directly',
		description: 'Upload avatar file directly to the server',
	})
	@ApiResponse({
		status: 201,
		description: 'Avatar uploaded successfully',
		schema: {
			type: 'object',
			properties: {
				url: { type: 'string', description: 'Public URL of the uploaded avatar' },
				key: { type: 'string', description: 'Storage key' },
			},
		},
	})
	@ApiResponse({ status: 400, description: 'Invalid file type or size' })
	async uploadAvatar(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile() file: Express.Multer.File
	): Promise<{ url: string; key: string }> {
		if (!file) {
			throw new BadRequestException('No file uploaded');
		}

		return this.storageService.uploadAvatar(user.userId, file.buffer, file.originalname);
	}
}
