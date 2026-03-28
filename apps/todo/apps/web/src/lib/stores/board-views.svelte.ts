/**
 * Board Views Store — Mutation-Only Service
 *
 * Reads via useLiveQuery (useAllBoardViews in task-queries.ts).
 * This store only handles create, update, delete, reorder.
 */

import { boardViewCollection, type LocalBoardView, type ViewColumn } from '$lib/data/local-store';

let error = $state<string | null>(null);

export const boardViewsStore = {
	get error() {
		return error;
	},

	async createView(data: Omit<LocalBoardView, 'id'>) {
		error = null;
		try {
			const count = await boardViewCollection.count();
			const newView: LocalBoardView = {
				...data,
				id: crypto.randomUUID(),
				order: data.order ?? count,
			};
			return await boardViewCollection.insert(newView);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create view';
			throw e;
		}
	},

	async updateView(id: string, data: Partial<LocalBoardView>) {
		error = null;
		try {
			return await boardViewCollection.update(id, data as Partial<LocalBoardView>);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update view';
			throw e;
		}
	},

	async deleteView(id: string) {
		error = null;
		try {
			await boardViewCollection.delete(id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete view';
			throw e;
		}
	},

	async reorderViews(viewIds: string[]) {
		error = null;
		try {
			for (let i = 0; i < viewIds.length; i++) {
				await boardViewCollection.update(viewIds[i], { order: i } as Partial<LocalBoardView>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder views';
		}
	},

	/** Update a column's taskIds (for custom groupBy with manual task assignment) */
	async updateColumnTaskIds(viewId: string, columnId: string, taskIds: string[]) {
		error = null;
		try {
			const view = await boardViewCollection.get(viewId);
			if (!view) return;

			const updatedColumns = view.columns.map((col: ViewColumn) =>
				col.id === columnId
					? { ...col, match: { ...col.match, taskIds } }
					: col
			);
			await boardViewCollection.update(viewId, {
				columns: updatedColumns,
			} as Partial<LocalBoardView>);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update column';
			throw e;
		}
	},
};
