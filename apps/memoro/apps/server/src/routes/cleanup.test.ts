/**
 * Tests for cleanup routes.
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

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => ({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: null, error: null }),
	}),
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn(),
}));

vi.mock('../services/cleanup', () => ({
	runAudioCleanup: vi.fn().mockReturnValue(Promise.resolve({ processed: 5, deleted: 3 })),
}));

function post(path: string, body: unknown, headers?: Record<string, string>) {
	return app.request(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: JSON.stringify(body),
	});
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Cleanup routes auth', () => {
	it('rejects requests without internal API key', async () => {
		const res = await post('/api/v1/cleanup/run', {});
		expect(res.status).toBe(401);
	});

	it('rejects invalid internal API key', async () => {
		const res = await post('/api/v1/cleanup/run', {}, { 'X-Internal-API-Key': 'wrong' });
		expect(res.status).toBe(401);
	});
});

describe('POST /api/v1/cleanup/run', () => {
	it('triggers async cleanup', async () => {
		const res = await post(
			'/api/v1/cleanup/run',
			{},
			{ 'X-Internal-API-Key': 'test-internal-key' }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.message).toBe('Cleanup started');
	});
});

describe('POST /api/v1/cleanup/manual', () => {
	it('runs manual cleanup for all users', async () => {
		const res = await post(
			'/api/v1/cleanup/manual',
			{},
			{ 'X-Internal-API-Key': 'test-internal-key' }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('runs manual cleanup for specific users', async () => {
		const res = await post(
			'/api/v1/cleanup/manual',
			{ userIds: ['11111111-2222-3333-4444-555555555555'] },
			{ 'X-Internal-API-Key': 'test-internal-key' }
		);
		expect(res.status).toBe(200);
	});

	it('rejects invalid UUIDs in userIds', async () => {
		const res = await post(
			'/api/v1/cleanup/manual',
			{ userIds: ['not-a-uuid'] },
			{ 'X-Internal-API-Key': 'test-internal-key' }
		);
		expect(res.status).toBe(400);
	});
});
