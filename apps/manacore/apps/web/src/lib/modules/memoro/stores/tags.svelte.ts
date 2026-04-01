/**
 * Tags Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles tag CRUD and memo-tag associations.
 */

import { memoroTagTable, memoTagTable } from '../collections';
import { toTag } from '../queries';
import type { LocalTag, LocalMemoTag } from '../types';

export const tagsStore = {
	/** Create a new tag. */
	async create(data: { name: string; color?: string }) {
		const all = await memoroTagTable.toArray();
		const active = all.filter((t) => !t.deletedAt);
		const newLocal: LocalTag = {
			id: crypto.randomUUID(),
			name: data.name,
			color: data.color ?? null,
			isPinned: false,
			sortOrder: active.length,
		};
		await memoroTagTable.add(newLocal);
		return toTag(newLocal);
	},

	/** Update a tag. */
	async update(id: string, data: Partial<Pick<LocalTag, 'name' | 'color' | 'isPinned'>>) {
		await memoroTagTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a tag and its associations. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await memoroTagTable.update(id, { deletedAt: now, updatedAt: now });
		// Soft-delete associations
		const allMT = await memoTagTable.where('tagId').equals(id).toArray();
		for (const mt of allMT) {
			await memoTagTable.update(mt.id, { deletedAt: now, updatedAt: now });
		}
	},

	/** Add a tag to a memo. */
	async addToMemo(memoId: string, tagId: string) {
		// Check if association already exists
		const existing = await memoTagTable.toArray();
		if (existing.some((mt) => mt.memoId === memoId && mt.tagId === tagId && !mt.deletedAt)) {
			return;
		}
		const newMT: LocalMemoTag = {
			id: crypto.randomUUID(),
			memoId,
			tagId,
		};
		await memoTagTable.add(newMT);
	},

	/** Remove a tag from a memo. */
	async removeFromMemo(memoId: string, tagId: string) {
		const all = await memoTagTable.toArray();
		const toRemove = all.find((mt) => mt.memoId === memoId && mt.tagId === tagId && !mt.deletedAt);
		if (toRemove) {
			const now = new Date().toISOString();
			await memoTagTable.update(toRemove.id, { deletedAt: now, updatedAt: now });
		}
	},
};
