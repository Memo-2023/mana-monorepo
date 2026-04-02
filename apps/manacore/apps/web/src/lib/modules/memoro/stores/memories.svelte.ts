/**
 * Memories Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles memory (AI insight) CRUD.
 */

import { memoryTable } from '../collections';
import { toMemory } from '../queries';
import { MemoroEvents } from '@manacore/shared-utils/analytics';
import type { LocalMemory } from '../types';

export const memoriesStore = {
	/** Create a new memory for a memo. */
	async create(data: { memoId: string; title: string; content?: string }) {
		const newLocal: LocalMemory = {
			id: crypto.randomUUID(),
			memoId: data.memoId,
			title: data.title,
			content: data.content ?? null,
		};
		await memoryTable.add(newLocal);
		MemoroEvents.memoCreated();
		return toMemory(newLocal);
	},

	/** Update a memory. */
	async update(id: string, data: Partial<Pick<LocalMemory, 'title' | 'content'>>) {
		await memoryTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a memory. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await memoryTable.update(id, { deletedAt: now, updatedAt: now });
		MemoroEvents.memoDeleted();
	},
};
