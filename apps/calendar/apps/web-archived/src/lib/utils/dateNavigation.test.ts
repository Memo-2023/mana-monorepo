import { describe, it, expect } from 'vitest';
import { getOffsetDate } from './dateNavigation';

describe('getOffsetDate', () => {
	// Use local time to avoid timezone offset issues with date-fns
	const baseDate = new Date(2026, 2, 18, 12, 0, 0); // March 18, 2026 12:00

	describe('week view', () => {
		it('should add 1 week for offset +1', () => {
			const result = getOffsetDate(baseDate, 'week', 1);
			expect(result).toEqual(new Date(2026, 2, 25, 12, 0, 0));
		});

		it('should subtract 1 week for offset -1', () => {
			const result = getOffsetDate(baseDate, 'week', -1);
			expect(result).toEqual(new Date(2026, 2, 11, 12, 0, 0));
		});
	});

	describe('month view', () => {
		it('should add 1 month for offset +1', () => {
			const result = getOffsetDate(baseDate, 'month', 1);
			expect(result).toEqual(new Date(2026, 3, 18, 12, 0, 0));
		});

		it('should subtract 1 month for offset -1', () => {
			const result = getOffsetDate(baseDate, 'month', -1);
			expect(result).toEqual(new Date(2026, 1, 18, 12, 0, 0));
		});
	});

	describe('agenda view', () => {
		it('should add 7 days for offset +1', () => {
			const result = getOffsetDate(baseDate, 'agenda', 1);
			expect(result).toEqual(new Date(2026, 2, 25, 12, 0, 0));
		});

		it('should subtract 7 days for offset -1', () => {
			const result = getOffsetDate(baseDate, 'agenda', -1);
			expect(result).toEqual(new Date(2026, 2, 11, 12, 0, 0));
		});

		it('should add 14 days for offset +2', () => {
			const result = getOffsetDate(baseDate, 'agenda', 2);
			expect(result).toEqual(new Date(2026, 3, 1, 12, 0, 0));
		});
	});

	describe('default (unknown view type)', () => {
		it('should fall through to week behavior', () => {
			const result = getOffsetDate(baseDate, 'unknown' as any, 1);
			expect(result).toEqual(new Date(2026, 2, 25, 12, 0, 0));
		});
	});
});
