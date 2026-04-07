/**
 * Day Logs Store — Mutation-Only Service for daily cycle entries.
 */

import { cycleDayLogTable, cycleTable } from '../collections';
import { toCycleDayLog } from '../queries';
import { symptomsStore } from './symptoms.svelte';
import type { CervicalMucus, Flow, LocalCycle, LocalCycleDayLog, Mood } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Findet den passenden Zyklus für ein Datum (letzter startDate <= date). */
async function resolveCycleId(date: string): Promise<string | null> {
	const all = await cycleTable.toArray();
	const candidates = all
		.filter((c: LocalCycle) => !c.deletedAt && !c.isPredicted && c.startDate <= date)
		.sort((a, b) => b.startDate.localeCompare(a.startDate));
	return candidates[0]?.id ?? null;
}

export interface LogDayInput {
	logDate?: string;
	flow?: Flow;
	mood?: Mood | null;
	energy?: number | null;
	temperature?: number | null;
	cervicalMucus?: CervicalMucus | null;
	symptoms?: string[];
	sexualActivity?: boolean | null;
	notes?: string | null;
}

export const dayLogsStore = {
	/** Erstellt oder aktualisiert den Tageseintrag (eine Zeile pro Tag). */
	async logDay(data: LogDayInput) {
		const logDate = data.logDate ?? todayIsoDate();
		const existing = (await cycleDayLogTable.where('logDate').equals(logDate).toArray()).find(
			(l) => !l.deletedAt
		);

		if (existing) {
			// Symptom-Counter aktualisieren.
			if (data.symptoms) {
				const oldSet = new Set(existing.symptoms ?? []);
				const newSet = new Set(data.symptoms);
				const added = [...newSet].filter((s) => !oldSet.has(s));
				const removed = [...oldSet].filter((s) => !newSet.has(s));
				if (added.length) await symptomsStore.touchSymptoms(added, +1);
				if (removed.length) await symptomsStore.touchSymptoms(removed, -1);
			}
			await cycleDayLogTable.update(existing.id, {
				...data,
				logDate,
				updatedAt: new Date().toISOString(),
			});
			return toCycleDayLog({ ...existing, ...data, logDate });
		}

		const cycleId = await resolveCycleId(logDate);
		const newLocal: LocalCycleDayLog = {
			id: crypto.randomUUID(),
			logDate,
			cycleId,
			flow: data.flow ?? 'none',
			mood: data.mood ?? null,
			energy: data.energy ?? null,
			temperature: data.temperature ?? null,
			cervicalMucus: data.cervicalMucus ?? null,
			symptoms: data.symptoms ?? [],
			sexualActivity: data.sexualActivity ?? null,
			notes: data.notes ?? null,
		};
		await cycleDayLogTable.add(newLocal);
		if (newLocal.symptoms.length) {
			await symptomsStore.touchSymptoms(newLocal.symptoms, +1);
		}
		return toCycleDayLog(newLocal);
	},

	async deleteLog(id: string) {
		const existing = await cycleDayLogTable.get(id);
		if (existing?.symptoms?.length) {
			await symptomsStore.touchSymptoms(existing.symptoms, -1);
		}
		await cycleDayLogTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Hängt nicht zugeordnete Logs an den passenden Zyklus an. */
	async autoAssignCycle() {
		const logs = await cycleDayLogTable.toArray();
		for (const log of logs) {
			if (log.cycleId || log.deletedAt) continue;
			const cycleId = await resolveCycleId(log.logDate);
			if (cycleId) {
				await cycleDayLogTable.update(log.id, {
					cycleId,
					updatedAt: new Date().toISOString(),
				});
			}
		}
	},
};
