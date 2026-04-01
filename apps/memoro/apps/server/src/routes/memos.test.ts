/**
 * Tests for memo routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../index';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@manacore/shared-hono', () => ({
	authMiddleware: () => async (c: any, next: any) => {
		c.set('userId', 'test-user-id');
		await next();
	},
	errorHandler: (err: any, c: any) => c.json({ error: err.message }, err.status ?? 500),
	notFoundHandler: (c: any) => c.json({ error: 'Not found' }, 404),
	validateCredits: vi.fn().mockResolvedValue({ hasCredits: true, availableCredits: 100 }),
	consumeCredits: vi.fn().mockResolvedValue(true),
	getBalance: vi.fn().mockResolvedValue({ balance: 100, totalEarned: 200, totalSpent: 100 }),
}));

vi.mock('../services/memo', () => ({
	createMemoFromUploadedFile: vi
		.fn()
		.mockResolvedValue({ memoId: 'memo-123', status: 'processing' }),
	callAudioServer: vi.fn().mockResolvedValue(undefined),
	handleTranscriptionCompleted: vi.fn().mockResolvedValue(undefined),
	updateMemoProcessingStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/headline', () => ({
	processHeadlineForMemo: vi.fn().mockResolvedValue({ headline: 'Test', intro: 'Test intro' }),
}));

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.insert = () => chain;
		chain.update = () => chain;
		chain.eq = () => chain;
		chain.in = () => chain;
		chain.single = () => mockSingle();
		return chain;
	},
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn().mockResolvedValue('HEADLINE: Combined\nINTRO: Summary\nCONTENT: Full text'),
}));

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/memos', () => {
	it('creates a memo with valid input', async () => {
		const res = await post('/api/v1/memos', {
			filePath: 'user/recording.m4a',
			duration: 120,
		});
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memoId).toBe('memo-123');
	});

	it('accepts optional spaceId and blueprintId', async () => {
		const res = await post('/api/v1/memos', {
			filePath: 'user/recording.m4a',
			duration: 60,
			spaceId: '11111111-2222-3333-4444-555555555555',
			blueprintId: '11111111-2222-3333-4444-555555555555',
		});
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('rejects missing filePath', async () => {
		const res = await post('/api/v1/memos', { duration: 120 });
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it('rejects missing duration', async () => {
		const res = await post('/api/v1/memos', { filePath: 'test.m4a' });
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it('returns 402 on insufficient credits', async () => {
		const { createMemoFromUploadedFile } = await import('../services/memo');
		vi.mocked(createMemoFromUploadedFile).mockRejectedValueOnce(new Error('Insufficient credits'));

		const res = await post('/api/v1/memos', {
			filePath: 'test.m4a',
			duration: 60,
		});
		expect(res.status).toBe(402);

		const data = await res.json();
		expect(data.success).toBe(false);
		expect(data.error).toContain('Insufficient credits');
	});
});

describe('POST /api/v1/memos/:id/append', () => {
	beforeEach(() => {
		mockSingle.mockResolvedValue({
			data: { id: 'memo-1', user_id: 'test-user-id', source: {} },
			error: null,
		});
	});

	it('appends to a memo with valid input', async () => {
		const res = await post('/api/v1/memos/memo-1/append', {
			filePath: 'user/append.m4a',
			duration: 30,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memoId).toBe('memo-1');
		expect(data.recordingIndex).toBeDefined();
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post('/api/v1/memos/nonexistent/append', {
			filePath: 'test.m4a',
			duration: 30,
		});
		expect(res.status).toBe(404);
	});

	it('rejects invalid body', async () => {
		const res = await post('/api/v1/memos/memo-1/append', { duration: 30 });
		expect(res.status).toBe(400);
	});

	it('returns 402 if insufficient credits', async () => {
		const { validateCredits } = await import('@manacore/shared-hono');
		vi.mocked(validateCredits).mockResolvedValueOnce({
			hasCredits: false,
			availableCredits: 0,
		} as any);

		const res = await post('/api/v1/memos/memo-1/append', {
			filePath: 'test.m4a',
			duration: 30,
		});
		expect(res.status).toBe(402);
	});
});

describe('POST /api/v1/memos/:id/retry-transcription', () => {
	it('retries transcription for owned memo', async () => {
		mockSingle.mockResolvedValueOnce({
			data: {
				id: 'memo-1',
				user_id: 'test-user-id',
				source: { audio_path: 'test.m4a', duration: 60 },
				metadata: {},
			},
			error: null,
		});

		const res = await post('/api/v1/memos/memo-1/retry-transcription', {});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post('/api/v1/memos/nonexistent/retry-transcription', {});
		expect(res.status).toBe(404);
	});

	it('returns 400 if no audio file', async () => {
		mockSingle.mockResolvedValueOnce({
			data: { id: 'memo-1', user_id: 'test-user-id', source: {}, metadata: {} },
			error: null,
		});

		const res = await post('/api/v1/memos/memo-1/retry-transcription', {});
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toContain('No audio file');
	});
});

describe('POST /api/v1/memos/:id/retry-headline', () => {
	it('retries headline generation', async () => {
		mockSingle.mockResolvedValueOnce({
			data: { id: 'memo-1' },
			error: null,
		});

		const res = await post('/api/v1/memos/memo-1/retry-headline', {});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.headline).toBe('Test');
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post('/api/v1/memos/nonexistent/retry-headline', {});
		expect(res.status).toBe(404);
	});

	it('returns 500 if headline generation fails', async () => {
		mockSingle.mockResolvedValueOnce({
			data: { id: 'memo-1' },
			error: null,
		});

		const { processHeadlineForMemo } = await import('../services/headline');
		vi.mocked(processHeadlineForMemo).mockRejectedValueOnce(new Error('AI error'));

		const res = await post('/api/v1/memos/memo-1/retry-headline', {});
		expect(res.status).toBe(500);
	});
});

describe('POST /api/v1/memos/combine', () => {
	it('rejects fewer than 2 memo IDs', async () => {
		const res = await post('/api/v1/memos/combine', {
			memoIds: ['11111111-1111-1111-1111-111111111111'],
		});
		expect(res.status).toBe(400);
	});

	it('rejects invalid UUIDs', async () => {
		const res = await post('/api/v1/memos/combine', {
			memoIds: ['not-uuid', 'also-not-uuid'],
		});
		expect(res.status).toBe(400);
	});

	it('returns 402 on insufficient credits', async () => {
		const { validateCredits } = await import('@manacore/shared-hono');
		vi.mocked(validateCredits).mockResolvedValueOnce({
			hasCredits: false,
			availableCredits: 0,
		} as any);

		const res = await post('/api/v1/memos/combine', {
			memoIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
		});
		expect(res.status).toBe(402);
	});
});

describe('POST /api/v1/memos/:id/question', () => {
	it('answers a question on a memo', async () => {
		mockSingle.mockResolvedValueOnce({
			data: {
				id: 'memo-1',
				title: 'Test Memo',
				source: { transcript: 'This is a test transcript about AI.' },
			},
			error: null,
		});

		const { generateText } = await import('../lib/ai');
		vi.mocked(generateText).mockResolvedValueOnce('The transcript discusses AI.');

		const res = await post('/api/v1/memos/memo-1/question', {
			question: 'What is this about?',
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.answer).toBeDefined();
		expect(data.question).toBe('What is this about?');
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post('/api/v1/memos/nonexistent/question', {
			question: 'What is this?',
		});
		expect(res.status).toBe(404);
	});

	it('rejects empty question', async () => {
		const res = await post('/api/v1/memos/memo-1/question', { question: '' });
		expect(res.status).toBe(400);
	});

	it('returns 402 on insufficient credits', async () => {
		const { validateCredits } = await import('@manacore/shared-hono');
		vi.mocked(validateCredits).mockResolvedValueOnce({
			hasCredits: false,
			availableCredits: 0,
		} as any);

		const res = await post('/api/v1/memos/memo-1/question', {
			question: 'What is this?',
		});
		expect(res.status).toBe(402);
	});
});
