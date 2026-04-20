import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type { First, FirstStatus, LocalFirst } from './types';

// ─── Type Converter ────────────────────────────────────────

export function toFirst(local: LocalFirst): First {
	return {
		id: local.id,
		title: local.title,
		status: local.status,
		category: local.category,
		motivation: local.motivation,
		priority: local.priority,
		date: local.date,
		note: local.note,
		expectation: local.expectation,
		reality: local.reality,
		rating: local.rating,
		wouldRepeat: local.wouldRepeat,
		personIds: local.personIds ?? [],
		sharedWith: local.sharedWith,
		mediaIds: local.mediaIds ?? [],
		audioNoteId: local.audioNoteId,
		placeId: local.placeId,
		isPinned: local.isPinned,
		isArchived: local.isArchived,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllFirsts() {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await scopedForModule<LocalFirst, string>('firsts', 'firsts').toArray()
		).filter((f) => !f.deletedAt && !f.isArchived);
		const decrypted = await decryptRecords('firsts', visible);
		return decrypted.map(toFirst).sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			// Lived entries by date desc, dreams by priority desc then createdAt desc
			if (a.status === 'lived' && b.status === 'lived') {
				return (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt);
			}
			if (a.status === 'dream' && b.status === 'dream') {
				const pDiff = (b.priority ?? 0) - (a.priority ?? 0);
				if (pDiff !== 0) return pDiff;
				return b.createdAt.localeCompare(a.createdAt);
			}
			// Lived before dreams
			return a.status === 'lived' ? -1 : 1;
		});
	}, [] as First[]);
}

export function useDreams() {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await scopedForModule<LocalFirst, string>('firsts', 'firsts').toArray()
		).filter((f) => !f.deletedAt && !f.isArchived && f.status === 'dream');
		const decrypted = await decryptRecords('firsts', visible);
		return decrypted.map(toFirst).sort((a, b) => {
			const pDiff = (b.priority ?? 0) - (a.priority ?? 0);
			if (pDiff !== 0) return pDiff;
			return b.createdAt.localeCompare(a.createdAt);
		});
	}, [] as First[]);
}

export function useLivedFirsts() {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await scopedForModule<LocalFirst, string>('firsts', 'firsts').toArray()
		).filter((f) => !f.deletedAt && !f.isArchived && f.status === 'lived');
		const decrypted = await decryptRecords('firsts', visible);
		return decrypted
			.map(toFirst)
			.sort((a, b) => (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt));
	}, [] as First[]);
}

export function useFirstsByPerson(personId: string) {
	return useLiveQueryWithDefault(async () => {
		const visible = (
			await scopedForModule<LocalFirst, string>('firsts', 'firsts').toArray()
		).filter((f) => !f.deletedAt && !f.isArchived && f.personIds?.includes(personId));
		const decrypted = await decryptRecords('firsts', visible);
		return decrypted.map(toFirst);
	}, [] as First[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

export function searchFirsts(firsts: First[], query: string): First[] {
	if (!query.trim()) return firsts;
	const q = query.toLowerCase();
	return firsts.filter((f) => {
		const haystack = [f.title, f.note, f.motivation, f.expectation, f.reality, f.sharedWith]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

export function groupByCategory(firsts: First[]): Map<string, First[]> {
	const groups = new Map<string, First[]>();
	for (const f of firsts) {
		const cat = f.category;
		if (!groups.has(cat)) groups.set(cat, []);
		groups.get(cat)!.push(f);
	}
	return groups;
}

export function groupByStatus(firsts: First[]): { dreams: First[]; lived: First[] } {
	const dreams: First[] = [];
	const lived: First[] = [];
	for (const f of firsts) {
		if (f.status === 'dream') dreams.push(f);
		else lived.push(f);
	}
	return { dreams, lived };
}

export function groupByPerson(firsts: First[]): Map<string, First[]> {
	const groups = new Map<string, First[]>();
	const alone: First[] = [];
	for (const f of firsts) {
		if (!f.personIds?.length) {
			alone.push(f);
			continue;
		}
		for (const pid of f.personIds) {
			if (!groups.has(pid)) groups.set(pid, []);
			groups.get(pid)!.push(f);
		}
	}
	if (alone.length) groups.set('__alone', alone);
	return groups;
}
