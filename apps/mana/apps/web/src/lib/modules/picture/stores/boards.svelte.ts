/**
 * Boards Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, duplicate).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalBoard, LocalBoardItem } from '../types';
import { toBoard } from '../queries';

let error = $state<string | null>(null);
let showCreateModal = $state(false);

export const boardsStore = {
	get error() {
		return error;
	},
	get showCreateModal() {
		return showCreateModal;
	},

	setShowCreateModal(show: boolean) {
		showCreateModal = show;
	},

	/**
	 * Create a new board -- writes to IndexedDB instantly.
	 */
	async createBoard(input: { name: string; description?: string; backgroundColor?: string }) {
		error = null;
		try {
			const newLocal: LocalBoard = {
				id: crypto.randomUUID(),
				name: input.name,
				description: input.description || null,
				canvasWidth: 2000,
				canvasHeight: 1500,
				backgroundColor: input.backgroundColor || '#ffffff',
				isPublic: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalBoard>('boards').add(newLocal);
			return { success: true, data: toBoard(newLocal) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create board';
			return { success: false, error };
		}
	},

	/**
	 * Update a board -- writes to IndexedDB instantly.
	 */
	async updateBoard(id: string, input: Partial<Omit<LocalBoard, 'id'>>) {
		error = null;
		try {
			await db.table('boards').update(id, {
				...input,
				updatedAt: new Date().toISOString(),
			});
			const updated = await db.table<LocalBoard>('boards').get(id);
			if (updated) {
				return { success: true, data: toBoard(updated) };
			}
			return { success: false, error: 'Board not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update board';
			return { success: false, error };
		}
	},

	/**
	 * Delete a board and all its items -- soft-deletes from IndexedDB instantly.
	 */
	async deleteBoard(id: string) {
		error = null;
		try {
			const now = new Date().toISOString();
			// Soft-delete all board items
			const items = await db
				.table<LocalBoardItem>('boardItems')
				.where('boardId')
				.equals(id)
				.toArray();
			for (const item of items) {
				await db.table('boardItems').update(item.id, { deletedAt: now, updatedAt: now });
			}
			// Soft-delete the board
			await db.table('boards').update(id, { deletedAt: now, updatedAt: now });
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete board';
			return { success: false, error };
		}
	},

	/**
	 * Duplicate a board and all its items.
	 */
	async duplicateBoard(id: string) {
		error = null;
		try {
			const original = await db.table<LocalBoard>('boards').get(id);
			if (!original) return { success: false, error: 'Board not found' };

			const newId = crypto.randomUUID();
			const now = new Date().toISOString();

			const duplicated: LocalBoard = {
				id: newId,
				name: `${original.name} (Kopie)`,
				description: original.description,
				canvasWidth: original.canvasWidth,
				canvasHeight: original.canvasHeight,
				backgroundColor: original.backgroundColor,
				isPublic: false,
				createdAt: now,
				updatedAt: now,
			};
			await db.table<LocalBoard>('boards').add(duplicated);

			// Duplicate board items
			const originalItems = await db
				.table<LocalBoardItem>('boardItems')
				.where('boardId')
				.equals(id)
				.toArray();
			for (const item of originalItems) {
				if (item.deletedAt) continue;
				await db.table<LocalBoardItem>('boardItems').add({
					...item,
					id: crypto.randomUUID(),
					boardId: newId,
					createdAt: now,
					updatedAt: now,
				});
			}

			return { success: true, data: toBoard(duplicated) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to duplicate board';
			return { success: false, error };
		}
	},
};
