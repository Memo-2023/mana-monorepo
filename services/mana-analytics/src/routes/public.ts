/**
 * Public, anonymous feedback routes — mounted under /api/v1/public/feedback.
 *
 * Distinct from /api/v1/feedback/* because the jwtAuth middleware is
 * scoped to that prefix only — anything under /api/v1/public/* skips
 * auth entirely. Output is fully redacted (display_name only, no
 * userId / displayHash / deviceInfo); reaction state is not enriched
 * because there is no caller identity.
 */

import { Hono } from 'hono';
import type { FeedbackService } from '../services/feedback';

export function createPublicFeedbackRoutes(feedbackService: FeedbackService) {
	const r = new Hono();

	r.get('/feed', async (c) => {
		const appId = c.req.query('appId') || undefined;
		const moduleContext = c.req.query('moduleContext') || undefined;
		const category = c.req.query('category') || undefined;
		const status = c.req.query('status') || undefined;
		const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
		const offset = parseInt(c.req.query('offset') || '0', 10);

		const items = await feedbackService.getPublicFeed({
			appId,
			moduleContext,
			category,
			status,
			limit,
			offset,
		});
		return c.json({ items });
	});

	r.get('/eule/:hash', async (c) => {
		const hash = c.req.param('hash');
		// Display-hashes are 64-char hex (SHA256) — bail early on garbage.
		if (!/^[0-9a-f]{32,64}$/i.test(hash)) {
			return c.json({ error: 'invalid display_hash' }, 400);
		}
		return c.json(await feedbackService.getEulenProfile(hash));
	});

	r.get('/:id', async (c) => {
		const item = await feedbackService.getPublicItem(c.req.param('id'));
		if (!item) return c.json({ error: 'Not found' }, 404);
		const replies = await feedbackService.getReplies(item.id);
		return c.json({ item, replies });
	});

	return r;
}
