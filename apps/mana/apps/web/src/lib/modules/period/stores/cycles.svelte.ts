/**
 * Cycles Store — Mutation-Only Service for menstrual cycles.
 */

import { cycleTable } from '../collections';
import { toCycle } from '../queries';
import { daysBetween } from '../utils/phase';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
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

		// Create a TimeBlock for the menstruation phase (allDay, open-ended until periodEnd is set)
		const cycleId = crypto.randomUUID();
		const timeBlockId = await createBlock({
			startDate: `${startDate}T00:00:00.000Z`,
			endDate: null,
			allDay: true,
			kind: 'logged',
			type: 'cycle',
			sourceModule: 'cycles',
			sourceId: cycleId,
			title: 'Periode',
			color: '#ec4899',
		});

		const newLocal: LocalCycle = {
			id: cycleId,
			startDate,
			periodEndDate: null,
			endDate: null,
			length: null,
			isPredicted: false,
			isArchived: false,
			notes: data.notes ?? null,
			timeBlockId,
		};
		const plaintextSnapshot = toCycle(newLocal);
		await encryptRecord('cycles', newLocal);
		await cycleTable.add(newLocal);
		emitDomainEvent('CycleDayLogged', 'cycles', 'cycleDayLogs', newLocal.id, {
			logId: newLocal.id,
			date: newLocal.startDate,
			flow: null,
		});
		return plaintextSnapshot;
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
		const diff: Partial<LocalCycle> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('cycles', diff);
		await cycleTable.update(id, diff);
	},

	/** Markiert das Ende der Blutung (nicht das Ende des Zyklus). */
	async setPeriodEnd(id: string, periodEndDate: string | null) {
		const cycle = await cycleTable.get(id);
		await cycleTable.update(id, {
			periodEndDate,
			updatedAt: new Date().toISOString(),
		});
		// Update the TimeBlock's endDate to reflect the period duration
		if (cycle?.timeBlockId && periodEndDate) {
			await updateBlock(cycle.timeBlockId, {
				endDate: `${periodEndDate}T23:59:59.999Z`,
			});
		}
	},

	async deleteCycle(id: string) {
		const cycle = await cycleTable.get(id);
		if (cycle?.timeBlockId) {
			await deleteBlock(cycle.timeBlockId);
		}
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
