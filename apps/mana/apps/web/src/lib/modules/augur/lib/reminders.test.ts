/**
 * Augur — Reminder helpers.
 *
 * Pure date-math; no Dexie or runes involved. The contract under test:
 *   - 30-day fallback when expectedBy is unset
 *   - resolved entries never surface
 *   - daysUntilDue is signed (negative = overdue)
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDER_DAYS, daysUntilDue, filterDue, isDue, reminderDate } from './reminders';
import type { AugurEntry } from '../types';

type Pickable = Pick<AugurEntry, 'expectedBy' | 'encounteredAt' | 'outcome'>;

function entry(overrides: Partial<Pickable> = {}): Pickable {
	return {
		encounteredAt: '2026-01-01',
		expectedBy: null,
		outcome: 'open',
		...overrides,
	};
}

describe('reminderDate', () => {
	it('uses expectedBy when set', () => {
		expect(reminderDate(entry({ expectedBy: '2026-02-15' }))).toBe('2026-02-15');
	});

	it('falls back to encounteredAt + 30 days when expectedBy is null', () => {
		expect(reminderDate(entry({ encounteredAt: '2026-01-01' }))).toBe('2026-01-31');
	});

	it('uses the documented default-day constant', () => {
		expect(DEFAULT_REMINDER_DAYS).toBe(30);
	});

	it('returns null for resolved entries — they never surface', () => {
		expect(reminderDate(entry({ outcome: 'fulfilled', expectedBy: '2026-02-15' }))).toBeNull();
		expect(reminderDate(entry({ outcome: 'partly' }))).toBeNull();
		expect(reminderDate(entry({ outcome: 'not-fulfilled' }))).toBeNull();
	});

	it('handles month / year rollover correctly via UTC date math', () => {
		expect(reminderDate(entry({ encounteredAt: '2025-12-15' }))).toBe('2026-01-14');
	});
});

describe('isDue', () => {
	it('true when reminder date is on or before today', () => {
		expect(isDue(entry({ expectedBy: '2026-01-15' }), '2026-01-15')).toBe(true);
		expect(isDue(entry({ expectedBy: '2026-01-15' }), '2026-01-20')).toBe(true);
	});

	it('false when reminder date is still in the future', () => {
		expect(isDue(entry({ expectedBy: '2026-02-15' }), '2026-01-20')).toBe(false);
	});

	it('false for resolved entries even if the deadline passed', () => {
		expect(isDue(entry({ outcome: 'fulfilled', expectedBy: '2025-12-01' }), '2026-01-15')).toBe(
			false
		);
	});
});

describe('daysUntilDue', () => {
	it('returns positive when due in the future', () => {
		expect(daysUntilDue(entry({ expectedBy: '2026-01-15' }), '2026-01-10')).toBe(5);
	});

	it('returns 0 when due today', () => {
		expect(daysUntilDue(entry({ expectedBy: '2026-01-15' }), '2026-01-15')).toBe(0);
	});

	it('returns negative when overdue', () => {
		expect(daysUntilDue(entry({ expectedBy: '2026-01-10' }), '2026-01-15')).toBe(-5);
	});

	it('returns null when no reminder date applies', () => {
		expect(daysUntilDue(entry({ outcome: 'fulfilled' }))).toBeNull();
	});
});

describe('filterDue', () => {
	it('keeps only entries that are open AND past their reminder date', () => {
		const today = '2026-02-01';
		const list = [
			entry({ expectedBy: '2026-01-15', outcome: 'open' }), // due
			entry({ expectedBy: '2026-03-15', outcome: 'open' }), // not yet
			entry({ expectedBy: '2026-01-15', outcome: 'fulfilled' }), // resolved
			entry({ expectedBy: null, encounteredAt: '2025-12-01' }), // 30-day fallback already past
			entry({ expectedBy: null, encounteredAt: '2026-01-25' }), // 30-day fallback in future
		];
		const due = filterDue(list, today);
		expect(due).toHaveLength(2);
		expect(due[0]!.expectedBy).toBe('2026-01-15');
		expect(due[1]!.encounteredAt).toBe('2025-12-01');
	});
});
