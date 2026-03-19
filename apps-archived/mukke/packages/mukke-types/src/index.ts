export interface Song {
	id: string;
	title: string;
	artist: string | null;
	album: string | null;
	albumArtist: string | null;
	genre: string | null;
	trackNumber: number | null;
	discNumber: number | null;
	year: number | null;
	duration: number | null;
	filePath: string;
	fileSize: number | null;
	coverArtPath: string | null;
	addedAt: string;
	lastPlayedAt: string | null;
	playCount: number;
	favorite: boolean;
}

export interface Album {
	name: string;
	artist: string | null;
	year: number | null;
	coverArtPath: string | null;
	songCount: number;
}

export interface Artist {
	name: string;
	songCount: number;
	albumCount: number;
}

export interface Genre {
	name: string;
	songCount: number;
}

export interface Playlist {
	id: string;
	name: string;
	description: string | null;
	coverArtPath: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistSong {
	id: string;
	playlistId: string;
	songId: string;
	sortOrder: number;
	addedAt: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type ShuffleMode = 'off' | 'on';

export type LibraryTab = 'songs' | 'albums' | 'artists' | 'genres';

export type SortField = 'title' | 'artist' | 'album' | 'addedAt' | 'playCount';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
	field: SortField;
	direction: SortDirection;
	label: string;
}
