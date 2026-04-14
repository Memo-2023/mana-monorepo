import { describe, it, expect } from 'vitest';
import { nextRunForCadence } from './cadence';

describe('nextRunForCadence', () => {
	const from = new Date('2026-04-14T10:00:00.000Z');

	it('returns undefined for manual', () => {
		expect(nextRunForCadence({ kind: 'manual' }, from)).toBeUndefined();
	});

	it('adds the interval for interval cadence', () => {
		const next = nextRunForCadence({ kind: 'interval', everyMinutes: 60 }, from);
		expect(next).toBe(new Date('2026-04-14T11:00:00.000Z').toISOString());
	});

	it('schedules daily cadence later today when the hour has not passed', () => {
		const next = nextRunForCadence({ kind: 'daily', atHour: 18, atMinute: 30 }, from);
		// local-time dependent — we only assert the delta is positive and under 24h
		const deltaMs = new Date(next!).getTime() - from.getTime();
		expect(deltaMs).toBeGreaterThan(0);
		expect(deltaMs).toBeLessThan(24 * 60 * 60_000);
	});

	it('schedules daily cadence tomorrow when the hour has already passed', () => {
		const next = nextRunForCadence({ kind: 'daily', atHour: 6, atMinute: 0 }, from);
		const deltaMs = new Date(next!).getTime() - from.getTime();
		expect(deltaMs).toBeGreaterThan(0);
	});

	it('schedules weekly cadence on the target day-of-week', () => {
		// 2026-04-14 is a Tuesday (day 2). Target: Friday (day 5).
		const next = nextRunForCadence({ kind: 'weekly', dayOfWeek: 5, atHour: 9 }, from);
		expect(new Date(next!).getDay()).toBe(5);
	});

	it('returns undefined for cron until implemented', () => {
		expect(nextRunForCadence({ kind: 'cron', expression: '0 9 * * *' }, from)).toBeUndefined();
	});
});
