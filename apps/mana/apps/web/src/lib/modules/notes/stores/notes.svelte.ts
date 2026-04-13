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
import type { LocalNote, Note } from '../types';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { transcribeAudio } from '$lib/voice/transcribe';

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
		emitDomainEvent('NoteCreated', 'notes', 'notes', newLocal.id, {
			noteId: newLocal.id,
			title: data.title,
		});
		return plaintextSnapshot;
	},

	/**
	 * Create a note from a voice recording. Returns the placeholder note
	 * immediately so the UI can navigate to it; the transcript is filled
	 * in asynchronously once mana-stt returns. The placeholder title
	 * 'Sprachnotiz' is intentionally generic — once we have a transcript,
	 * the user can rename inline like any other note.
	 */
	async createFromVoice(blob: Blob, _durationMs: number, language = 'de'): Promise<Note> {
		const note = await this.createNote({ title: 'Sprachnotiz', content: '…' });
		// Fire-and-forget: caller has already navigated into edit mode.
		void this.transcribeIntoNote(note.id, blob, language);
		return note;
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the
	 * transcript into an existing note. On failure, surfaces the error
	 * inline as the note content so the user isn't left with an empty
	 * placeholder.
	 */
	async transcribeIntoNote(noteId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const result = await transcribeAudio(blob, language);
			const transcript = result.text;

			const firstLine = transcript.split('\n')[0]?.trim() ?? '';
			const title = firstLine.length > 0 && firstLine.length <= 80 ? firstLine : 'Sprachnotiz';

			const diff: Partial<LocalNote> = {
				title,
				content: transcript,
				transcriptModel: result.model,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('notes', diff);
			await noteTable.update(noteId, diff);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await this.updateNote(noteId, {
				title: 'Sprachnotiz (Fehler)',
				content: `Transkription fehlgeschlagen: ${msg}`,
			});
		}
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
		emitDomainEvent('NoteDeleted', 'notes', 'notes', id, { noteId: id });
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
