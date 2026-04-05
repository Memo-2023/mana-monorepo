/**
 * Tests for internal service-to-service routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
	handleTranscriptionCompleted: vi.fn().mockResolvedValue(undefined),
	updateMemoProcessingStatus: vi.fn(),
}));

vi.mock('../services/headline', () => ({
	processHeadlineForMemo: vi.fn(),
}));

vi.mock('../lib/ai', () => ({
	generateText: vi.fn(),
}));

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = vi.fn();

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.update = (data: any) => {
			mockUpdate(data);
			return chain;
		};
		chain.eq = () => chain;
		chain.single = () => mockSingle();
		return chain;
	},
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

describe('Internal routes auth', () => {
	it('rejects requests without service key', async () => {
		const res = await post('/api/v1/internal/transcription-completed', {
			memoId: 'memo-1',
			userId: 'user-1',
			success: true,
		});
		expect(res.status).toBe(401);
	});

	it('rejects invalid service key', async () => {
		const res = await post(
			'/api/v1/internal/transcription-completed',
			{ memoId: 'memo-1', userId: 'user-1', success: true },
			{ 'X-Service-Key': 'wrong-key' }
		);
		expect(res.status).toBe(401);
	});
});

describe('POST /api/v1/internal/transcription-completed', () => {
	it('processes successful transcription callback', async () => {
		const res = await post(
			'/api/v1/internal/transcription-completed',
			{
				memoId: 'memo-1',
				userId: 'user-1',
				success: true,
				transcriptionResult: {
					transcript: 'Hello world',
					utterances: [{ offset: 0, duration: 1000, text: 'Hello world' }],
					languages: ['en'],
					primary_language: 'en',
					duration: 2.0,
				},
				route: 'whisperx',
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memoId).toBe('memo-1');
	});

	it('processes error transcription callback', async () => {
		const res = await post(
			'/api/v1/internal/transcription-completed',
			{
				memoId: 'memo-1',
				userId: 'user-1',
				success: false,
				error: 'Transcription failed',
				fallbackStage: 'azure-batch',
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(200);
	});

	it('rejects missing memoId', async () => {
		const res = await post(
			'/api/v1/internal/transcription-completed',
			{ userId: 'user-1', success: true },
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(400);
	});

	it('rejects missing userId', async () => {
		const res = await post(
			'/api/v1/internal/transcription-completed',
			{ memoId: 'memo-1', success: true },
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/internal/append-transcription-completed', () => {
	beforeEach(() => {
		mockSingle.mockResolvedValue({
			data: { source: { additional_recordings: [{ path: 'test.m4a', status: 'processing' }] } },
			error: null,
		});
	});

	it('processes successful append callback', async () => {
		const res = await post(
			'/api/v1/internal/append-transcription-completed',
			{
				memoId: 'memo-1',
				userId: 'user-1',
				recordingIndex: 0,
				success: true,
				transcriptionResult: {
					transcript: 'Appended text',
					languages: ['de'],
					primary_language: 'de',
				},
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.recordingIndex).toBe(0);
	});

	it('processes error append callback', async () => {
		const res = await post(
			'/api/v1/internal/append-transcription-completed',
			{
				memoId: 'memo-1',
				userId: 'user-1',
				recordingIndex: 0,
				success: false,
				error: 'Failed',
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(200);
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post(
			'/api/v1/internal/append-transcription-completed',
			{
				memoId: 'nonexistent',
				userId: 'user-1',
				recordingIndex: 0,
				success: true,
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(404);
	});

	it('rejects missing recordingIndex', async () => {
		const res = await post(
			'/api/v1/internal/append-transcription-completed',
			{
				memoId: 'memo-1',
				userId: 'user-1',
				success: true,
			},
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(400);
	});
});

describe('POST /api/v1/internal/batch-metadata', () => {
	beforeEach(() => {
		mockSingle.mockResolvedValue({
			data: { metadata: {} },
			error: null,
		});
	});

	it('updates batch metadata', async () => {
		const res = await post(
			'/api/v1/internal/batch-metadata',
			{ memoId: 'memo-1', jobId: 'job-123' },
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.jobId).toBe('job-123');
	});

	it('returns 404 if memo not found', async () => {
		mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

		const res = await post(
			'/api/v1/internal/batch-metadata',
			{ memoId: 'nonexistent', jobId: 'job-123' },
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(404);
	});

	it('rejects missing jobId', async () => {
		const res = await post(
			'/api/v1/internal/batch-metadata',
			{ memoId: 'memo-1' },
			{ 'X-Service-Key': 'test-service-key' }
		);
		expect(res.status).toBe(400);
	});
});
