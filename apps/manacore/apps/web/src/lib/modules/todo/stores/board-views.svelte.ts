/**
 * Board Views Store — Mutation-Only Service
 *
 * Reads via liveQuery (useAllBoardViews in queries.ts).
 * This store only handles create, update, delete, reorder.
 */

import { boardViewTable } from '../collections';
import type { LocalBoardView, ViewColumn } from '../types';

export const boardViewsStore = {
	async createView(data: Omit<LocalBoardView, 'id'>) {
		const existing = await boardViewTable.toArray();
		const count = existing.filter((v) => !v.deletedAt).length;

		const newView: LocalBoardView = {
			...data,
			id: crypto.randomUUID(),
			order: data.order ?? count,
		};
		await boardViewTable.add(newView);
		return newView;
	},

	async updateView(id: string, data: Partial<LocalBoardView>) {
		await boardViewTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteView(id: string) {
		await boardViewTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async reorderViews(viewIds: string[]) {
		for (let i = 0; i < viewIds.length; i++) {
			await boardViewTable.update(viewIds[i], {
				order: i,
				updatedAt: new Date().toISOString(),
			});
		}
	},

	async updateColumnTaskIds(viewId: string, columnId: string, taskIds: string[]) {
		const view = await boardViewTable.get(viewId);
		if (!view) return;

		const updatedColumns = view.columns.map((col: ViewColumn) =>
			col.id === columnId ? { ...col, match: { ...col.match, taskIds } } : col
		);
		await boardViewTable.update(viewId, {
			columns: updatedColumns,
			updatedAt: new Date().toISOString(),
		});
	},
};
