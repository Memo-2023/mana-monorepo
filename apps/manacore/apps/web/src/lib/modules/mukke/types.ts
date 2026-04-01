/**
 * Mukke module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

// ─── View Types ────────────────────────────────────────────

export interface Song {
	id: string;
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
	createdAt: string;
	updatedAt: string;
}

export interface Playlist {
	id: string;
	name: string;
	description?: string | null;
	coverArtPath?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Project {
	id: string;
	title: string;
	description?: string | null;
	songId?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	album: string;
	albumArtist: string;
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
	totalDuration: number;
	totalPlays: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
