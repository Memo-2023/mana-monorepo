/**
 * Tests for health check and public routes.
 */

import { describe, it, expect } from 'vitest';
import { app } from '../index';

describe('GET /health', () => {
	it('returns 200 with service info', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.status).toBe('ok');
		expect(data.service).toBe('memoro-server');
		expect(data.runtime).toBe('bun');
		expect(data.timestamp).toBeDefined();
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
