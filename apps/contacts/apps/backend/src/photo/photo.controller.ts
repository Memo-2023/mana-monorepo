import {
	Controller,
	Post,
	Delete,
	Param,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PhotoService } from './photo.service';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class PhotoController {
	constructor(private readonly photoService: PhotoService) {}

	@Post(':id/photo')
	@UseInterceptors(
		FileInterceptor('photo', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		})
	)
	async uploadPhoto(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@UploadedFile() file: Express.Multer.File
	) {
		const result = await this.photoService.uploadPhoto(id, user.userId, file);
		return result;
	}

	@Delete(':id/photo')
	async deletePhoto(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.photoService.deletePhoto(id, user.userId);
		return { success: true };
	}
}
