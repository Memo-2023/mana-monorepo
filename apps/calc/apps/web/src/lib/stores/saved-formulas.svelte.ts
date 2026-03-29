/**
 * Saved formula mutation store — write operations only.
 */

import { savedFormulaCollection, type LocalSavedFormula } from '$lib/data/local-store';
import type { CreateFormulaInput, UpdateFormulaInput } from '@calc/shared';

export const savedFormulasStore = {
	async saveFormula(input: CreateFormulaInput) {
		await savedFormulaCollection.insert({
			name: input.name,
			expression: input.expression,
			description: input.description ?? null,
			mode: input.mode,
		} as Omit<LocalSavedFormula, 'id'>);
	},

	async updateFormula(id: string, input: UpdateFormulaInput) {
		await savedFormulaCollection.update(id, input);
	},

	async deleteFormula(id: string) {
		await savedFormulaCollection.delete(id);
	},
};
