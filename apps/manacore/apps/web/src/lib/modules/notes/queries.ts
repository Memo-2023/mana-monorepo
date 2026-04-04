/**
 * Reactive Queries & Pure Helpers for Notes module.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalNote, Note } from './types';

// ─── Type Converters ───────────────────────────────────────

export function toNote(local: LocalNote): Note {
	return {
		id: local.id,
		title: local.title,
		content: local.content,
		color: local.color,
		isPinned: local.isPinned,
		isArchived: local.isArchived,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllNotes() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalNote>('notes').toArray();
		return locals
			.filter((n) => !n.deletedAt && !n.isArchived)
			.map(toNote)
			.sort((a, b) => {
				if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
				return b.updatedAt.localeCompare(a.updatedAt);
			});
	}, [] as Note[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

/** Search notes by title and content */
export function searchNotes(notes: Note[], query: string): Note[] {
	if (!query.trim()) return notes;
	const q = query.toLowerCase();
	return notes.filter(
		(n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
	);
}

/** Get content preview (first line or truncated) */
export function getPreview(content: string, maxLen = 80): string {
	const firstLine = content.split('\n').find((l) => l.trim()) ?? '';
	const clean = firstLine.replace(/[#*_~`>\-]/g, '').trim();
	return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean;
}

/** Format relative time */
export function formatRelativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'gerade eben';
	if (mins < 60) return `vor ${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `vor ${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `vor ${days}d`;
	return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}
