import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AlbumService } from './album.service';
import { CreateAlbumDto, UpdateAlbumDto, AddItemsDto } from './dto';

@Controller('albums')
@UseGuards(JwtAuthGuard)
export class AlbumController {
	constructor(private albumService: AlbumService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.albumService.findAll(user.userId);
	}

	@Get(':id')
	async findById(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		const album = await this.albumService.findById(id, user.userId);
		if (!album) {
			throw new NotFoundException('Album not found');
		}
		return album;
	}

	@Post()
	async create(@Body() dto: CreateAlbumDto, @CurrentUser() user: CurrentUserData) {
		return this.albumService.create(user.userId, dto);
	}

	@Patch(':id')
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateAlbumDto,
		@CurrentUser() user: CurrentUserData
	) {
		const album = await this.albumService.update(id, user.userId, dto);
		if (!album) {
			throw new NotFoundException('Album not found');
		}
		return album;
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		await this.albumService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/items')
	async addItems(
		@Param('id') id: string,
		@Body() dto: AddItemsDto,
		@CurrentUser() user: CurrentUserData
	) {
		await this.albumService.addItems(id, user.userId, dto.mediaIds);
		return { success: true };
	}

	@Delete(':id/items/:mediaId')
	async removeItem(
		@Param('id') id: string,
		@Param('mediaId') mediaId: string,
		@CurrentUser() user: CurrentUserData
	) {
		await this.albumService.removeItem(id, user.userId, mediaId);
		return { success: true };
	}

	@Patch(':id/cover')
	async setCover(
		@Param('id') id: string,
		@Body() dto: { mediaId: string },
		@CurrentUser() user: CurrentUserData
	) {
		const album = await this.albumService.setCover(id, user.userId, dto.mediaId);
		if (!album) {
			throw new NotFoundException('Album not found');
		}
		return album;
	}
}
