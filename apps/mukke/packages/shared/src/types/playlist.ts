import type { Song } from './song';

export interface Playlist {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	coverArtPath: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistWithSongs extends Playlist {
	songs: Song[];
}

export interface CreatePlaylistDto {
	name: string;
	description?: string;
}

export interface UpdatePlaylistDto {
	name?: string;
	description?: string;
}
