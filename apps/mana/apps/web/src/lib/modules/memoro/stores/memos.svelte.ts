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
	}) {
		const newLocal: LocalMemo = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			intro: null,
			transcript: data.transcript ?? null,
			audioDurationMs: null,
			processingStatus: data.transcript ? 'completed' : 'pending',
			isArchived: false,
			isPinned: false,
			isPublic: false,
			blueprintId: data.blueprintId ?? null,
			language: data.language ?? null,
		};
		await memoTable.add(newLocal);
		MemoroEvents.memoCreated();
		return toMemo(newLocal);
	},

	/** Update a memo's fields. */
	async update(
		id: string,
		data: Partial<Pick<LocalMemo, 'title' | 'intro' | 'transcript' | 'language' | 'isPublic'>>
	) {
		await memoTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
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
