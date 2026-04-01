/**
 * Labels Store — Mutation-Only Service
 */

import { labelTable } from '../collections';
import type { LocalLabel } from '../types';

export const labelsStore = {
	async createLabel(data: { name: string; color: string }) {
		const newLabel: LocalLabel = {
			id: crypto.randomUUID(),
			name: data.name,
			color: data.color,
		};
		await labelTable.add(newLabel);
		return newLabel;
	},

	async updateLabel(id: string, data: Partial<Pick<LocalLabel, 'name' | 'color'>>) {
		await labelTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteLabel(id: string) {
		await labelTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
