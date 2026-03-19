import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LibraryService } from './library.service';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
	constructor(private readonly libraryService: LibraryService) {}

	@Post('cover-urls')
	async getCoverUrls(@Body() body: { paths: string[] }) {
		const urls = await this.libraryService.getCoverUrls(body.paths ?? []);
		return { urls };
	}

	@Get('albums')
	async getAlbums(@CurrentUser() user: CurrentUserData) {
		const albums = await this.libraryService.getAlbums(user.userId);
		return { albums };
	}

	@Get('artists')
	async getArtists(@CurrentUser() user: CurrentUserData) {
		const artists = await this.libraryService.getArtists(user.userId);
		return { artists };
	}

	@Get('genres')
	async getGenres(@CurrentUser() user: CurrentUserData) {
		const genres = await this.libraryService.getGenres(user.userId);
		return { genres };
	}

	@Get('stats')
	async getStats(@CurrentUser() user: CurrentUserData) {
		const stats = await this.libraryService.getStats(user.userId);
		return { stats };
	}

	@Get('albums/:name')
	async getSongsByAlbum(@CurrentUser() user: CurrentUserData, @Param('name') name: string) {
		const songs = await this.libraryService.getSongsByAlbum(user.userId, decodeURIComponent(name));
		return { songs };
	}

	@Get('artists/:name')
	async getSongsByArtist(@CurrentUser() user: CurrentUserData, @Param('name') name: string) {
		const songs = await this.libraryService.getSongsByArtist(user.userId, decodeURIComponent(name));
		return { songs };
	}

	@Get('genres/:name')
	async getSongsByGenre(@CurrentUser() user: CurrentUserData, @Param('name') name: string) {
		const songs = await this.libraryService.getSongsByGenre(user.userId, decodeURIComponent(name));
		return { songs };
	}
}
