/**
 * Notes Store — Mutation-Only Service
 */

import { noteTable } from '../collections';
import { toNote } from '../queries';
import type { LocalNote } from '../types';

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

		await noteTable.add(newLocal);
		return toNote(newLocal);
	},

	async updateNote(
		id: string,
		data: Partial<Pick<LocalNote, 'title' | 'content' | 'color' | 'isPinned' | 'isArchived'>>
	) {
		await noteTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
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
