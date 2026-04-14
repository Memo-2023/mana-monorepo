/**
 * Periods Store — Mutation-Only Service for menstrual periods.
 */

import { periodTable } from '../collections';
import { toPeriod } from '../queries';
import { daysBetween } from '../utils/phase';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import type { LocalPeriod } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function dayBefore(iso: string): string {
	const d = new Date(iso);
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

export const periodsStore = {
	/** Startet einen neuen Zyklus. Schließt automatisch den vorigen offenen Zyklus. */
	async createPeriod(data: { startDate?: string; notes?: string | null }) {
		const startDate = data.startDate ?? todayIsoDate();

		// Vorigen offenen Zyklus schließen.
		const all = await periodTable.toArray();
		const open = all
			.filter((c) => !c.deletedAt && !c.isPredicted && c.endDate === null)
			.sort((a, b) => b.startDate.localeCompare(a.startDate));
		for (const prev of open) {
			if (prev.startDate >= startDate) continue;
			const endDate = dayBefore(startDate);
			const length = daysBetween(startDate, prev.startDate);
			await periodTable.update(prev.id, {
				endDate,
				length,
				updatedAt: new Date().toISOString(),
			});
		}

		// Create a TimeBlock for the menstruation phase (allDay, open-ended until periodEnd is set)
		const periodId = crypto.randomUUID();
		const timeBlockId = await createBlock({
			startDate: `${startDate}T00:00:00.000Z`,
			endDate: null,
			allDay: true,
			kind: 'logged',
			type: 'period',
			sourceModule: 'period',
			sourceId: periodId,
			title: 'Periode',
			color: '#ec4899',
		});

		const newLocal: LocalPeriod = {
			id: periodId,
			startDate,
			periodEndDate: null,
			endDate: null,
			length: null,
			isPredicted: false,
			isArchived: false,
			notes: data.notes ?? null,
			timeBlockId,
		};
		const plaintextSnapshot = toPeriod(newLocal);
		await encryptRecord('periods', newLocal);
		await periodTable.add(newLocal);
		emitDomainEvent('PeriodDayLogged', 'period', 'periodDayLogs', newLocal.id, {
			logId: newLocal.id,
			date: newLocal.startDate,
			flow: null,
		});
		return plaintextSnapshot;
	},

	async updatePeriod(
		id: string,
		data: Partial<
			Pick<
				LocalPeriod,
				'startDate' | 'periodEndDate' | 'endDate' | 'length' | 'notes' | 'isArchived'
			>
		>
	) {
		const diff: Partial<LocalPeriod> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('periods', diff);
		await periodTable.update(id, diff);
	},

	/** Markiert das Ende der Blutung (nicht das Ende des Zyklus). */
	async setPeriodEnd(id: string, periodEndDate: string | null) {
		const period = await periodTable.get(id);
		await periodTable.update(id, {
			periodEndDate,
			updatedAt: new Date().toISOString(),
		});
		// Update the TimeBlock's endDate to reflect the period duration
		if (period?.timeBlockId && periodEndDate) {
			await updateBlock(period.timeBlockId, {
				endDate: `${periodEndDate}T23:59:59.999Z`,
			});
		}
	},

	async deletePeriod(id: string) {
		const period = await periodTable.get(id);
		if (period?.timeBlockId) {
			await deleteBlock(period.timeBlockId);
		}
		await periodTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async archivePeriod(id: string) {
		await periodTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},
};
