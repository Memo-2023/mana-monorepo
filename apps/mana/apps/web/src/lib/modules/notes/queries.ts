/**
 * Reactive Queries & Pure Helpers for Notes module.
 *
 * Phase 4 encryption pilot: notes are encrypted at rest. Reads decrypt
 * on the fly via decryptRecords() before mapping to the public Note
 * shape. Sort and filter operations all run against PLAINTEXT metadata
 * (`isPinned`, `isArchived`, `updatedAt`, `deletedAt`) so the indexes
 * still work without ever touching ciphertext.
 *
 * Search: keep the existing in-memory `searchNotes()` helper. It runs
 * AFTER decryption (against the public Note objects), so a free-text
 * search through ~hundreds of notes still works in the UI without
 * leaking anything to the server. Real searchable-encrypted index is
 * a future concern only if note volume per user grows past that.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
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
		// Filter on plaintext metadata first — none of these fields are
		// in the encryption registry, so they stay readable even with
		// the vault locked. Cuts the decrypt workload to only what the
		// view actually renders.
		const visible = (await db.table<LocalNote>('notes').toArray()).filter(
			(n) => !n.deletedAt && !n.isArchived
		);
		// Locked vault returns the blobs untouched so the UI can render
		// a "🔒" placeholder where title/content would be.
		const decrypted = await decryptRecords('notes', visible);
		return decrypted.map(toNote).sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			return b.updatedAt.localeCompare(a.updatedAt);
		});
	}, [] as Note[]);
}

/** Single note by id, decrypted. Used by detail views. */
export function useNote(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const local = await db.table<LocalNote>('notes').get(id);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('notes', [local]);
			return decrypted ? toNote(decrypted) : null;
		},
		null as Note | null
	);
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
