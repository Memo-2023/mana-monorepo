import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PlaylistService } from './playlist.service';
import {
	CreatePlaylistDto,
	UpdatePlaylistDto,
	AddSongDto,
	ReorderSongsDto,
} from './dto/playlist.dto';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
	constructor(private readonly playlistService: PlaylistService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const playlistList = await this.playlistService.findByUserId(user.userId);
		return { playlists: playlistList };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePlaylistDto) {
		const playlist = await this.playlistService.create(user.userId, dto);
		return { playlist };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const playlist = await this.playlistService.getPlaylistWithSongs(id, user.userId);
		return { playlist };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdatePlaylistDto
	) {
		const playlist = await this.playlistService.update(id, user.userId, dto);
		return { playlist };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.playlistService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/songs')
	async addSong(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AddSongDto
	) {
		await this.playlistService.addSong(id, dto.songId, user.userId);
		return { success: true };
	}

	@Delete(':id/songs/:songId')
	async removeSong(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Param('songId', ParseUUIDPipe) songId: string
	) {
		await this.playlistService.removeSong(id, songId, user.userId);
		return { success: true };
	}

	@Put(':id/songs/reorder')
	async reorderSongs(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReorderSongsDto
	) {
		await this.playlistService.reorderSongs(id, user.userId, dto.songIds);
		return { success: true };
	}
}
