/**
 * Reactive queries and pure helpers for the Library module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalLibraryEntry, LibraryEntry, LibraryKind, LibraryStatus } from './types';

// ─── Type Converter ──────────────────────────────────────

export function toLibraryEntry(local: LocalLibraryEntry): LibraryEntry {
	const now = new Date().toISOString();
	return {
		id: local.id,
		kind: local.kind,
		status: local.status,
		title: local.title,
		originalTitle: local.originalTitle ?? null,
		creators: local.creators ?? [],
		year: local.year ?? null,
		coverUrl: local.coverUrl ?? null,
		coverMediaId: local.coverMediaId ?? null,
		rating: local.rating ?? null,
		review: local.review ?? null,
		tags: local.tags ?? [],
		genres: local.genres ?? [],
		startedAt: local.startedAt ?? null,
		completedAt: local.completedAt ?? null,
		isFavorite: local.isFavorite ?? false,
		times: local.times ?? 0,
		externalIds: local.externalIds ?? null,
		details: local.details,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllEntries() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalLibraryEntry, string>(
			'library',
			'libraryEntries'
		).toArray();
		const visible = locals.filter((e) => !e.deletedAt);
		const decrypted = await decryptRecords('libraryEntries', visible);
		return decrypted.map(toLibraryEntry);
	}, [] as LibraryEntry[]);
}

// ─── Pure Helpers ─────────────────────────────────────────

export function filterByKind(entries: LibraryEntry[], kind: LibraryKind): LibraryEntry[] {
	return entries.filter((e) => e.kind === kind);
}

export function filterByStatus(entries: LibraryEntry[], status: LibraryStatus): LibraryEntry[] {
	return entries.filter((e) => e.status === status);
}

export function searchEntries(entries: LibraryEntry[], query: string): LibraryEntry[] {
	const lower = query.toLowerCase();
	return entries.filter(
		(e) =>
			e.title.toLowerCase().includes(lower) ||
			(e.originalTitle?.toLowerCase().includes(lower) ?? false) ||
			e.creators.some((c) => c.toLowerCase().includes(lower))
	);
}

export function groupByKind(entries: LibraryEntry[]): Record<LibraryKind, LibraryEntry[]> {
	const out: Record<LibraryKind, LibraryEntry[]> = {
		book: [],
		movie: [],
		series: [],
		comic: [],
	};
	for (const e of entries) out[e.kind].push(e);
	return out;
}

export interface LibraryStats {
	totalByKind: Record<LibraryKind, number>;
	completedThisYear: number;
	currentlyActive: number;
	avgRating: number | null;
}

export function computeStats(entries: LibraryEntry[], year: number): LibraryStats {
	const totalByKind: Record<LibraryKind, number> = { book: 0, movie: 0, series: 0, comic: 0 };
	let completedThisYear = 0;
	let currentlyActive = 0;
	let ratingSum = 0;
	let ratingCount = 0;
	const yearPrefix = String(year);

	for (const e of entries) {
		totalByKind[e.kind]++;
		if (e.status === 'active') currentlyActive++;
		if (e.status === 'completed' && e.completedAt?.startsWith(yearPrefix)) completedThisYear++;
		if (typeof e.rating === 'number') {
			ratingSum += e.rating;
			ratingCount++;
		}
	}

	return {
		totalByKind,
		completedThisYear,
		currentlyActive,
		avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
	};
}
