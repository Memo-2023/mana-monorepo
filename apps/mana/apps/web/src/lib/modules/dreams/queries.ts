/**
 * Reactive Queries & Pure Helpers for Dreams module.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { Dream, DreamSymbol, LocalDream, LocalDreamSymbol } from './types';

// ─── Type Converters ───────────────────────────────────────

export function toDream(local: LocalDream): Dream {
	return {
		id: local.id,
		title: local.title,
		content: local.content,
		dreamDate: local.dreamDate,
		mood: local.mood,
		clarity: local.clarity,
		isLucid: local.isLucid,
		isRecurring: local.isRecurring,
		sleepQuality: local.sleepQuality,
		bedtime: local.bedtime,
		wakeTime: local.wakeTime,
		location: local.location,
		people: local.people ?? [],
		emotions: local.emotions ?? [],
		symbols: local.symbols ?? [],
		audioPath: local.audioPath,
		audioDurationMs: local.audioDurationMs ?? null,
		transcript: local.transcript,
		processingStatus: local.processingStatus ?? 'idle',
		processingError: local.processingError ?? null,
		interpretation: local.interpretation,
		aiInterpretation: local.aiInterpretation,
		isPrivate: local.isPrivate,
		isPinned: local.isPinned,
		isArchived: local.isArchived,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toDreamSymbol(local: LocalDreamSymbol): DreamSymbol {
	return {
		id: local.id,
		name: local.name,
		meaning: local.meaning,
		color: local.color,
		count: local.count ?? 0,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllDreams() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalDream>('dreams').toArray();
		return locals
			.filter((d) => !d.deletedAt && !d.isArchived)
			.map(toDream)
			.sort((a, b) => {
				if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
				return b.dreamDate.localeCompare(a.dreamDate);
			});
	}, [] as Dream[]);
}

export function useAllDreamSymbols() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalDreamSymbol>('dreamSymbols').toArray();
		return locals
			.filter((s) => !s.deletedAt)
			.map(toDreamSymbol)
			.sort((a, b) => b.count - a.count);
	}, [] as DreamSymbol[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Search dreams by title, content, location, symbols and emotions. */
export function searchDreams(dreams: Dream[], query: string): Dream[] {
	if (!query.trim()) return dreams;
	const q = query.toLowerCase();
	return dreams.filter((d) => {
		const haystack = [
			d.title,
			d.content,
			d.location,
			d.interpretation,
			...(d.symbols ?? []),
			...(d.emotions ?? []),
			...(d.people ?? []),
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

/** Group dreams by month label (e.g. "April 2026"). */
export function groupByMonth(dreams: Dream[]): Array<{ label: string; dreams: Dream[] }> {
	const groups = new Map<string, Dream[]>();
	for (const d of dreams) {
		const date = new Date(d.dreamDate);
		const label = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
		if (!groups.has(label)) groups.set(label, []);
		groups.get(label)!.push(d);
	}
	return Array.from(groups, ([label, dreams]) => ({ label, dreams }));
}

/** Format the dream date relative to today. */
export function formatDreamDate(iso: string): string {
	const date = new Date(iso);
	const today = new Date();
	const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
	if (diffDays === 0) return 'Heute Nacht';
	if (diffDays === 1) return 'Gestern Nacht';
	if (diffDays < 7) return `vor ${diffDays} Tagen`;
	return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Map of symbol name → most recent dreamDate that references it. */
export function getLastUsedBySymbol(dreams: Dream[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const d of dreams) {
		for (const sym of d.symbols ?? []) {
			const prev = map.get(sym);
			if (!prev || d.dreamDate > prev) map.set(sym, d.dreamDate);
		}
	}
	return map;
}

/** All dreams that contain the given symbol, newest first. */
export function getDreamsWithSymbol(dreams: Dream[], symbolName: string): Dream[] {
	return dreams
		.filter((d) => d.symbols?.includes(symbolName))
		.sort((a, b) => b.dreamDate.localeCompare(a.dreamDate));
}

/** Mood distribution across dreams that contain the given symbol. */
export function getMoodDistribution(
	dreams: Dream[],
	symbolName: string
): Array<{ mood: string; count: number }> {
	const buckets = new Map<string, number>();
	for (const d of dreams) {
		if (!d.symbols?.includes(symbolName)) continue;
		const key = d.mood ?? 'unbekannt';
		buckets.set(key, (buckets.get(key) ?? 0) + 1);
	}
	return Array.from(buckets, ([mood, count]) => ({ mood, count })).sort(
		(a, b) => b.count - a.count
	);
}

/** Other symbols that frequently co-occur with the given symbol. */
export function getCooccurringSymbols(
	dreams: Dream[],
	symbolName: string
): Array<{ name: string; count: number }> {
	const counts = new Map<string, number>();
	for (const d of dreams) {
		if (!d.symbols?.includes(symbolName)) continue;
		for (const sym of d.symbols) {
			if (sym === symbolName) continue;
			counts.set(sym, (counts.get(sym) ?? 0) + 1);
		}
	}
	return Array.from(counts, ([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);
}

/** Compute insights snapshot from dreams collection. */
export function computeInsights(dreams: Dream[]) {
	const total = dreams.length;
	const lucidCount = dreams.filter((d) => d.isLucid).length;
	const symbolCounts = new Map<string, number>();
	for (const d of dreams) {
		for (const sym of d.symbols ?? []) {
			symbolCounts.set(sym, (symbolCounts.get(sym) ?? 0) + 1);
		}
	}
	const topSymbols = Array.from(symbolCounts, ([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
	return {
		total,
		lucidCount,
		lucidRate: total ? lucidCount / total : 0,
		topSymbols,
	};
}
