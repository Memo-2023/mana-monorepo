import { describe, it, expect } from 'bun:test';
import { Hono } from 'hono';
import type { AccessTier, AuthVariables } from './types';
import { getTierLevel, hasTier, requireTier } from './tier';

describe('tier helpers', () => {
	it('orders tiers guest < public < beta < alpha < founder', () => {
		expect(getTierLevel('guest')).toBeLessThan(getTierLevel('public'));
		expect(getTierLevel('public')).toBeLessThan(getTierLevel('beta'));
		expect(getTierLevel('beta')).toBeLessThan(getTierLevel('alpha'));
		expect(getTierLevel('alpha')).toBeLessThan(getTierLevel('founder'));
	});

	it('treats unknown and missing tiers as 0', () => {
		expect(getTierLevel(undefined)).toBe(0);
		expect(getTierLevel('nobody')).toBe(0);
	});

	it('hasTier returns true when user tier meets or exceeds min', () => {
		expect(hasTier('founder', 'alpha')).toBe(true);
		expect(hasTier('alpha', 'alpha')).toBe(true);
		expect(hasTier('beta', 'alpha')).toBe(false);
		expect(hasTier(undefined, 'public')).toBe(false);
	});
});

function buildApp(presetTier: AccessTier | undefined) {
	const app = new Hono<{ Variables: AuthVariables }>();
	app.use('*', async (c, next) => {
		if (presetTier !== undefined) c.set('userTier', presetTier);
		return next();
	});
	app.get('/protected', requireTier('beta'), (c) => c.text('ok'));
	return app;
}

describe('requireTier middleware', () => {
	it('passes when the user tier exceeds the minimum', async () => {
		const res = await buildApp('alpha').request('/protected');
		expect(res.status).toBe(200);
		expect(await res.text()).toBe('ok');
	});

	it('passes when the user tier matches the minimum exactly', async () => {
		const res = await buildApp('beta').request('/protected');
		expect(res.status).toBe(200);
	});

	it('rejects with 403 when the user tier is below the minimum', async () => {
		const res = await buildApp('public').request('/protected');
		expect(res.status).toBe(403);
	});

	it('rejects with 403 when no tier is set on the context (defensive default)', async () => {
		const res = await buildApp(undefined).request('/protected');
		expect(res.status).toBe(403);
	});

	it('rejects a guest caller', async () => {
		const res = await buildApp('guest').request('/protected');
		expect(res.status).toBe(403);
	});
});
