import { describe, it, expect } from 'vitest';
import { roundDuration } from './rounding';

describe('roundDuration', () => {
	describe('no rounding', () => {
		it('returns original when increment is 0', () => {
			expect(roundDuration(3661, 0, 'up')).toBe(3661);
		});

		it('returns original when method is none', () => {
			expect(roundDuration(3661, 5, 'none')).toBe(3661);
		});
	});

	describe('round up', () => {
		it('rounds 7 min up to 15 min', () => {
			expect(roundDuration(7 * 60, 15, 'up')).toBe(15 * 60);
		});

		it('rounds 16 min up to 30 min', () => {
			expect(roundDuration(16 * 60, 15, 'up')).toBe(30 * 60);
		});

		it('does not round exact values', () => {
			expect(roundDuration(15 * 60, 15, 'up')).toBe(15 * 60);
		});

		it('rounds 1 min up to 5 min', () => {
			expect(roundDuration(60, 5, 'up')).toBe(5 * 60);
		});

		it('rounds 61 min up to 66 min (6 min increment)', () => {
			expect(roundDuration(61 * 60, 6, 'up')).toBe(66 * 60);
		});
	});

	describe('round down', () => {
		it('rounds 7 min down to 0 min', () => {
			expect(roundDuration(7 * 60, 15, 'down')).toBe(0);
		});

		it('rounds 22 min down to 15 min', () => {
			expect(roundDuration(22 * 60, 15, 'down')).toBe(15 * 60);
		});

		it('does not round exact values', () => {
			expect(roundDuration(30 * 60, 15, 'down')).toBe(30 * 60);
		});
	});

	describe('round nearest', () => {
		it('rounds 7 min nearest to 10 (with 10 min increment)', () => {
			expect(roundDuration(7 * 60, 10, 'nearest')).toBe(10 * 60);
		});

		it('rounds 3 min nearest to 0 (with 10 min increment)', () => {
			expect(roundDuration(3 * 60, 10, 'nearest')).toBe(0);
		});

		it('rounds 5 min nearest to 10 (midpoint rounds up)', () => {
			expect(roundDuration(5 * 60, 10, 'nearest')).toBe(10 * 60);
		});

		it('rounds 8 min nearest to 10 (with 5 min increment)', () => {
			expect(roundDuration(8 * 60, 5, 'nearest')).toBe(10 * 60);
		});

		it('rounds 2 min nearest to 0 (with 5 min increment)', () => {
			expect(roundDuration(2 * 60, 5, 'nearest')).toBe(0);
		});
	});

	describe('edge cases', () => {
		it('handles 0 seconds', () => {
			expect(roundDuration(0, 15, 'up')).toBe(0);
		});

		it('handles 1 minute increment', () => {
			expect(roundDuration(90, 1, 'up')).toBe(120); // 1.5 min -> 2 min
		});

		it('handles negative increment as no rounding', () => {
			expect(roundDuration(3661, -5, 'up')).toBe(3661);
		});
	});
});
