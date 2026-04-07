/**
 * Trivial sanity test — verifies the test app boots and the public
 * health route responds without auth or DB.
 */

import { describe, it, expect } from 'bun:test';
import { buildTestApp, publicRequest } from './helpers';

describe('health', () => {
	const app = buildTestApp();

	it('responds with ok', async () => {
		const res = await app.fetch(publicRequest('http://test/health'));
		expect(res.status).toBe(200);
		const body = (await res.json()) as { status: string; service: string };
		expect(body.status).toBe('ok');
		expect(body.service).toBe('mana-events');
	});
});
