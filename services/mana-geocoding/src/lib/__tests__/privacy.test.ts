/**
 * Tests for the coordinate-quantization helper used to round outbound
 * lat/lon before forwarding to public APIs. The privacy claim depends
 * on these rounding rules — lock them.
 */

import { describe, expect, it } from 'bun:test';
import { PUBLIC_FOCUS_DECIMALS, PUBLIC_REVERSE_DECIMALS, quantizeCoord } from '../privacy';

describe('quantizeCoord', () => {
	it('rounds a number string to N decimals', () => {
		expect(quantizeCoord('47.66341234', 2)).toBe('47.66');
		expect(quantizeCoord('47.66341234', 3)).toBe('47.663');
		expect(quantizeCoord('47.66351234', 3)).toBe('47.664'); // rounds, not truncates
	});

	it('handles a number input the same as a string', () => {
		expect(quantizeCoord(47.66341234, 2)).toBe('47.66');
	});

	it('returns undefined for undefined / null / empty / NaN', () => {
		expect(quantizeCoord(undefined, 2)).toBeUndefined();
		expect(quantizeCoord('', 2)).toBeUndefined();
		expect(quantizeCoord('not-a-number', 2)).toBeUndefined();
		// Number.NaN is the easy footgun — toFixed would return 'NaN' string
		expect(quantizeCoord(NaN, 2)).toBeUndefined();
	});

	it('preserves precision via string return (not lossy float)', () => {
		// 0.1 + 0.2 = 0.30000000000000004 — toFixed must guard against
		// representational drift sneaking back in. The string form is
		// what we drop into URLSearchParams, so the round happens here.
		expect(quantizeCoord(0.1 + 0.2, 2)).toBe('0.30');
	});

	it('handles negative coordinates (southern hemisphere, western longitudes)', () => {
		expect(quantizeCoord('-33.86412345', 2)).toBe('-33.86');
		expect(quantizeCoord('-118.40531234', 2)).toBe('-118.41');
	});

	it('PUBLIC_FOCUS_DECIMALS quantizes the privacy claim (~1.1 km)', () => {
		// 0.01° latitude ≈ 1.11 km. The constant must be 2 — if anyone
		// bumps it to 3, the privacy claim ("focus point hidden to ~1km")
		// silently changes.
		expect(PUBLIC_FOCUS_DECIMALS).toBe(2);
	});

	it('PUBLIC_REVERSE_DECIMALS quantizes the privacy claim (~110 m)', () => {
		// 0.001° latitude ≈ 111 m. Same reasoning — lock the value.
		expect(PUBLIC_REVERSE_DECIMALS).toBe(3);
	});
});
