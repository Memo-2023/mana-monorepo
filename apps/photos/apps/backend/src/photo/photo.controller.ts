import { Controller, Get, Query, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PhotoService } from './photo.service';

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
	constructor(private photoService: PhotoService) {}

	@Get()
	async list(
		@CurrentUser() user: CurrentUserData,
		@Query('apps') apps?: string,
		@Query('mimeType') mimeType?: string,
		@Query('dateFrom') dateFrom?: string,
		@Query('dateTo') dateTo?: string,
		@Query('hasLocation') hasLocation?: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('sortBy') sortBy?: 'createdAt' | 'dateTaken' | 'size',
		@Query('sortOrder') sortOrder?: 'asc' | 'desc'
	) {
		return this.photoService.listPhotos(user.userId, {
			apps: apps ? apps.split(',').map((a) => a.trim()) : undefined,
			mimeType: mimeType || 'image/*',
			dateFrom,
			dateTo,
			hasLocation: hasLocation === 'true',
			limit: limit ? parseInt(limit) : 50,
			offset: offset ? parseInt(offset) : 0,
			sortBy,
			sortOrder,
		});
	}

	@Get('stats')
	async stats(@CurrentUser() user: CurrentUserData) {
		return this.photoService.getStats(user.userId);
	}

	@Get(':mediaId')
	async get(@Param('mediaId') mediaId: string, @CurrentUser() user: CurrentUserData) {
		const photo = await this.photoService.getPhoto(user.userId, mediaId);
		if (!photo) {
			throw new NotFoundException('Photo not found');
		}
		return photo;
	}
}
