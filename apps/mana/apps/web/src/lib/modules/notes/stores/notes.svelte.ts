/**
 * Notes Store — Mutation-Only Service
 *
 * Phase 4 encryption pilot: title + content are encrypted at rest.
 * Every write that touches one of those fields is routed through
 * encryptRecord() before hitting Dexie. The Dexie hook then sees the
 * already-encrypted blob and stores it as opaque text — the rest of
 * the sync layer (pending changes, LWW, server push) handles it
 * exactly like any other string column.
 *
 * Updates that touch ONLY plaintext fields (togglePin, archiveNote,
 * deleteNote) bypass encryption automatically because encryptRecord
 * skips fields not in the registry's allowlist for the table — no
 * special-casing needed at the call sites.
 */

import { noteTable } from '../collections';
import { toNote } from '../queries';
import type { LocalNote } from '../types';
import { encryptRecord } from '$lib/data/crypto';

export const notesStore = {
	async createNote(data: { title?: string; content?: string; color?: string | null }) {
		const newLocal: LocalNote = {
			id: crypto.randomUUID(),
			title: data.title ?? '',
			content: data.content ?? '',
			color: data.color ?? null,
			isPinned: false,
			isArchived: false,
		};

		// Plaintext copy returned to the caller for optimistic UI render —
		// the persisted record (and the sync wire) carries ciphertext.
		const plaintextSnapshot = toNote(newLocal);
		await encryptRecord('notes', newLocal);
		await noteTable.add(newLocal);
		return plaintextSnapshot;
	},

	async updateNote(
		id: string,
		data: Partial<Pick<LocalNote, 'title' | 'content' | 'color' | 'isPinned' | 'isArchived'>>
	) {
		// encryptRecord mutates the diff in place. Fields not in the notes
		// allowlist (color, isPinned, isArchived) pass through untouched.
		const diff: Partial<LocalNote> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('notes', diff);
		await noteTable.update(id, diff);
	},

	async deleteNote(id: string) {
		await noteTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async togglePin(id: string) {
		const note = await noteTable.get(id);
		if (!note) return;
		await noteTable.update(id, {
			isPinned: !note.isPinned,
			updatedAt: new Date().toISOString(),
		});
	},

	async archiveNote(id: string) {
		await noteTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},
};
