/**
 * Tests for credit utility functions.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@manacore/shared-hono', () => ({
	validateCredits: vi.fn(),
	consumeCredits: vi.fn(),
}));

import { calcTranscriptionCost, COSTS } from './credits';

describe('COSTS', () => {
	it('has expected cost constants', () => {
		expect(COSTS.TRANSCRIPTION_PER_MINUTE).toBe(2);
		expect(COSTS.HEADLINE_GENERATION).toBe(10);
		expect(COSTS.MEMORY_CREATION).toBe(10);
		expect(COSTS.BLUEPRINT_PROCESSING).toBe(5);
		expect(COSTS.QUESTION_MEMO).toBe(5);
		expect(COSTS.MEMO_COMBINE).toBe(5);
		expect(COSTS.MEETING_RECORDING_PER_MINUTE).toBe(2);
	});
});

describe('calcTranscriptionCost', () => {
	it('calculates cost for 60 seconds (1 min)', () => {
		expect(calcTranscriptionCost(60)).toBe(2);
	});

	it('calculates cost for 120 seconds (2 min)', () => {
		expect(calcTranscriptionCost(120)).toBe(4);
	});

	it('calculates cost for 90 seconds (1.5 min) — rounds up', () => {
		expect(calcTranscriptionCost(90)).toBe(3);
	});

	it('returns minimum 2 for very short recordings', () => {
		expect(calcTranscriptionCost(1)).toBe(2);
		expect(calcTranscriptionCost(10)).toBe(2);
		expect(calcTranscriptionCost(30)).toBe(2);
	});

	it('returns minimum 2 for zero duration', () => {
		expect(calcTranscriptionCost(0)).toBe(2);
	});

	it('calculates cost for long recordings', () => {
		// 10 minutes = 20 credits
		expect(calcTranscriptionCost(600)).toBe(20);
		// 60 minutes = 120 credits
		expect(calcTranscriptionCost(3600)).toBe(120);
	});
});
