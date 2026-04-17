/**
 * Library module types — a single module tracking books, movies, series, comics
 * the user has consumed (or plans to). Kind-specific metadata lives in the
 * discriminated `details` union so we keep one table + one route while still
 * giving each medium its own shape.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Discriminators & Enums ──────────────────────────────

export type LibraryKind = 'book' | 'movie' | 'series' | 'comic';

export type LibraryStatus = 'planned' | 'active' | 'completed' | 'paused' | 'dropped';

export type BookFormat = 'hardcover' | 'paperback' | 'ebook' | 'audio';

// ─── Kind-specific Details ───────────────────────────────

export interface BookDetails {
	kind: 'book';
	pages?: number | null;
	currentPage?: number | null;
	format?: BookFormat | null;
}

export interface MovieDetails {
	kind: 'movie';
	runtimeMin?: number | null;
	director?: string | null;
}

export interface WatchedEpisode {
	season: number;
	episode: number;
	watchedAt?: string | null;
}

export interface SeriesDetails {
	kind: 'series';
	totalSeasons?: number | null;
	totalEpisodes?: number | null;
	watched?: WatchedEpisode[];
}

export interface ComicDetails {
	kind: 'comic';
	issueCount?: number | null;
	currentIssue?: number | null;
	publisher?: string | null;
	isOngoing?: boolean;
}

export type LibraryDetails = BookDetails | MovieDetails | SeriesDetails | ComicDetails;

// ─── External Metadata IDs ───────────────────────────────

export interface LibraryExternalIds {
	isbn?: string | null;
	tmdbId?: string | null;
	openLibraryId?: string | null;
	comicVineId?: string | null;
}

// ─── Local Record (Dexie) ────────────────────────────────

export interface LocalLibraryEntry extends BaseRecord {
	kind: LibraryKind;
	status: LibraryStatus;
	title: string;
	originalTitle?: string | null;
	creators: string[];
	year?: number | null;
	coverUrl?: string | null;
	coverMediaId?: string | null;
	rating?: number | null;
	review?: string | null;
	tags: string[];
	genres: string[];
	startedAt?: string | null;
	completedAt?: string | null;
	isFavorite: boolean;
	times: number;
	externalIds?: LibraryExternalIds | null;
	details: LibraryDetails;
}

// ─── Domain Type (plaintext, for UI) ─────────────────────

export interface LibraryEntry {
	id: string;
	kind: LibraryKind;
	status: LibraryStatus;
	title: string;
	originalTitle: string | null;
	creators: string[];
	year: number | null;
	coverUrl: string | null;
	coverMediaId: string | null;
	rating: number | null;
	review: string | null;
	tags: string[];
	genres: string[];
	startedAt: string | null;
	completedAt: string | null;
	isFavorite: boolean;
	times: number;
	externalIds: LibraryExternalIds | null;
	details: LibraryDetails;
	createdAt: string;
	updatedAt: string;
}
