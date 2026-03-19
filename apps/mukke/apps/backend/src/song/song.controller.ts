import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SongService } from './song.service';
import { SongUploadDto, UpdateSongDto } from './dto/song.dto';

@Controller('songs')
@UseGuards(JwtAuthGuard)
export class SongController {
	constructor(private readonly songService: SongService) {}

	@Post('upload')
	async createUploadUrl(@CurrentUser() user: CurrentUserData, @Body() dto: SongUploadDto) {
		const result = await this.songService.createUploadUrl(user.userId, dto.filename);
		return { song: result.song, uploadUrl: result.uploadUrl };
	}

	@Post(':id/cover-upload')
	async createCoverUploadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: { filename: string }
	) {
		const result = await this.songService.createCoverUploadUrl(id, user.userId, body.filename);
		return { uploadUrl: result.uploadUrl };
	}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('sort') sort?: string,
		@Query('direction') direction?: string
	) {
		const songList = await this.songService.findByUserId(user.userId, sort, direction);
		return { songs: songList };
	}

	@Get('search')
	async search(@CurrentUser() user: CurrentUserData, @Query('q') query: string) {
		const songList = await this.songService.search(user.userId, query || '');
		return { songs: songList };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const song = await this.songService.findByIdOrThrow(id, user.userId);
		return { song };
	}

	@Get(':id/download-url')
	async getDownloadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const url = await this.songService.getDownloadUrl(id, user.userId);
		return { url };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateSongDto
	) {
		const song = await this.songService.updateMetadata(id, user.userId, dto);
		return { song };
	}

	@Put(':id/favorite')
	async toggleFavorite(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const song = await this.songService.toggleFavorite(id, user.userId);
		return { song };
	}

	@Put(':id/play')
	async incrementPlayCount(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const song = await this.songService.incrementPlayCount(id, user.userId);
		return { song };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.songService.delete(id, user.userId);
		return { success: true };
	}
}
