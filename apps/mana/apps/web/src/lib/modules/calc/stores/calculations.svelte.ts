/**
 * Calculation mutation store — write operations for the unified DB.
 */

import { db } from '$lib/data/database';
import { CalcEvents } from '@mana/shared-utils/analytics';
import { getEffectiveSpaceId } from '$lib/data/scope';
import type { LocalCalculation } from '../types';
import type { CreateCalculationInput } from '@calc/shared';

export const calculationsStore = {
	async addCalculation(input: CreateCalculationInput) {
		await db.table('calculations').add({
			id: crypto.randomUUID(),
			mode: input.mode,
			expression: input.expression,
			result: input.result,
			skin: input.skin,
			spaceId: getEffectiveSpaceId(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		CalcEvents.calculationAdded();
	},

	async deleteCalculation(id: string) {
		await db.table('calculations').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async clearHistory() {
		const now = new Date().toISOString();
		const all = await db.table<LocalCalculation>('calculations').toArray();
		const active = all.filter((c) => !c.deletedAt);
		await Promise.all(
			active.map((c) => db.table('calculations').update(c.id, { deletedAt: now, updatedAt: now }))
		);
		CalcEvents.historyCleared();
	},
};
