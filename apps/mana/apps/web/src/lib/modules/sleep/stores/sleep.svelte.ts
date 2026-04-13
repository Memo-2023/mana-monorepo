/**
 * Sleep Store — mutation-only service for the sleep module.
 *
 * All reads happen via liveQuery hooks in queries.ts.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import {
	sleepEntryTable,
	sleepHygieneLogTable,
	sleepHygieneCheckTable,
	sleepSettingsTable,
} from '../collections';
import { toSleepEntry, toSleepHygieneLog, toSleepHygieneCheck, calcDurationMin } from '../queries';
import type {
	LocalSleepEntry,
	LocalSleepHygieneLog,
	LocalSleepHygieneCheck,
	LocalSleepSettings,
	HygieneCategory,
} from '../types';
import { DEFAULT_SLEEP_SETTINGS } from '../types';

export const sleepStore = {
	// ─── Sleep Entries ──────────────────────────────

	async logSleep(input: {
		date: string;
		bedtime: string;
		wakeTime: string;
		quality: number;
		sleepLatencyMin?: number | null;
		interruptions?: number;
		interruptionDurationMin?: number;
		restedness?: number | null;
		notes?: string;
		tags?: string[];
		dreamIds?: string[];
	}) {
		const durationMin = calcDurationMin(input.bedtime, input.wakeTime);

		// Upsert: if an entry for this date already exists, update it
		const existing = (await sleepEntryTable.toArray()).find(
			(e) => !e.deletedAt && e.date === input.date
		);

		if (existing) {
			const patch: Partial<LocalSleepEntry> = {
				bedtime: input.bedtime,
				wakeTime: input.wakeTime,
				durationMin,
				quality: input.quality,
				sleepLatencyMin: input.sleepLatencyMin ?? existing.sleepLatencyMin,
				interruptions: input.interruptions ?? existing.interruptions,
				interruptionDurationMin: input.interruptionDurationMin ?? existing.interruptionDurationMin,
				restedness: input.restedness ?? existing.restedness,
				notes: input.notes ?? existing.notes,
				tags: input.tags ?? existing.tags,
				dreamIds: input.dreamIds ?? existing.dreamIds,
			};
			const wrapped = await encryptRecord('sleepEntries', { ...patch });
			await sleepEntryTable.update(existing.id, {
				...wrapped,
				updatedAt: new Date().toISOString(),
			});
			return toSleepEntry({ ...existing, ...patch });
		}

		const newLocal: LocalSleepEntry = {
			id: crypto.randomUUID(),
			date: input.date,
			bedtime: input.bedtime,
			wakeTime: input.wakeTime,
			durationMin,
			sleepLatencyMin: input.sleepLatencyMin ?? null,
			interruptions: input.interruptions ?? 0,
			interruptionDurationMin: input.interruptionDurationMin ?? 0,
			quality: input.quality,
			restedness: input.restedness ?? null,
			notes: input.notes ?? '',
			tags: input.tags ?? [],
			dreamIds: input.dreamIds ?? [],
		};
		const snapshot = toSleepEntry({ ...newLocal });
		await encryptRecord('sleepEntries', newLocal);
		await sleepEntryTable.add(newLocal);
		emitDomainEvent('SleepLogged', 'sleep', 'sleepEntries', newLocal.id, {
			entryId: newLocal.id,
			date: input.date,
			durationMin: durationMin,
			quality: input.quality,
		});
		return snapshot;
	},

	async updateEntry(
		id: string,
		patch: Partial<
			Pick<
				LocalSleepEntry,
				| 'bedtime'
				| 'wakeTime'
				| 'quality'
				| 'sleepLatencyMin'
				| 'interruptions'
				| 'interruptionDurationMin'
				| 'restedness'
				| 'notes'
				| 'tags'
				| 'dreamIds'
			>
		>
	) {
		// Recalculate duration if times changed
		const update: Record<string, unknown> = { ...patch };
		if (patch.bedtime || patch.wakeTime) {
			const entry = await sleepEntryTable.get(id);
			if (entry) {
				const bedtime = patch.bedtime ?? entry.bedtime;
				const wakeTime = patch.wakeTime ?? entry.wakeTime;
				update.durationMin = calcDurationMin(bedtime, wakeTime);
			}
		}
		const wrapped = await encryptRecord('sleepEntries', update);
		await sleepEntryTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteEntry(id: string) {
		await sleepEntryTable.update(id, { deletedAt: new Date().toISOString() });
	},

	// ─── Hygiene Logs ───────────────────────────────

	async logHygiene(input: {
		date: string;
		completedCheckIds: string[];
		totalActiveChecks: number;
	}) {
		const score =
			input.totalActiveChecks > 0
				? Math.round((input.completedCheckIds.length / input.totalActiveChecks) * 100)
				: 0;

		// Upsert by date
		const existing = (await sleepHygieneLogTable.toArray()).find(
			(l) => !l.deletedAt && l.date === input.date
		);

		if (existing) {
			await sleepHygieneLogTable.update(existing.id, {
				completedCheckIds: input.completedCheckIds,
				score,
				updatedAt: new Date().toISOString(),
			});
			return toSleepHygieneLog({ ...existing, completedCheckIds: input.completedCheckIds, score });
		}

		const newLocal: LocalSleepHygieneLog = {
			id: crypto.randomUUID(),
			date: input.date,
			completedCheckIds: input.completedCheckIds,
			score,
		};
		const snapshot = toSleepHygieneLog({ ...newLocal });
		await sleepHygieneLogTable.add(newLocal);
		return snapshot;
	},

	// ─── Hygiene Checks ─────────────────────────────

	async createCheck(input: { name: string; description?: string; category?: HygieneCategory }) {
		const existing = await sleepHygieneCheckTable.toArray();
		const order = existing.filter((c) => !c.deletedAt).length;

		const newLocal: LocalSleepHygieneCheck = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? '',
			category: input.category ?? 'custom',
			isActive: true,
			isPreset: false,
			order,
		};
		const snapshot = toSleepHygieneCheck({ ...newLocal });
		await encryptRecord('sleepHygieneChecks', newLocal);
		await sleepHygieneCheckTable.add(newLocal);
		return snapshot;
	},

	async updateCheck(
		id: string,
		patch: Partial<Pick<LocalSleepHygieneCheck, 'name' | 'description' | 'isActive' | 'order'>>
	) {
		const wrapped = await encryptRecord('sleepHygieneChecks', { ...patch });
		await sleepHygieneCheckTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleCheck(id: string) {
		const check = await sleepHygieneCheckTable.get(id);
		if (!check) return;
		await sleepHygieneCheckTable.update(id, {
			isActive: !check.isActive,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteCheck(id: string) {
		const check = await sleepHygieneCheckTable.get(id);
		if (!check || check.isPreset) return;
		await sleepHygieneCheckTable.update(id, { deletedAt: new Date().toISOString() });
	},

	// ─── Settings ───────────────────────────────────

	async updateSettings(
		patch: Partial<
			Pick<
				LocalSleepSettings,
				| 'goalMin'
				| 'targetBedtime'
				| 'targetWakeTime'
				| 'bedtimeReminderMin'
				| 'morningReminderEnabled'
				| 'morningReminderTime'
			>
		>
	) {
		const existing = (await sleepSettingsTable.toArray()).find((s) => !s.deletedAt);

		if (existing) {
			await sleepSettingsTable.update(existing.id, {
				...patch,
				updatedAt: new Date().toISOString(),
			});
			return;
		}

		const newLocal: LocalSleepSettings = {
			id: crypto.randomUUID(),
			...DEFAULT_SLEEP_SETTINGS,
			...patch,
		};
		await sleepSettingsTable.add(newLocal);
	},
};
