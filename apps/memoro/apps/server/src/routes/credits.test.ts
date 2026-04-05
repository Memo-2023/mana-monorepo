/**
 * Tests for credit routes.
 */

import { describe, it, expect, vi } from 'vitest';
import { app } from '../index';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@mana/shared-hono', () => ({
	authMiddleware: () => async (c: any, next: any) => {
		c.set('userId', 'test-user-id');
		await next();
	},
	errorHandler: (err: any, c: any) => c.json({ error: err.message }, err.status ?? 500),
	notFoundHandler: (c: any) => c.json({ error: 'Not found' }, 404),
	validateCredits: vi.fn().mockResolvedValue({ hasCredits: true, availableCredits: 100 }),
	consumeCredits: vi.fn().mockResolvedValue({ success: true, remaining: 95 }),
	getBalance: vi.fn().mockResolvedValue({ balance: 100, totalEarned: 200, totalSpent: 100 }),
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

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.eq = () => chain;
		chain.single = () => Promise.resolve({ data: null, error: null });
		chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
		return chain;
	},
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn(),
}));

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/credits/balance', () => {
	it('returns credit balance', async () => {
		const res = await app.request('/api/v1/credits/balance');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.credits).toBe(100);
		expect(data.totalEarned).toBe(200);
		expect(data.totalSpent).toBe(100);
	});
});

describe('POST /api/v1/credits/check', () => {
	it('validates credits', async () => {
		const res = await post('/api/v1/credits/check', {
			operation: 'transcription',
			amount: 5,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.hasCredits).toBe(true);
	});

	it('rejects missing operation', async () => {
		const res = await post('/api/v1/credits/check', { amount: 5 });
		expect(res.status).toBe(400);
	});

	it('rejects missing amount', async () => {
		const res = await post('/api/v1/credits/check', { operation: 'transcription' });
		expect(res.status).toBe(400);
	});

	it('rejects negative amount', async () => {
		const res = await post('/api/v1/credits/check', {
			operation: 'transcription',
			amount: -1,
		});
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/credits/consume', () => {
	it('consumes credits', async () => {
		const res = await post('/api/v1/credits/consume', {
			operation: 'transcription',
			amount: 5,
			description: 'Memo transcription',
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('rejects missing description', async () => {
		const res = await post('/api/v1/credits/consume', {
			operation: 'transcription',
			amount: 5,
		});
		expect(res.status).toBe(400);
	});

	it('rejects empty operation', async () => {
		const res = await post('/api/v1/credits/consume', {
			operation: '',
			amount: 5,
			description: 'Test',
		});
		expect(res.status).toBe(400);
	});

	it('accepts optional metadata', async () => {
		const res = await post('/api/v1/credits/consume', {
			operation: 'transcription',
			amount: 5,
			description: 'With metadata',
			metadata: { memoId: 'memo-1' },
		});
		expect(res.status).toBe(200);
	});
});
