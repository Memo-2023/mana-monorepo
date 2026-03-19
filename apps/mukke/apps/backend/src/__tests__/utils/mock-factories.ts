import type { Song } from '../../db/schema/songs.schema';
import type { Playlist, PlaylistSong } from '../../db/schema/playlists.schema';
import type { Beat } from '../../db/schema/beats.schema';
import type { Marker } from '../../db/schema/markers.schema';
import type { Project } from '../../db/schema/projects.schema';
import type { LibraryBeat } from '../../db/schema/library-beats.schema';

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

export function createMockBeat(overrides?: Partial<Beat>): Beat {
	return {
		id: crypto.randomUUID(),
		projectId: crypto.randomUUID(),
		storagePath: 'users/test-user-123/beat.mp3',
		filename: 'beat.mp3',
		duration: 180.0,
		bpm: 120.0,
		bpmConfidence: 0.95,
		waveformData: null,
		transcriptionStatus: 'none',
		transcriptionError: null,
		transcribedAt: null,
		createdAt: new Date(),
		...overrides,
	};
}

export function createMockMarker(overrides?: Partial<Marker>): Marker {
	return {
		id: crypto.randomUUID(),
		beatId: crypto.randomUUID(),
		type: 'section',
		label: 'Verse 1',
		startTime: 0.0,
		endTime: 30.0,
		color: '#FF0000',
		sortOrder: 0,
		...overrides,
	};
}

export function createMockProject(overrides?: Partial<Project>): Project {
	return {
		id: crypto.randomUUID(),
		userId: TEST_USER_ID,
		title: 'Test Project',
		description: 'A test project',
		songId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

export function createMockLibraryBeat(overrides?: Partial<LibraryBeat>): LibraryBeat {
	return {
		id: crypto.randomUUID(),
		title: 'Library Beat',
		artist: 'Beat Artist',
		genre: 'Hip Hop',
		bpm: 90.0,
		duration: 200.0,
		storagePath: 'library/beats/beat.mp3',
		previewUrl: null,
		license: 'free',
		isActive: true,
		tags: ['hip-hop', 'chill'],
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}
