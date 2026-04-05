/**
 * Mukke module — collection accessors and guest seed data.
 *
 * Table names: songs, mukkePlaylists, playlistSongs, mukkeProjects, markers
 */

import { db } from '$lib/data/database';
import type {
	LocalSong,
	LocalPlaylist,
	LocalPlaylistSong,
	LocalProject,
	LocalMarker,
} from './types';

// ─── Collection Accessors ──────────────────────────────────

export const songTable = db.table<LocalSong>('songs');
export const mukkePlaylistTable = db.table<LocalPlaylist>('mukkePlaylists');
export const playlistSongTable = db.table<LocalPlaylistSong>('playlistSongs');
export const mukkeProjectTable = db.table<LocalProject>('mukkeProjects');
export const markerTable = db.table<LocalMarker>('markers');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_PLAYLIST_ID = 'demo-favorites';

export const MUKKE_GUEST_SEED = {
	songs: [] as Record<string, unknown>[],
	mukkePlaylists: [
		{
			id: DEMO_PLAYLIST_ID,
			name: 'Meine Favoriten',
			description: 'Deine Lieblingssongs.',
			coverArtPath: null,
		},
	],
	playlistSongs: [] as Record<string, unknown>[],
	mukkeProjects: [] as Record<string, unknown>[],
	markers: [] as Record<string, unknown>[],
};
