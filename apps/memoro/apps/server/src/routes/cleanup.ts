/**
 * Cleanup routes for Memoro server.
 *
 * Triggers audio cleanup. Requires X-Internal-API-Key header.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { runAudioCleanup } from '../services/cleanup';
import { validateBody } from '../lib/validate';
import { manualCleanupBody } from '../schemas';

export const cleanupRoutes = new Hono();

// Internal API key auth middleware
cleanupRoutes.use('*', async (c, next) => {
	const key = c.req.header('X-Internal-API-Key');
	const expected = process.env.INTERNAL_API_KEY;

	if (!key || !expected || key !== expected) {
		throw new HTTPException(401, { message: 'Invalid internal API key' });
	}

	return next();
});

// POST /run — trigger cleanup (from Cloud Scheduler or external cron)
cleanupRoutes.post('/run', async (c) => {
	console.log('[cleanup] Triggered via /run');

	// Run cleanup asynchronously and return immediately
	queueMicrotask(() => {
		runAudioCleanup().catch((err) => console.error('[cleanup] Background cleanup failed:', err));
	});

	return c.json({ success: true, message: 'Cleanup started' });
});

// POST /manual — manual trigger with optional user IDs
cleanupRoutes.post('/manual', async (c) => {
	const v = await validateBody(c, manualCleanupBody);
	if (!v.success) return v.response;
	const userIds = v.data.userIds ?? [];

	console.log(
		`[cleanup] Manual trigger${userIds.length > 0 ? ` for ${userIds.length} users` : ' for all opted-in users'}`
	);

	try {
		const result = await runAudioCleanup(userIds.length > 0 ? userIds : undefined);
		return c.json({ success: true, ...result });
	} catch (err) {
		console.error('[cleanup] Manual cleanup failed:', err);
		return c.json({ success: false, error: 'Cleanup failed' }, 500);
	}
});
