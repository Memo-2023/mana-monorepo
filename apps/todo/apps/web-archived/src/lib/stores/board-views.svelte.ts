/**
 * Board Views Store — Mutation-Only Service
 *
 * Reads via useLiveQuery (useAllBoardViews in task-queries.ts).
 * This store only handles create, update, delete, reorder.
 */

import { boardViewCollection, type LocalBoardView, type ViewColumn } from '$lib/data/local-store';
import { withErrorHandling } from './store-helpers';

let error = $state<string | null>(null);
const setError = (e: string | null) => (error = e);

export const boardViewsStore = {
	get error() {
		return error;
	},

	async createView(data: Omit<LocalBoardView, 'id'>) {
		return withErrorHandling(
			setError,
			async () => {
				const count = await boardViewCollection.count();
				const newView: LocalBoardView = {
					...data,
					id: crypto.randomUUID(),
					order: data.order ?? count,
				};
				return await boardViewCollection.insert(newView);
			},
			'Failed to create view',
			{ log: false }
		);
	},

	async updateView(id: string, data: Partial<LocalBoardView>) {
		return withErrorHandling(
			setError,
			async () => {
				return await boardViewCollection.update(id, data as Partial<LocalBoardView>);
			},
			'Failed to update view',
			{ log: false }
		);
	},

	async deleteView(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				await boardViewCollection.delete(id);
			},
			'Failed to delete view',
			{ log: false }
		);
	},

	async reorderViews(viewIds: string[]) {
		return withErrorHandling(
			setError,
			async () => {
				for (let i = 0; i < viewIds.length; i++) {
					await boardViewCollection.update(viewIds[i], { order: i } as Partial<LocalBoardView>);
				}
			},
			'Failed to reorder views',
			{ rethrow: false, log: false }
		);
	},

	/** Update a column's taskIds (for custom groupBy with manual task assignment) */
	async updateColumnTaskIds(viewId: string, columnId: string, taskIds: string[]) {
		return withErrorHandling(
			setError,
			async () => {
				const view = await boardViewCollection.get(viewId);
				if (!view) return;

				const updatedColumns = view.columns.map((col: ViewColumn) =>
					col.id === columnId ? { ...col, match: { ...col.match, taskIds } } : col
				);
				await boardViewCollection.update(viewId, {
					columns: updatedColumns,
				} as Partial<LocalBoardView>);
			},
			'Failed to update column',
			{ log: false }
		);
	},
};
