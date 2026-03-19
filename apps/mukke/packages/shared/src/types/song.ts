export interface Song {
	id: string;
	userId: string;
	title: string;
	artist: string | null;
	album: string | null;
	albumArtist: string | null;
	genre: string | null;
	trackNumber: number | null;
	year: number | null;
	month: number | null;
	day: number | null;
	duration: number | null;
	storagePath: string;
	coverArtPath: string | null;
	fileSize: number | null;
	bpm: number | null;
	favorite: boolean;
	playCount: number;
	lastPlayedAt: string | null;
	addedAt: string;
	updatedAt: string;
}

export interface Album {
	album: string;
	albumArtist: string | null;
	year: number | null;
	coverArtPath: string | null;
	songCount: number;
}

export interface Artist {
	artist: string;
	songCount: number;
	albumCount: number;
}

export interface Genre {
	genre: string;
	songCount: number;
}

export interface LibraryStats {
	totalSongs: number;
	totalArtists: number;
	totalAlbums: number;
	totalGenres: number;
	totalDuration: number | null;
	totalPlays: number;
}

export type SortField = 'title' | 'artist' | 'album' | 'addedAt' | 'playCount';
export type SortDirection = 'asc' | 'desc';

export interface CreateSongDto {
	title: string;
	artist?: string;
	album?: string;
	albumArtist?: string;
	genre?: string;
	trackNumber?: number;
	year?: number;
	month?: number;
	day?: number;
	bpm?: number;
}

export interface UpdateSongDto extends Partial<CreateSongDto> {
	duration?: number;
	fileSize?: number;
}

export interface SongUploadResponse {
	song: Song;
	uploadUrl: string;
}
