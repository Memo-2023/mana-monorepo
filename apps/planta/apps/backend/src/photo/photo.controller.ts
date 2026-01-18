import {
	Controller,
	Get,
	Post,
	Delete,
	Put,
	Param,
	Query,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	ParseFilePipe,
	MaxFileSizeValidator,
	FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PhotoService } from './photo.service';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
	constructor(private readonly photoService: PhotoService) {}

	@Post('upload')
	@UseInterceptors(FileInterceptor('file'))
	async upload(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
					new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|heic)$/i }),
				],
			})
		)
		file: Express.Multer.File,
		@Query('plantId') plantId?: string
	) {
		return this.photoService.upload(user.userId, file, plantId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.photoService.findOne(id, user.userId);
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.photoService.delete(id, user.userId);
	}

	@Put(':id/primary')
	async setPrimary(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.photoService.setPrimary(id, user.userId);
	}
}
