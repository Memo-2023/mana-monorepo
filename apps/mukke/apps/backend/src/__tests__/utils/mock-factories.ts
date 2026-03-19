import type { Song } from '../../db/schema/songs.schema';
import type { Playlist, PlaylistSong } from '../../db/schema/playlists.schema';

export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_EMAIL = 'test@example.com';

export function createMockSong(overrides?: Partial<Song>): Song {
	return {
		id: crypto.randomUUID(),
		userId: TEST_USER_ID,
		title: 'Test Song',
		artist: 'Test Artist',
		album: 'Test Album',
		albumArtist: null,
		genre: 'Rock',
		trackNumber: 1,
		year: 2024,
		duration: 240.5,
		storagePath: 'users/test-user-123/audio.mp3',
		coverArtPath: null,
		fileSize: 5000000,
		bpm: 120.0,
		favorite: false,
		playCount: 0,
		lastPlayedAt: null,
		addedAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockPlaylist(overrides?: Partial<Playlist>): Playlist {
	return {
		id: crypto.randomUUID(),
		userId: TEST_USER_ID,
		name: 'Test Playlist',
		description: 'A test playlist',
		coverArtPath: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockPlaylistSong(overrides?: Partial<PlaylistSong>): PlaylistSong {
	return {
		id: crypto.randomUUID(),
		playlistId: crypto.randomUUID(),
		songId: crypto.randomUUID(),
		sortOrder: 0,
		addedAt: new Date(),
		...overrides,
	};
}
