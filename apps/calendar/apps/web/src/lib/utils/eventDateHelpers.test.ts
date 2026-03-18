import { describe, it, expect } from 'vitest';
import { toDate, getEventStart, getEventEnd, getEventTimes } from './eventDateHelpers';

describe('toDate', () => {
	it('should parse ISO string to Date', () => {
		const result = toDate('2026-03-18T10:30:00Z');
		expect(result).toBeInstanceOf(Date);
		expect(result.toISOString()).toBe('2026-03-18T10:30:00.000Z');
	});

	it('should return Date object as-is', () => {
		const date = new Date('2026-03-18T10:30:00Z');
		const result = toDate(date);
		expect(result).toBe(date);
	});
});

describe('getEventStart', () => {
	it('should extract start time from event with string', () => {
		const event = { startTime: '2026-03-18T09:00:00Z' };
		const result = getEventStart(event);
		expect(result).toBeInstanceOf(Date);
		expect(result.toISOString()).toBe('2026-03-18T09:00:00.000Z');
	});

	it('should handle Date object', () => {
		const date = new Date('2026-03-18T09:00:00Z');
		const event = { startTime: date };
		const result = getEventStart(event);
		expect(result).toBe(date);
	});
});

describe('getEventEnd', () => {
	it('should extract end time from event with string', () => {
		const event = { endTime: '2026-03-18T10:00:00Z' };
		const result = getEventEnd(event);
		expect(result).toBeInstanceOf(Date);
		expect(result.toISOString()).toBe('2026-03-18T10:00:00.000Z');
	});

	it('should handle Date object', () => {
		const date = new Date('2026-03-18T10:00:00Z');
		const event = { endTime: date };
		const result = getEventEnd(event);
		expect(result).toBe(date);
	});
});

describe('getEventTimes', () => {
	it('should return both start and end as Date objects', () => {
		const event = {
			startTime: '2026-03-18T09:00:00Z',
			endTime: '2026-03-18T10:00:00Z',
		};
		const result = getEventTimes(event);
		expect(result.start).toBeInstanceOf(Date);
		expect(result.end).toBeInstanceOf(Date);
		expect(result.start.toISOString()).toBe('2026-03-18T09:00:00.000Z');
		expect(result.end.toISOString()).toBe('2026-03-18T10:00:00.000Z');
	});
});
