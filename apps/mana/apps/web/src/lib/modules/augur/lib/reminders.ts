/**
 * Augur — Resolve-Reminder Helpers
 *
 * Pure date math + due-detection logic. No I/O, no Dexie. Lives under
 * `lib/` so it can be reused by both the witness UI and (later) the
 * mana-notify pipeline without dragging Svelte runes along.
 *
 * Strategy (docs/plans/augur-module.md M3):
 *   - When the user set `expectedBy`, the entry is "due" the day after
 *     that deadline passed (and outcome === 'open').
 *   - When `expectedBy` is null, fall back to encounteredAt + 30 days.
 *
 * The 30-day fallback only applies *for surfacing*, never as data.
 * `expectedBy` itself stays null on the row — the user can still set
 * one explicitly later, and we don't want to retroactively claim a
 * date the user didn't choose.
 */

import type { AugurEntry } from '../types';

export const DEFAULT_REMINDER_DAYS = 30;

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
	const d = new Date(isoDate);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/** ISO date when the entry should first surface as "due", or null if it
 *  never should (already resolved, or invalid encounteredAt). */
export function reminderDate(
	entry: Pick<AugurEntry, 'expectedBy' | 'encounteredAt' | 'outcome'>
): string | null {
	if (entry.outcome !== 'open') return null;
	if (entry.expectedBy) return entry.expectedBy;
	if (!entry.encounteredAt) return null;
	return addDays(entry.encounteredAt, DEFAULT_REMINDER_DAYS);
}

/** True if the entry's reminder date is on or before `today`. */
export function isDue(
	entry: Pick<AugurEntry, 'expectedBy' | 'encounteredAt' | 'outcome'>,
	today: string = todayIso()
): boolean {
	const r = reminderDate(entry);
	return r != null && r <= today;
}

/** Days remaining until the reminder fires. Negative if overdue. */
export function daysUntilDue(
	entry: Pick<AugurEntry, 'expectedBy' | 'encounteredAt' | 'outcome'>,
	today: string = todayIso()
): number | null {
	const r = reminderDate(entry);
	if (!r) return null;
	const a = new Date(today).getTime();
	const b = new Date(r).getTime();
	return Math.round((b - a) / 86_400_000);
}

/** Filter helper: only entries that are open AND past their reminder date. */
export function filterDue<T extends Pick<AugurEntry, 'expectedBy' | 'encounteredAt' | 'outcome'>>(
	entries: T[],
	today: string = todayIso()
): T[] {
	return entries.filter((e) => isDue(e, today));
}
