/**
 * Tests for health check and public routes.
 */

import { describe, it, expect, vi } from 'vitest';
import { app } from '../index';

vi.mock('@mana/shared-hono', () => ({
	authMiddleware: () => async (c: any, next: any) => {
		c.set('userId', 'test-user-id');
		await next();
	},
	errorHandler: (err: any, c: any) => c.json({ error: err.message }, err.status ?? 500),
	notFoundHandler: (c: any) => c.json({ error: 'Not found' }, 404),
	validateCredits: vi.fn(),
	consumeCredits: vi.fn(),
	getBalance: vi.fn(),
}));

vi.mock('../services/memo', () => ({
	createMemoFromUploadedFile: vi.fn(),
	callAudioServer: vi.fn(),
	handleTranscriptionCompleted: vi.fn(),
	updateMemoProcessingStatus: vi.fn(),
}));

vi.mock('../services/headline', () => ({
	processHeadlineForMemo: vi.fn(),
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.eq = () => chain;
		chain.limit = () => Promise.resolve({ error: null });
		chain.single = () => Promise.resolve({ data: null, error: null });
		return chain;
	},
}));

describe('GET /health', () => {
	it('returns 200 with service info and checks', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.status).toBe('ok');
		expect(data.service).toBe('memoro-server');
		expect(data.runtime).toBe('bun');
		expect(data.timestamp).toBeDefined();
		expect(data.checks).toBeDefined();
		expect(data.checks.supabase).toBe('ok');
	});
});

describe('GET /api/v1/credits/pricing', () => {
	it('returns pricing without auth', async () => {
		const res = await app.request('/api/v1/credits/pricing');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.costs).toBeDefined();
		expect(data.costs.TRANSCRIPTION_PER_MINUTE).toBe(2);
		expect(data.costs.HEADLINE_GENERATION).toBe(10);
		expect(data.costs.QUESTION_MEMO).toBe(5);
		expect(data.costs.MEMO_COMBINE).toBe(5);
		expect(data.costs.MEETING_RECORDING_PER_MINUTE).toBe(2);
	});
});

describe('404 handler', () => {
	it('returns 404 for unknown routes', async () => {
		const res = await app.request('/nonexistent');
		expect(res.status).toBe(404);
	});
});
