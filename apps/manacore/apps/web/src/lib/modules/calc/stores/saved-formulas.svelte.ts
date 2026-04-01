/**
 * Saved formula mutation store — write operations for the unified DB.
 */

import { db } from '$lib/data/database';
import type { LocalSavedFormula } from '../types';
import type { CreateFormulaInput, UpdateFormulaInput } from '@calc/shared';

export const savedFormulasStore = {
	async saveFormula(input: CreateFormulaInput) {
		await db.table<LocalSavedFormula>('savedFormulas').add({
			id: crypto.randomUUID(),
			name: input.name,
			expression: input.expression,
			description: input.description ?? null,
			mode: input.mode,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async updateFormula(id: string, input: UpdateFormulaInput) {
		await db.table('savedFormulas').update(id, {
			...input,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteFormula(id: string) {
		await db.table('savedFormulas').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
