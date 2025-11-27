import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PlaylistService, CreatePlaylistDto } from './playlist.service';

@Controller('playlist')
export class PlaylistController {
	constructor(private readonly playlistService: PlaylistService) {}

	@Get()
	async getAll() {
		return this.playlistService.getAll();
	}

	@Get(':category/:name')
	async getOne(@Param('category') category: string, @Param('name') name: string) {
		return this.playlistService.getOne(category, name);
	}

	@Post()
	async create(@Body() dto: CreatePlaylistDto) {
		return this.playlistService.create(dto);
	}

	@Delete(':category/:name')
	async delete(@Param('category') category: string, @Param('name') name: string) {
		await this.playlistService.delete(category, name);
		return { message: 'Playlist deleted' };
	}

	@Post(':category/:name/url')
	async addUrl(
		@Param('category') category: string,
		@Param('name') name: string,
		@Body('url') url: string
	) {
		return this.playlistService.addUrl(category, name, url);
	}
}
