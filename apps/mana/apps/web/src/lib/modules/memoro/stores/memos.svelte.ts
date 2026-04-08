/**
 * Memos Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles memo CRUD, archive, pin, delete.
 */

import { memoTable } from '../collections';
import { toMemo } from '../queries';
import { createArchiveOps } from '@mana/shared-stores';
import { MemoroEvents } from '@mana/shared-utils/analytics';
import { encryptRecord } from '$lib/data/crypto';
import type { LocalMemo } from '../types';

/** Archive/soft-delete ops for memos. */
export const memoArchive = createArchiveOps({
	table: () => memoTable,
});

export const memosStore = {
	/** Create a new memo (e.g., after recording). */
	async create(data: {
		title?: string;
		transcript?: string;
		language?: string;
		blueprintId?: string;
		audioDurationMs?: number;
		processingStatus?: LocalMemo['processingStatus'];
	}) {
		const newLocal: LocalMemo = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			intro: null,
			transcript: data.transcript ?? null,
			audioDurationMs: data.audioDurationMs ?? null,
			processingStatus: data.processingStatus ?? (data.transcript ? 'completed' : 'pending'),
			isArchived: false,
			isPinned: false,
			isPublic: false,
			blueprintId: data.blueprintId ?? null,
			language: data.language ?? null,
		};
		const plaintextSnapshot = toMemo(newLocal);
		await encryptRecord('memos', newLocal);
		await memoTable.add(newLocal);
		MemoroEvents.memoCreated();
		return plaintextSnapshot;
	},

	/**
	 * Create a placeholder memo from a fresh voice recording and start the
	 * background transcription. Returns the new memo immediately so the UI
	 * can navigate / show a "processing" state without waiting.
	 */
	async createFromVoice(blob: Blob, durationMs: number, language?: string) {
		const memo = await this.create({
			audioDurationMs: durationMs,
			language,
			processingStatus: 'processing',
		});
		// Fire and forget — transcription updates the memo when it returns.
		void this.transcribeBlob(memo.id, blob, language);
		return memo;
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the result
	 * back into the memo. Marks completed on success, failed on error.
	 */
	async transcribeBlob(memoId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const form = new FormData();
			const ext = blob.type.includes('webm')
				? '.webm'
				: blob.type.includes('mp4')
					? '.m4a'
					: '.audio';
			form.append('file', blob, `memo${ext}`);
			if (language) form.append('language', language);

			const response = await fetch('/api/v1/voice/transcribe', {
				method: 'POST',
				body: form,
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(text || `HTTP ${response.status}`);
			}

			const result = (await response.json()) as {
				text: string;
				language: string | null;
				durationSeconds: number | null;
			};

			const transcript = (result.text ?? '').trim();
			const existing = await memoTable.get(memoId);
			if (!existing) return;

			const diff: Partial<LocalMemo> = {
				transcript,
				language: existing.language ?? result.language ?? null,
				processingStatus: 'completed',
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('memos', diff);
			await memoTable.update(memoId, diff);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await memoTable.update(memoId, {
				processingStatus: 'failed',
				metadata: { ...(((await memoTable.get(memoId))?.metadata as object) ?? {}), error: msg },
				updatedAt: new Date().toISOString(),
			});
		}
	},

	/** Update a memo's fields. */
	async update(
		id: string,
		data: Partial<Pick<LocalMemo, 'title' | 'intro' | 'transcript' | 'language' | 'isPublic'>>
	) {
		const diff: Partial<LocalMemo> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('memos', diff);
		await memoTable.update(id, diff);
	},

	// Archive ops (delegated to shared factory)
	archive: (id: string) => memoArchive.archive(id),
	unarchive: (id: string) => memoArchive.unarchive(id),

	/** Pin a memo. */
	async pin(id: string) {
		await memoTable.update(id, {
			isPinned: true,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Unpin a memo. */
	async unpin(id: string) {
		await memoTable.update(id, {
			isPinned: false,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a memo. */
	async delete(id: string) {
		await memoArchive.softDelete(id);
		MemoroEvents.memoDeleted();
	},
};
