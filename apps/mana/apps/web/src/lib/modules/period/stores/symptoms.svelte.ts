/**
 * Symptoms Store — Mutation-Only Service for cycle symptom taxonomy.
 */

import { cycleSymptomTable } from '../collections';
import type { LocalCycleSymptom, SymptomCategory } from '../types';

export const symptomsStore = {
	async createSymptom(data: { name: string; category?: SymptomCategory; color?: string | null }) {
		const newLocal: LocalCycleSymptom = {
			id: crypto.randomUUID(),
			name: data.name.trim(),
			category: data.category ?? 'physical',
			color: data.color ?? null,
			count: 0,
		};
		await cycleSymptomTable.add(newLocal);
		return newLocal;
	},

	async updateSymptom(
		id: string,
		data: Partial<Pick<LocalCycleSymptom, 'name' | 'category' | 'color'>>
	) {
		await cycleSymptomTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteSymptom(id: string) {
		await cycleSymptomTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Inkrementiert/dekrementiert die Verwendungszähler für IDs. */
	async touchSymptoms(ids: string[], delta: number) {
		for (const id of ids) {
			const existing = await cycleSymptomTable.get(id);
			if (!existing) continue;
			const next = Math.max(0, (existing.count ?? 0) + delta);
			await cycleSymptomTable.update(id, {
				count: next,
				updatedAt: new Date().toISOString(),
			});
		}
	},
};
