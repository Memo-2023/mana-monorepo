import {
	Controller,
	Post,
	Get,
	Delete,
	Param,
	Body,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	NotFoundException,
	UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { StorageService } from './storage.service';

interface PresignedUploadRequest {
	filename: string;
	folder?: string;
}

@Controller('api/storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
	constructor(private readonly storageService: StorageService) {}

	/**
	 * Upload a file directly
	 */
	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile() file: Express.Multer.File,
		@Body('folder') folder?: string
	) {
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		const result = await this.storageService.uploadFile(
			user.userId,
			file.originalname,
			file.buffer,
			{
				folder,
			}
		);

		return {
			success: true,
			data: result,
		};
	}

	/**
	 * Get a presigned URL for client-side upload
	 */
	@Post('presigned-upload')
	async getPresignedUpload(
		@CurrentUser() user: CurrentUserData,
		@Body() body: PresignedUploadRequest
	) {
		if (!body.filename) {
			throw new BadRequestException('Filename is required');
		}

		const result = await this.storageService.getPresignedUploadUrl(user.userId, body.filename, {
			folder: body.folder,
		});

		return {
			success: true,
			data: result,
		};
	}

	/**
	 * Get a presigned URL for downloading
	 */
	@Get('download/:key(*)')
	async getDownloadUrl(@CurrentUser() user: CurrentUserData, @Param('key') key: string) {
		// Ensure user can only access their own files
		if (!key.startsWith(`users/${user.userId}/`)) {
			throw new NotFoundException('File not found');
		}

		const exists = await this.storageService.fileExists(key);
		if (!exists) {
			throw new NotFoundException('File not found');
		}

		const url = await this.storageService.getPresignedDownloadUrl(key);

		return {
			success: true,
			data: { url },
		};
	}

	/**
	 * Delete a file
	 */
	@Delete(':key(*)')
	async deleteFile(@CurrentUser() user: CurrentUserData, @Param('key') key: string) {
		// Ensure user can only delete their own files
		if (!key.startsWith(`users/${user.userId}/`)) {
			throw new NotFoundException('File not found');
		}

		const exists = await this.storageService.fileExists(key);
		if (!exists) {
			throw new NotFoundException('File not found');
		}

		await this.storageService.deleteFile(key);

		return {
			success: true,
			message: 'File deleted',
		};
	}

	/**
	 * List user's files
	 */
	@Get('list')
	async listFiles(@CurrentUser() user: CurrentUserData, @Body('folder') folder?: string) {
		const files = await this.storageService.listUserFiles(user.userId, folder);

		return {
			success: true,
			data: { files },
		};
	}
}
