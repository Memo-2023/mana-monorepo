/**
 * Tests for audio-server transcription routes and health check.
 */

import { describe, it, expect, vi } from 'vitest';
import { app } from '../index';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.ts', () => ({
	downloadAudioFromStorage: vi.fn().mockResolvedValue(Buffer.from('fake-audio')),
}));

vi.mock('../services/transcription.ts', () => {
	class MockTranscriptionService {
		transcribeWithFallback = vi.fn().mockResolvedValue({ transcript: 'Hello world' });
	}
	return { TranscriptionService: MockTranscriptionService };
});

const SERVICE_KEY = 'test-service-key';

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

// ── Health ───────────────────────────────────────────────────────────────────

describe('GET /health', () => {
	it('returns 200 with service info', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.status).toBe('ok');
		expect(data.service).toBe('memoro-audio-server');
		expect(data.version).toBe('1.0.0');
		expect(data.timestamp).toBeDefined();
	});
});

// ── Auth ─────────────────────────────────────────────────────────────────────

describe('Service key authentication', () => {
	it('rejects requests without X-Service-Key', async () => {
		const res = await post('/api/v1/transcribe', {
			audioPath: 'test.m4a',
			memoId: 'memo-1',
			userId: 'user-1',
		});
		expect(res.status).toBe(401);

		const data = await res.json();
		expect(data.error).toBe('Unauthorized');
	});

	it('rejects requests with wrong service key', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ audioPath: 'test.m4a', memoId: 'memo-1', userId: 'user-1' },
			{ 'X-Service-Key': 'wrong-key' }
		);
		expect(res.status).toBe(401);
	});

	it('accepts requests with valid service key', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ audioPath: 'test.m4a', memoId: 'memo-1', userId: 'user-1' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(200);
	});
});

// ── POST /api/v1/transcribe ──────────────────────────────────────────────────

describe('POST /api/v1/transcribe', () => {
	it('starts transcription with valid input', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ audioPath: 'user/recording.m4a', memoId: 'memo-1', userId: 'user-1' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memoId).toBe('memo-1');
		expect(data.message).toBe('Transcription started');
	});

	it('accepts optional fields', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{
				audioPath: 'user/recording.m4a',
				memoId: 'memo-1',
				userId: 'user-1',
				spaceId: 'space-1',
				recordingLanguages: ['de-DE', 'en-US'],
				enableDiarization: true,
				recordingIndex: 0,
			},
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(200);
	});

	it('rejects missing audioPath', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ memoId: 'memo-1', userId: 'user-1' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toContain('Missing required fields');
	});

	it('rejects missing memoId', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ audioPath: 'test.m4a', userId: 'user-1' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(400);
	});

	it('rejects missing userId', async () => {
		const res = await post(
			'/api/v1/transcribe',
			{ audioPath: 'test.m4a', memoId: 'memo-1' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(400);
	});

	it('rejects invalid JSON', async () => {
		const res = await app.request('/api/v1/transcribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Service-Key': SERVICE_KEY,
			},
			body: 'not json',
		});
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toBe('Invalid JSON body');
	});
});

// ── POST /api/v1/transcribe/append ───────────────────────────────────────────

describe('POST /api/v1/transcribe/append', () => {
	it('starts append transcription with valid input', async () => {
		const res = await post(
			'/api/v1/transcribe/append',
			{
				audioPath: 'user/append.m4a',
				memoId: 'memo-1',
				userId: 'user-1',
				recordingIndex: 1,
			},
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.memoId).toBe('memo-1');
		expect(data.message).toBe('Append transcription started');
	});

	it('rejects missing required fields', async () => {
		const res = await post(
			'/api/v1/transcribe/append',
			{ audioPath: 'test.m4a' },
			{ 'X-Service-Key': SERVICE_KEY }
		);
		expect(res.status).toBe(400);
	});

	it('rejects invalid JSON', async () => {
		const res = await app.request('/api/v1/transcribe/append', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Service-Key': SERVICE_KEY,
			},
			body: '{invalid',
		});
		expect(res.status).toBe(400);
	});
});

// ── 404 ──────────────────────────────────────────────────────────────────────

describe('404 handler', () => {
	it('returns 404 for unknown routes', async () => {
		const res = await app.request('/nonexistent');
		expect(res.status).toBe(404);

		const data = await res.json();
		expect(data.error).toContain('Not found');
	});

	it('returns 404 for unknown API routes', async () => {
		const res = await app.request('/api/v1/unknown', {
			headers: { 'X-Service-Key': SERVICE_KEY },
		});
		expect(res.status).toBe(404);
	});
});
