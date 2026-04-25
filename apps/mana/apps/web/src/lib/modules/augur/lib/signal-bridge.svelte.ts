/**
 * Augur — Cross-Module Signal Bridge
 *
 * Reads the plaintext daily aggregates from `mood` and `sleep` for the
 * correlation engine. Both modules keep `level` / `quality` /
 * `durationMin` plaintext (only `notes` / `withWhom` are encrypted), so
 * we can build per-date maps without touching the vault.
 *
 * Returns reactive maps inside a Svelte runes wrapper.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { scopedForModule } from '$lib/data/scope';
import type { LocalMoodEntry } from '$lib/modules/mood/types';
import type { LocalSleepEntry } from '$lib/modules/sleep/types';
import type { MoodByDate, SleepByDate, SleepDay } from './correlation-engine';

/** Per-date mean mood level. Multiple check-ins on the same day get
 *  averaged because a single number is the right granularity for the
 *  correlation engine's "what was the mood window" question. */
export function useMoodByDate() {
	return useScopedLiveQuery(async () => {
		const rows = await scopedForModule<LocalMoodEntry, string>('mood', 'moodEntries').toArray();
		const visible = rows.filter((r) => !r.deletedAt && r.date);
		const sums = new Map<string, { sum: number; count: number }>();
		for (const r of visible) {
			const lvl = Number(r.level);
			if (!Number.isFinite(lvl)) continue;
			const cur = sums.get(r.date) ?? { sum: 0, count: 0 };
			cur.sum += lvl;
			cur.count++;
			sums.set(r.date, cur);
		}
		const map: MoodByDate = new Map();
		for (const [date, { sum, count }] of sums) map.set(date, sum / count);
		return map;
	}, new Map() as MoodByDate);
}

/** Per-night sleep — one row per date by the sleep module's contract. */
export function useSleepByDate() {
	return useScopedLiveQuery(async () => {
		const rows = await scopedForModule<LocalSleepEntry, string>('sleep', 'sleepEntries').toArray();
		const visible = rows.filter((r) => !r.deletedAt && r.date);
		const map: SleepByDate = new Map();
		for (const r of visible) {
			const quality = Number(r.quality);
			const durationMin = Number(r.durationMin);
			if (!Number.isFinite(quality) || !Number.isFinite(durationMin)) continue;
			// If multiple rows exist for the same date (rare — usually one per
			// night), keep the last write — sleep entries are unique per date
			// in practice but the contract doesn't enforce it.
			map.set(r.date, { quality, durationMin } satisfies SleepDay);
		}
		return map;
	}, new Map() as SleepByDate);
}
