/**
 * Calculation mutation store — write operations only.
 * Reads come from live query hooks in queries.ts.
 */

import { calculationCollection, type LocalCalculation } from '$lib/data/local-store';
import type { CreateCalculationInput } from '@calc/shared';

export const calculationsStore = {
	async addCalculation(input: CreateCalculationInput) {
		await calculationCollection.insert({
			mode: input.mode,
			expression: input.expression,
			result: input.result,
			skin: input.skin,
		} as Omit<LocalCalculation, 'id'>);
	},

	async deleteCalculation(id: string) {
		await calculationCollection.delete(id);
	},

	async clearHistory() {
		const all = await calculationCollection.getAll();
		for (const item of all) {
			await calculationCollection.delete(item.id);
		}
	},
};
