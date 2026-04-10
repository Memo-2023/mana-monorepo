/**
 * Reactive Queries & Pure Helpers for Journal module.
 *
 * Content fields (title, content) are encrypted at rest. liveQueries
 * filter on plaintext metadata first (deletedAt, isArchived) and
 * then decryptRecords the visible set before mapping to public types.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { JournalEntry, JournalMood, LocalJournalEntry } from './types';

// ─── Type Converters ───────────────────────────────────────

export function toJournalEntry(local: LocalJournalEntry): JournalEntry {
	return {
		id: local.id,
		title: local.title,
		content: local.content,
		entryDate: local.entryDate,
		mood: local.mood,
		tags: local.tags ?? [],
		isPinned: local.isPinned,
		isArchived: local.isArchived,
		isFavorite: local.isFavorite ?? false,
		wordCount: local.wordCount ?? 0,
		transcriptModel: local.transcriptModel ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllJournalEntries() {
	return useLiveQueryWithDefault(async () => {
		const visible = (await db.table<LocalJournalEntry>('journalEntries').toArray()).filter(
			(e) => !e.deletedAt && !e.isArchived
		);
		const decrypted = await decryptRecords('journalEntries', visible);
		return decrypted.map(toJournalEntry).sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			return b.entryDate.localeCompare(a.entryDate);
		});
	}, [] as JournalEntry[]);
}

export function useJournalEntry(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const local = await db.table<LocalJournalEntry>('journalEntries').get(id);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('journalEntries', [local]);
			return decrypted ? toJournalEntry(decrypted) : null;
		},
		null as JournalEntry | null
	);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Search journal entries by title, content, mood and tags. */
export function searchEntries(entries: JournalEntry[], query: string): JournalEntry[] {
	if (!query.trim()) return entries;
	const q = query.toLowerCase();
	return entries.filter((e) => {
		const haystack = [e.title, e.content, e.mood, ...(e.tags ?? [])]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

/** Group entries by month label (e.g. "April 2026"). */
export function groupByMonth(
	entries: JournalEntry[]
): Array<{ label: string; entries: JournalEntry[] }> {
	const groups = new Map<string, JournalEntry[]>();
	for (const e of entries) {
		const date = new Date(e.entryDate);
		const label = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
		if (!groups.has(label)) groups.set(label, []);
		groups.get(label)!.push(e);
	}
	return Array.from(groups, ([label, entries]) => ({ label, entries }));
}

/** Format the entry date relative to today. */
export function formatEntryDate(iso: string): string {
	const date = new Date(iso);
	const today = new Date();
	const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
	if (diffDays === 0) return 'Heute';
	if (diffDays === 1) return 'Gestern';
	if (diffDays < 7) return `vor ${diffDays} Tagen`;
	return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Find "On this day" entries — same month+day from previous years. */
export function getOnThisDay(entries: JournalEntry[], today?: Date): JournalEntry[] {
	const ref = today ?? new Date();
	const month = ref.getMonth();
	const day = ref.getDate();
	const thisYear = ref.getFullYear();

	return entries
		.filter((e) => {
			const d = new Date(e.entryDate);
			return d.getMonth() === month && d.getDate() === day && d.getFullYear() < thisYear;
		})
		.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
}

/** Collect all unique tags with their usage count, sorted by frequency. */
export function getTagStats(entries: JournalEntry[]): Array<{ tag: string; count: number }> {
	const counts = new Map<string, number>();
	for (const e of entries) {
		for (const tag of e.tags ?? []) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return Array.from(counts, ([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

/** Mood distribution across all entries. */
export function getMoodDistribution(
	entries: JournalEntry[]
): Array<{ mood: string; count: number }> {
	const buckets = new Map<string, number>();
	for (const e of entries) {
		const key = e.mood ?? 'unbekannt';
		buckets.set(key, (buckets.get(key) ?? 0) + 1);
	}
	return Array.from(buckets, ([mood, count]) => ({ mood, count })).sort(
		(a, b) => b.count - a.count
	);
}

/** Compute insights snapshot from journal entries. */
export function computeInsights(entries: JournalEntry[]) {
	const total = entries.length;
	const favoriteCount = entries.filter((e) => e.isFavorite).length;
	const totalWords = entries.reduce((sum, e) => sum + (e.wordCount ?? 0), 0);
	const tagStats = getTagStats(entries).slice(0, 5);
	const moodDist = getMoodDistribution(entries);

	// Current streak (consecutive days with entries, counting backwards from today)
	let streak = 0;
	const dateSet = new Set(entries.map((e) => e.entryDate));
	const cursor = new Date();
	while (dateSet.has(cursor.toISOString().slice(0, 10))) {
		streak++;
		cursor.setDate(cursor.getDate() - 1);
	}

	return {
		total,
		favoriteCount,
		totalWords,
		streak,
		topTags: tagStats,
		topMood: moodDist[0] ?? null,
	};
}
