/**
 * Tests for meeting routes.
 */

import { describe, it, expect, vi } from 'vitest';
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

vi.mock('../services/meetings', () => {
	const bot = { id: 'bot-1', user_id: 'test-user-id', platform: 'google_meet', status: 'ready' };
	const recording = {
		id: 'rec-1',
		user_id: 'test-user-id',
		audio_url: 'https://example.com/audio.mp4',
		duration_seconds: 120,
		space_id: null,
	};
	return {
		createBot: vi.fn().mockResolvedValue(bot),
		stopBot: vi.fn().mockResolvedValue(undefined),
		getBots: vi.fn().mockResolvedValue([bot]),
		getBotById: vi.fn().mockImplementation((id: string) => (id === 'bot-1' ? bot : null)),
		getRecordings: vi.fn().mockResolvedValue([recording]),
		getRecordingById: vi
			.fn()
			.mockImplementation((id: string) => (id === 'rec-1' ? recording : null)),
		updateBotCredits: vi.fn(),
	};
});

function post(path: string, body: unknown) {
	return app.request(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ── Bot routes ───────────────────────────────────────────────────────────────

describe('POST /api/v1/meetings/bots', () => {
	it('creates a bot with valid Google Meet URL', async () => {
		const res = await post('/api/v1/meetings/bots', {
			meeting_url: 'https://meet.google.com/abc-defg-hij',
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.bot).toBeDefined();
		expect(data.creditInfo).toBeDefined();
	});

	it('creates a bot with Zoom URL', async () => {
		const res = await post('/api/v1/meetings/bots', {
			meeting_url: 'https://us02web.zoom.us/j/123456789',
		});
		expect(res.status).toBe(200);
	});

	it('creates a bot with Teams URL', async () => {
		const res = await post('/api/v1/meetings/bots', {
			meeting_url: 'https://teams.microsoft.com/l/meetup-join/123',
		});
		expect(res.status).toBe(200);
	});

	it('rejects non-meeting URL', async () => {
		const res = await post('/api/v1/meetings/bots', {
			meeting_url: 'https://example.com/meeting',
		});
		expect(res.status).toBe(400);
	});

	it('rejects empty URL', async () => {
		const res = await post('/api/v1/meetings/bots', { meeting_url: '' });
		expect(res.status).toBe(400);
	});

	it('returns 402 on insufficient credits', async () => {
		const { validateCredits } = await import('@manacore/shared-hono');
		vi.mocked(validateCredits).mockResolvedValueOnce({
			hasCredits: false,
			availableCredits: 3,
		} as any);

		const res = await post('/api/v1/meetings/bots', {
			meeting_url: 'https://meet.google.com/abc-defg-hij',
		});
		expect(res.status).toBe(402);

		const data = await res.json();
		expect(data.error).toContain('Insufficient credits');
	});
});

describe('GET /api/v1/meetings/bots', () => {
	it('lists bots', async () => {
		const res = await app.request('/api/v1/meetings/bots');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.bots).toHaveLength(1);
	});

	it('supports pagination', async () => {
		const res = await app.request('/api/v1/meetings/bots?limit=10&offset=0');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.limit).toBe(10);
		expect(data.offset).toBe(0);
	});
});

describe('GET /api/v1/meetings/bots/:id', () => {
	it('returns a bot by ID', async () => {
		const res = await app.request('/api/v1/meetings/bots/bot-1');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.bot.id).toBe('bot-1');
	});

	it('returns 404 for unknown bot', async () => {
		const res = await app.request('/api/v1/meetings/bots/nonexistent');
		expect(res.status).toBe(404);
	});
});

describe('POST /api/v1/meetings/bots/:id/stop', () => {
	it('stops a bot', async () => {
		const res = await post('/api/v1/meetings/bots/bot-1/stop', {});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('returns 404 for unknown bot', async () => {
		const { stopBot } = await import('../services/meetings');
		vi.mocked(stopBot).mockRejectedValueOnce(new Error('Bot not found'));

		const res = await post('/api/v1/meetings/bots/nonexistent/stop', {});
		expect(res.status).toBe(404);
	});
});

// ── Recording routes ─────────────────────────────────────────────────────────

describe('GET /api/v1/meetings/recordings', () => {
	it('lists recordings', async () => {
		const res = await app.request('/api/v1/meetings/recordings');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.recordings).toHaveLength(1);
	});
});

describe('GET /api/v1/meetings/recordings/:id', () => {
	it('returns a recording by ID', async () => {
		const res = await app.request('/api/v1/meetings/recordings/rec-1');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.recording.id).toBe('rec-1');
	});

	it('returns 404 for unknown recording', async () => {
		const res = await app.request('/api/v1/meetings/recordings/nonexistent');
		expect(res.status).toBe(404);
	});
});
