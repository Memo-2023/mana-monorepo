/**
 * Cadence → next-run calculation.
 *
 * Used by the mission store to stamp `nextRunAt` on create / update /
 * finishIteration. Pure function — the Runner never calls this directly,
 * it just reads `nextRunAt`.
 *
 * Kept intentionally simple: no RRULE parser, no timezone gymnastics. If we
 * need cron, we'll plug in a lib later via the `cron` variant; for now the
 * common cases (manual / interval / daily / weekly) cover what real users
 * will configure in a settings UI.
 */

import type { MissionCadence } from './types';

export function nextRunForCadence(cadence: MissionCadence, from: Date): string | undefined {
	switch (cadence.kind) {
		case 'manual':
			return undefined;

		case 'interval': {
			const t = new Date(from.getTime() + cadence.everyMinutes * 60_000);
			return t.toISOString();
		}

		case 'daily': {
			const t = new Date(from);
			t.setHours(cadence.atHour, cadence.atMinute, 0, 0);
			if (t <= from) t.setDate(t.getDate() + 1);
			return t.toISOString();
		}

		case 'weekly': {
			const t = new Date(from);
			t.setHours(cadence.atHour, 0, 0, 0);
			const diff = (cadence.dayOfWeek - t.getDay() + 7) % 7;
			if (diff === 0 && t <= from) {
				t.setDate(t.getDate() + 7);
			} else {
				t.setDate(t.getDate() + diff);
			}
			return t.toISOString();
		}

		case 'cron':
			// Not implemented — caller must schedule nextRunAt explicitly until
			// a cron parser is wired in. Return undefined so the Runner ignores it.
			return undefined;
	}
}
