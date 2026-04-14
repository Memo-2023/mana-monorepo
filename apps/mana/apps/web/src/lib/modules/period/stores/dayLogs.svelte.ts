/**
 * Day Logs Store — Mutation-Only Service for daily period entries.
 */

import { periodDayLogTable, periodTable } from '../collections';
import { toPeriod, toPeriodDayLog } from '../queries';
import { detectPeriodEnd, shouldStartNewPeriod } from '../utils/auto-detect';
import { periodsStore } from './periods.svelte';
import { symptomsStore } from './symptoms.svelte';
import { encryptRecord } from '$lib/data/crypto';
import type { CervicalMucus, Flow, LocalPeriod, LocalPeriodDayLog, Mood } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Findet den passenden Zyklus für ein Datum (letzter startDate <= date). */
async function resolvePeriodId(date: string): Promise<string | null> {
	const all = await periodTable.toArray();
	const candidates = all
		.filter((c: LocalPeriod) => !c.deletedAt && !c.isPredicted && c.startDate <= date)
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

		// ─ Auto-Start: explizites flow + Bedingungen erfüllt → neuen Zyklus VOR dem Schreiben anlegen
		if (data.flow !== undefined) {
			const allPeriods = await periodTable.toArray();
			const visiblePeriods = allPeriods.filter((c) => !c.deletedAt).map(toPeriod);
			if (shouldStartNewPeriod(logDate, data.flow, visiblePeriods)) {
				await periodsStore.createPeriod({ startDate: logDate });
			}
		}

		const existing = (await periodDayLogTable.where('logDate').equals(logDate).toArray()).find(
			(l) => !l.deletedAt
		);

		let result: LocalPeriodDayLog;
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
			const updateDiff: Partial<LocalPeriodDayLog> = {
				...data,
				logDate,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('periodDayLogs', updateDiff);
			await periodDayLogTable.update(existing.id, updateDiff);
			// `result` keeps the plaintext for the return value — caller
			// expects to render the input back.
			result = { ...existing, ...data, logDate };
		} else {
			const periodId = await resolvePeriodId(logDate);
			const newLocal: LocalPeriodDayLog = {
				id: crypto.randomUUID(),
				logDate,
				periodId,
				flow: data.flow ?? 'none',
				mood: data.mood ?? null,
				energy: data.energy ?? null,
				temperature: data.temperature ?? null,
				cervicalMucus: data.cervicalMucus ?? null,
				symptoms: data.symptoms ?? [],
				sexualActivity: data.sexualActivity ?? null,
				notes: data.notes ?? null,
			};
			// Plaintext copy retained for the return value — what we
			// write to disk is encrypted.
			result = { ...newLocal };
			await encryptRecord('periodDayLogs', newLocal);
			await periodDayLogTable.add(newLocal);
			if (result.symptoms.length) {
				await symptomsStore.touchSymptoms(result.symptoms, +1);
			}
		}

		// ─ Auto-End: Wenn explizit 'none' geloggt wurde, prüfe ob die Periode beendet werden soll
		if (data.flow === 'none' && result.periodId) {
			const openPeriodLocal = await periodTable.get(result.periodId);
			if (openPeriodLocal && !openPeriodLocal.deletedAt && !openPeriodLocal.periodEndDate) {
				const periodLogsLocal = await periodDayLogTable
					.where('periodId')
					.equals(result.periodId)
					.toArray();
				const periodLogs = periodLogsLocal.filter((l) => !l.deletedAt).map(toPeriodDayLog);
				const endDate = detectPeriodEnd(logDate, 'none', toPeriod(openPeriodLocal), periodLogs);
				if (endDate) {
					await periodsStore.setPeriodEnd(openPeriodLocal.id, endDate);
				}
			}
		}

		return toPeriodDayLog(result);
	},

	async deleteLog(id: string) {
		const existing = await periodDayLogTable.get(id);
		if (existing?.symptoms?.length) {
			await symptomsStore.touchSymptoms(existing.symptoms, -1);
		}
		await periodDayLogTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/** Hängt nicht zugeordnete Logs an den passenden Zyklus an. */
	async autoAssignPeriod() {
		const logs = await periodDayLogTable.toArray();
		for (const log of logs) {
			if (log.periodId || log.deletedAt) continue;
			const periodId = await resolvePeriodId(log.logDate);
			if (periodId) {
				await periodDayLogTable.update(log.id, {
					periodId,
					updatedAt: new Date().toISOString(),
				});
			}
		}
	},
};
