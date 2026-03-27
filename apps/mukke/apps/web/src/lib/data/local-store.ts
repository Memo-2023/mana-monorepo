/**
 * Mukke — Local-First Data Layer
 *
 * Song metadata, playlists, projects, and markers stored locally.
 * Audio file upload/streaming remains server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestPlaylists } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalSong extends BaseRecord {
	title: string;
	artist?: string | null;
	album?: string | null;
	albumArtist?: string | null;
	genre?: string | null;
	trackNumber?: number | null;
	year?: number | null;
	duration?: number | null;
	storagePath: string;
	coverArtPath?: string | null;
	fileSize?: number | null;
	bpm?: number | null;
	favorite: boolean;
	playCount: number;
	lastPlayedAt?: string | null;
}

export interface LocalPlaylist extends BaseRecord {
	name: string;
	description?: string | null;
	coverArtPath?: string | null;
}

export interface LocalPlaylistSong extends BaseRecord {
	playlistId: string;
	songId: string;
	sortOrder: number;
}

export interface LocalProject extends BaseRecord {
	title: string;
	description?: string | null;
	songId?: string | null;
}

export interface LocalMarker extends BaseRecord {
	beatId: string;
	type: 'verse' | 'hook' | 'bridge' | 'intro' | 'outro' | 'drop' | 'breakdown' | 'custom';
	label?: string | null;
	startTime: number;
	endTime?: number | null;
	color?: string | null;
	sortOrder: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const mukkeStore = createLocalStore({
	appId: 'mukke',
	collections: [
		{
			name: 'songs',
			indexes: ['artist', 'album', 'genre', 'favorite', 'title'],
		},
		{
			name: 'playlists',
			indexes: ['name'],
			guestSeed: guestPlaylists,
		},
		{
			name: 'playlistSongs',
			indexes: ['playlistId', 'songId', 'sortOrder', '[playlistId+sortOrder]'],
		},
		{
			name: 'projects',
			indexes: ['title', 'songId'],
		},
		{
			name: 'markers',
			indexes: ['beatId', 'type', 'sortOrder'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const songCollection = mukkeStore.collection<LocalSong>('songs');
export const playlistCollection = mukkeStore.collection<LocalPlaylist>('playlists');
export const playlistSongCollection = mukkeStore.collection<LocalPlaylistSong>('playlistSongs');
export const projectCollection = mukkeStore.collection<LocalProject>('projects');
export const markerCollection = mukkeStore.collection<LocalMarker>('markers');
