import { describe, it, expect } from 'vitest';
import { estimateCost, formatCost, MODEL_PRICING } from './pricing';

describe('estimateCost', () => {
	it('computes cost for known model', () => {
		// gpt-4o-mini: input 0.3/M, output 1.2/M
		// 1M input + 0.5M output = 0.3 + 0.6 = 0.9
		const cost = estimateCost('gpt-4o-mini', 1_000_000, 500_000);
		expect(cost).toBeCloseTo(0.9, 4);
	});

	it('returns 0 for unknown model', () => {
		expect(estimateCost('unknown-model-xyz', 1000, 500)).toBe(0);
	});

	it('handles zero tokens', () => {
		expect(estimateCost('gpt-4o', 0, 0)).toBe(0);
	});

	it('handles only input tokens', () => {
		// claude-opus-4-6: input 15/M, output 75/M
		const cost = estimateCost('claude-opus-4-6', 1_000_000, 0);
		expect(cost).toBe(15);
	});

	it('handles only output tokens', () => {
		// gemini-2.5-flash: input 0.15/M, output 0.6/M
		const cost = estimateCost('gemini-2.5-flash', 0, 1_000_000);
		expect(cost).toBe(0.6);
	});

	it('scales linearly with token count', () => {
		const cost1k = estimateCost('gpt-4o', 1000, 1000);
		const cost10k = estimateCost('gpt-4o', 10_000, 10_000);
		expect(cost10k).toBeCloseTo(cost1k * 10, 6);
	});

	it('has pricing for all OpenAI models', () => {
		const openaiModels = [
			'gpt-5',
			'gpt-5-mini',
			'gpt-4o',
			'gpt-4o-mini',
			'gpt-4-turbo',
			'o1',
			'o1-mini',
		];
		for (const model of openaiModels) {
			expect(MODEL_PRICING[model]).toBeDefined();
		}
	});

	it('has pricing for all Anthropic models', () => {
		const anthropicModels = [
			'claude-opus-4-6',
			'claude-opus-4-5',
			'claude-sonnet-4-6',
			'claude-sonnet-4-5',
			'claude-haiku-4-5',
		];
		for (const model of anthropicModels) {
			expect(MODEL_PRICING[model]).toBeDefined();
		}
	});

	it('has pricing for all Gemini models', () => {
		const geminiModels = [
			'gemini-2.5-pro',
			'gemini-2.5-flash',
			'gemini-2.5-flash-lite',
			'gemini-2.0-flash',
		];
		for (const model of geminiModels) {
			expect(MODEL_PRICING[model]).toBeDefined();
		}
	});
});

describe('formatCost', () => {
	it('shows dash for zero', () => {
		expect(formatCost(0)).toBe('—');
	});

	it('shows "< $0.0001" for very small amounts', () => {
		expect(formatCost(0.00001)).toBe('< $0.0001');
	});

	it('shows 4 decimals for amounts < 0.01', () => {
		expect(formatCost(0.005)).toBe('$0.0050');
	});

	it('shows 3 decimals for amounts < 1', () => {
		expect(formatCost(0.123)).toBe('$0.123');
	});

	it('shows 2 decimals for amounts >= 1', () => {
		expect(formatCost(1.234)).toBe('$1.23');
		expect(formatCost(100.567)).toBe('$100.57');
	});
});
