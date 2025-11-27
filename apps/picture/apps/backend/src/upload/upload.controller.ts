import {
	Controller,
	Post,
	Delete,
	Param,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	UploadedFiles,
	BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post()
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: MAX_FILE_SIZE },
			fileFilter: (req, file, callback) => {
				if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
					callback(
						new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
						false
					);
					return;
				}
				callback(null, true);
			},
		})
	)
	async uploadImage(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile() file: Express.Multer.File
	) {
		if (!file) {
			throw new BadRequestException('No file uploaded');
		}

		return this.uploadService.uploadImage(user.userId, file);
	}

	@Post('multiple')
	@UseInterceptors(
		FilesInterceptor('files', 10, {
			limits: { fileSize: MAX_FILE_SIZE },
			fileFilter: (req, file, callback) => {
				if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
					callback(
						new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
						false
					);
					return;
				}
				callback(null, true);
			},
		})
	)
	async uploadMultiple(
		@CurrentUser() user: CurrentUserData,
		@UploadedFiles() files: Express.Multer.File[]
	) {
		if (!files || files.length === 0) {
			throw new BadRequestException('No files uploaded');
		}

		return this.uploadService.uploadMultiple(user.userId, files);
	}

	@Delete(':id')
	async deleteUploadedImage(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.uploadService.deleteUploadedImage(id, user.userId);
	}
}
