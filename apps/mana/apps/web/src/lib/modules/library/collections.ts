/**
 * Library module — Dexie accessors and guest seed.
 *
 * Table name: `libraryEntries` (single-table design with `kind` discriminator).
 */

import { db } from '$lib/data/database';
import type { LocalLibraryEntry } from './types';

export const libraryEntryTable = db.table<LocalLibraryEntry>('libraryEntries');

// ─── Guest Seed ────────────────────────────────────────────
//
// One entry per kind so first-run users immediately see what the module is
// for without needing to create anything. Content is the kind of thing a
// curious user would recognise.

export const LIBRARY_GUEST_SEED = {
	libraryEntries: [
		{
			id: 'demo-book-dune',
			kind: 'book' as const,
			status: 'completed' as const,
			title: 'Dune',
			originalTitle: 'Dune',
			creators: ['Frank Herbert'],
			year: 1965,
			coverUrl: null,
			coverMediaId: null,
			rating: 4.5,
			review: null,
			tags: ['klassiker'],
			genres: ['Sci-Fi'],
			startedAt: null,
			completedAt: '2026-01-15',
			isFavorite: true,
			times: 1,
			externalIds: null,
			details: { kind: 'book' as const, pages: 688, format: 'paperback' as const },
		},
		{
			id: 'demo-movie-arrival',
			kind: 'movie' as const,
			status: 'completed' as const,
			title: 'Arrival',
			originalTitle: null,
			creators: ['Denis Villeneuve'],
			year: 2016,
			coverUrl: null,
			coverMediaId: null,
			rating: 4,
			review: null,
			tags: [],
			genres: ['Sci-Fi', 'Drama'],
			startedAt: null,
			completedAt: '2026-02-08',
			isFavorite: false,
			times: 1,
			externalIds: null,
			details: { kind: 'movie' as const, runtimeMin: 116, director: 'Denis Villeneuve' },
		},
		{
			id: 'demo-series-severance',
			kind: 'series' as const,
			status: 'active' as const,
			title: 'Severance',
			originalTitle: null,
			creators: ['Dan Erickson'],
			year: 2022,
			coverUrl: null,
			coverMediaId: null,
			rating: null,
			review: null,
			tags: [],
			genres: ['Sci-Fi', 'Thriller'],
			startedAt: '2026-03-01',
			completedAt: null,
			isFavorite: false,
			times: 0,
			externalIds: null,
			details: { kind: 'series' as const, totalSeasons: 2, totalEpisodes: 19, watched: [] },
		},
		{
			id: 'demo-comic-saga',
			kind: 'comic' as const,
			status: 'active' as const,
			title: 'Saga',
			originalTitle: null,
			creators: ['Brian K. Vaughan', 'Fiona Staples'],
			year: 2012,
			coverUrl: null,
			coverMediaId: null,
			rating: null,
			review: null,
			tags: [],
			genres: ['Sci-Fi', 'Fantasy'],
			startedAt: null,
			completedAt: null,
			isFavorite: false,
			times: 0,
			externalIds: null,
			details: {
				kind: 'comic' as const,
				currentIssue: 12,
				publisher: 'Image Comics',
				isOngoing: true,
			},
		},
	],
};
