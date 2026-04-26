/**
 * Milestones Timeline Aggregator
 *
 * Cross-module union of firsts ∪ lasts as a single chronological feed —
 * the "your life so far"-view. Pure helpers are testable without Dexie;
 * the reactive `useMilestonesTimeline()` hook combines the two existing
 * scoped live-queries.
 *
 * Direction discriminator distinguishes the two:
 *   - 'first' = entry from the firsts module (achieved or dreamed)
 *   - 'last'  = entry from the lasts module (suspected/confirmed/reclaimed)
 *
 * Sort default: most-recent date first (anchored). Entries without a
 * concrete date fall back to createdAt and sort to the tail.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import { toFirst } from '$lib/modules/firsts/queries';
import { toLast } from '$lib/modules/lasts/queries';
import type { LocalFirst, First } from '$lib/modules/firsts/types';
import type { LocalLast, Last } from '$lib/modules/lasts/types';
import type { MilestoneCategory } from './categories';

export type Direction = 'first' | 'last';

export interface TimelineEntry {
	id: string;
	direction: Direction;
	title: string;
	category: MilestoneCategory;
	/** Anchor date — for firsts: `date` (lived) or null (dream).
	 *  For lasts: `date` (suspected/confirmed) or null. */
	date: string | null;
	/** ISO of original creation, fallback sort key. */
	createdAt: string;
	/** Direction-specific status string (lived/dream OR suspected/confirmed/reclaimed). */
	status: string;
	/** Pin state across both modules. */
	isPinned: boolean;
	/** Underlying record for direction-specific UI. */
	source: First | Last;
}

function firstToEntry(f: First): TimelineEntry {
	return {
		id: `first:${f.id}`,
		direction: 'first',
		title: f.title,
		category: f.category as MilestoneCategory,
		date: f.date,
		createdAt: f.createdAt,
		status: f.status,
		isPinned: f.isPinned,
		source: f,
	};
}

function lastToEntry(l: Last): TimelineEntry {
	return {
		id: `last:${l.id}`,
		direction: 'last',
		title: l.title,
		category: l.category,
		date: l.date,
		createdAt: l.createdAt,
		status: l.status,
		isPinned: l.isPinned,
		source: l,
	};
}

/** Reverse-chronological sort by anchor date (date ?? createdAt). */
export function compareTimelineDesc(a: TimelineEntry, b: TimelineEntry): number {
	if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
	const ka = a.date ?? a.createdAt;
	const kb = b.date ?? b.createdAt;
	return kb.localeCompare(ka);
}

/** Pure: union firsts ∪ lasts → sorted timeline. Used by tests + view. */
export function mergeMilestones(firsts: First[], lasts: Last[]): TimelineEntry[] {
	const merged: TimelineEntry[] = [...firsts.map(firstToEntry), ...lasts.map(lastToEntry)];
	return merged.sort(compareTimelineDesc);
}

/** Filter helper: by direction. `'all'` is a no-op. */
export function filterByDirection(
	entries: TimelineEntry[],
	direction: Direction | 'all'
): TimelineEntry[] {
	if (direction === 'all') return entries;
	return entries.filter((e) => e.direction === direction);
}

/** Filter helper: only entries within the given year (UTC). */
export function filterByYear(entries: TimelineEntry[], year: number): TimelineEntry[] {
	const prefix = `${year}-`;
	return entries.filter((e) => (e.date ?? e.createdAt).startsWith(prefix));
}

// ─── Reactive Hook ──────────────────────────────────────────

/**
 * Combined live-query: firsts ∪ lasts in the active Space, both
 * decrypted, returned as a sorted timeline.
 *
 * Implemented as a single scoped query that loads both tables in
 * parallel — saves the boilerplate of joining two separate
 * `useScopedLiveQuery` returns at the call-site.
 */
export function useMilestonesTimeline() {
	return useScopedLiveQuery(async () => {
		const [firstLocals, lastLocals] = await Promise.all([
			scopedForModule<LocalFirst, string>('firsts', 'firsts').toArray(),
			scopedForModule<LocalLast, string>('lasts', 'lasts').toArray(),
		]);

		const firstsVisible = firstLocals.filter((f) => !f.deletedAt && !f.isArchived);
		const lastsVisible = lastLocals.filter((l) => !l.deletedAt && !l.isArchived);

		const [firstsDecrypted, lastsDecrypted] = await Promise.all([
			decryptRecords<LocalFirst>('firsts', firstsVisible),
			decryptRecords<LocalLast>('lasts', lastsVisible),
		]);

		const firsts = firstsDecrypted.map(toFirst);
		const lasts = lastsDecrypted.map(toLast);
		return mergeMilestones(firsts, lasts);
	}, [] as TimelineEntry[]);
}
