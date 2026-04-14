/**
 * Symptoms Store — Mutation-Only Service for period symptom taxonomy.
 */

import { periodSymptomTable } from '../collections';
import type { LocalPeriodSymptom, SymptomCategory } from '../types';

export const symptomsStore = {
	async createSymptom(data: { name: string; category?: SymptomCategory; color?: string | null }) {
		const newLocal: LocalPeriodSymptom = {
			id: crypto.randomUUID(),
			name: data.name.trim(),
			category: data.category ?? 'physical',
			color: data.color ?? null,
			count: 0,
		};
		await periodSymptomTable.add(newLocal);
		return newLocal;
	},

	async updateSymptom(
		id: string,
		data: Partial<Pick<LocalPeriodSymptom, 'name' | 'category' | 'color'>>
	) {
		await periodSymptomTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteSymptom(id: string) {
		await periodSymptomTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Inkrementiert/dekrementiert die Verwendungszähler für IDs. */
	async touchSymptoms(ids: string[], delta: number) {
		for (const id of ids) {
			const existing = await periodSymptomTable.get(id);
			if (!existing) continue;
			const next = Math.max(0, (existing.count ?? 0) + delta);
			await periodSymptomTable.update(id, {
				count: next,
				updatedAt: new Date().toISOString(),
			});
		}
	},
};
