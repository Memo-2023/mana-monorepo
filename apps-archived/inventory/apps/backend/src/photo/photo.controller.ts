import {
	Controller,
	Post,
	Delete,
	Patch,
	Body,
	Param,
	UseGuards,
	UseInterceptors,
	UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PhotoService } from './photo.service';

@Controller('api/v1/items/:itemId/photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
	constructor(private readonly photoService: PhotoService) {}

	@Post()
	@UseInterceptors(FilesInterceptor('photos', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
	async uploadPhotos(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@UploadedFiles() files: Express.Multer.File[]
	) {
		return this.photoService.uploadPhotos(user.userId, itemId, files);
	}

	@Delete(':photoId')
	async deletePhoto(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@Param('photoId') photoId: string
	) {
		return this.photoService.deletePhoto(user.userId, itemId, photoId);
	}

	@Patch(':photoId/set-primary')
	async setPrimary(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@Param('photoId') photoId: string
	) {
		return this.photoService.setPrimary(user.userId, itemId, photoId);
	}

	@Patch('reorder')
	async reorderPhotos(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@Body('photoIds') photoIds: string[]
	) {
		return this.photoService.reorderPhotos(user.userId, itemId, photoIds);
	}
}
