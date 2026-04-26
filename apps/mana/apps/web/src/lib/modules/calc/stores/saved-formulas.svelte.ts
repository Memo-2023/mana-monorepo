/**
 * Saved formula mutation store — write operations for the unified DB.
 */

import { db } from '$lib/data/database';
import { CalcEvents } from '@mana/shared-utils/analytics';
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
		});
		CalcEvents.formulaSaved();
	},

	async updateFormula(id: string, input: UpdateFormulaInput) {
		await db.table('savedFormulas').update(id, {
			...input,
		});
	},

	async deleteFormula(id: string) {
		await db.table('savedFormulas').update(id, {
			deletedAt: new Date().toISOString(),
		});
		CalcEvents.formulaDeleted();
	},
};
