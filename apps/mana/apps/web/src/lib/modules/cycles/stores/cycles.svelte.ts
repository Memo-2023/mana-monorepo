/**
 * Cycles Store — Mutation-Only Service for menstrual cycles.
 */

import { cycleTable } from '../collections';
import { toCycle } from '../queries';
import { daysBetween } from '../utils/phase';
import type { LocalCycle } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function dayBefore(iso: string): string {
	const d = new Date(iso);
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

export const cyclesStore = {
	/** Startet einen neuen Zyklus. Schließt automatisch den vorigen offenen Zyklus. */
	async createCycle(data: { startDate?: string; notes?: string | null }) {
		const startDate = data.startDate ?? todayIsoDate();

		// Vorigen offenen Zyklus schließen.
		const all = await cycleTable.toArray();
		const open = all
			.filter((c) => !c.deletedAt && !c.isPredicted && c.endDate === null)
			.sort((a, b) => b.startDate.localeCompare(a.startDate));
		for (const prev of open) {
			if (prev.startDate >= startDate) continue;
			const endDate = dayBefore(startDate);
			const length = daysBetween(startDate, prev.startDate);
			await cycleTable.update(prev.id, {
				endDate,
				length,
				updatedAt: new Date().toISOString(),
			});
		}

		const newLocal: LocalCycle = {
			id: crypto.randomUUID(),
			startDate,
			periodEndDate: null,
			endDate: null,
			length: null,
			isPredicted: false,
			isArchived: false,
			notes: data.notes ?? null,
		};
		await cycleTable.add(newLocal);
		return toCycle(newLocal);
	},

	async updateCycle(
		id: string,
		data: Partial<
			Pick<
				LocalCycle,
				'startDate' | 'periodEndDate' | 'endDate' | 'length' | 'notes' | 'isArchived'
			>
		>
	) {
		await cycleTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Markiert das Ende der Blutung (nicht das Ende des Zyklus). */
	async setPeriodEnd(id: string, periodEndDate: string | null) {
		await cycleTable.update(id, {
			periodEndDate,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteCycle(id: string) {
		await cycleTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async archiveCycle(id: string) {
		await cycleTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},
};
