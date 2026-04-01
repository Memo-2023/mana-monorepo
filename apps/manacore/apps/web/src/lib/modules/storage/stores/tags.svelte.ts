/**
 * Storage Tag Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { storageTagTable, fileTagTable } from '../collections';
import type { LocalTag, LocalFileTag } from '../types';

export const storageTagStore = {
	async create(name: string, color?: string) {
		const newTag: LocalTag = {
			id: crypto.randomUUID(),
			name,
			color: color ?? null,
		};
		await storageTagTable.add(newTag);
		return newTag;
	},

	async update(id: string, data: Partial<Pick<LocalTag, 'name' | 'color'>>) {
		await storageTagTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string) {
		await storageTagTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async tagFile(fileId: string, tagId: string) {
		const existing = await fileTagTable.where('[fileId+tagId]').equals([fileId, tagId]).first();
		if (existing) return;

		const newFileTag: LocalFileTag = {
			id: crypto.randomUUID(),
			fileId,
			tagId,
		};
		await fileTagTable.add(newFileTag);
	},

	async untagFile(fileId: string, tagId: string) {
		const existing = await fileTagTable.where('[fileId+tagId]').equals([fileId, tagId]).first();
		if (existing) {
			await fileTagTable.update(existing.id, {
				deletedAt: new Date().toISOString(),
			});
		}
	},
};
