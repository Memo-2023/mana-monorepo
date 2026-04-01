/**
 * Tests for settings routes.
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

// Supabase mock that rebuilds chains each call
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('../lib/supabase', () => ({
	createServiceClient: () => {
		const chain: any = {};
		chain.from = () => chain;
		chain.select = () => chain;
		chain.eq = () => chain;
		chain.maybeSingle = () => mockMaybeSingle();
		chain.upsert = (data: any, opts: any) => mockUpsert(data, opts);
		return chain;
	},
}));

function patch(path: string, body: unknown) {
	return app.request(path, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/settings', () => {
	it('returns user settings', async () => {
		mockMaybeSingle.mockResolvedValueOnce({
			data: { user_id: 'test-user-id', display_name: 'Test User' },
			error: null,
		});

		const res = await app.request('/api/v1/settings');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.settings).toBeDefined();
	});

	it('returns empty object if no profile exists', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

		const res = await app.request('/api/v1/settings');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.settings).toEqual({});
	});
});

describe('GET /api/v1/settings/memoro', () => {
	it('returns memoro-specific settings', async () => {
		mockMaybeSingle.mockResolvedValueOnce({
			data: {
				app_settings: { memoro: { autoDeleteAudiosAfter30Days: true } },
				display_name: 'Test',
				avatar_url: null,
			},
			error: null,
		});

		const res = await app.request('/api/v1/settings/memoro');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.settings.autoDeleteAudiosAfter30Days).toBe(true);
	});

	it('returns empty settings if no profile', async () => {
		mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

		const res = await app.request('/api/v1/settings/memoro');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.settings).toEqual({});
	});
});

describe('PATCH /api/v1/settings/memoro', () => {
	beforeEach(() => {
		mockMaybeSingle.mockResolvedValue({
			data: { app_settings: { memoro: { lang: 'de' } } },
			error: null,
		});
	});

	it('updates memoro settings', async () => {
		const res = await patch('/api/v1/settings/memoro', {
			autoDeleteAudiosAfter30Days: true,
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('rejects empty body', async () => {
		const res = await patch('/api/v1/settings/memoro', {});
		expect(res.status).toBe(400);
	});
});

describe('PATCH /api/v1/settings/memoro/data-usage', () => {
	beforeEach(() => {
		mockMaybeSingle.mockResolvedValue({
			data: { app_settings: {} },
			error: null,
		});
	});

	it('accepts data usage', async () => {
		const res = await patch('/api/v1/settings/memoro/data-usage', { accepted: true });
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.dataUsageAcceptance).toBe(true);
	});

	it('declines data usage', async () => {
		const res = await patch('/api/v1/settings/memoro/data-usage', { accepted: false });
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.dataUsageAcceptance).toBe(false);
	});

	it('rejects non-boolean', async () => {
		const res = await patch('/api/v1/settings/memoro/data-usage', { accepted: 'yes' });
		expect(res.status).toBe(400);
	});

	it('rejects missing accepted field', async () => {
		const res = await patch('/api/v1/settings/memoro/data-usage', {});
		expect(res.status).toBe(400);
	});
});

describe('PATCH /api/v1/settings/profile', () => {
	it('updates display name', async () => {
		const res = await patch('/api/v1/settings/profile', { display_name: 'New Name' });
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it('updates avatar URL', async () => {
		const res = await patch('/api/v1/settings/profile', {
			avatar_url: 'https://example.com/avatar.jpg',
		});
		expect(res.status).toBe(200);
	});

	it('updates bio', async () => {
		const res = await patch('/api/v1/settings/profile', { bio: 'Hello world' });
		expect(res.status).toBe(200);
	});

	it('rejects empty object', async () => {
		const res = await patch('/api/v1/settings/profile', {});
		expect(res.status).toBe(400);
	});

	it('rejects invalid avatar URL', async () => {
		const res = await patch('/api/v1/settings/profile', { avatar_url: 'not-a-url' });
		expect(res.status).toBe(400);
	});

	it('rejects bio over 500 chars', async () => {
		const res = await patch('/api/v1/settings/profile', { bio: 'x'.repeat(501) });
		expect(res.status).toBe(400);
	});
});
