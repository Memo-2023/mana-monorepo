/**
 * Authenticated feedback routes — mounted under /api/v1/feedback.
 *
 * All routes here require a valid Bearer token (jwtAuth middleware
 * applied at the app level in index.ts). Public-read endpoints live
 * separately under /api/v1/public/feedback (see ./public.ts).
 */

import { Hono } from 'hono';
import type { FeedbackService } from '../services/feedback';
import { ALLOWED_EMOJIS } from '../services/feedback';
import type { AuthUser } from '../middleware/jwt-auth';
import { BadRequestError, ForbiddenError } from '../lib/errors';

const FOUNDER_ROLES = new Set(['founder', 'admin']);

export function createFeedbackRoutes(feedbackService: FeedbackService) {
	const r = new Hono<{ Variables: { user: AuthUser } }>();

	// ── User-facing ───────────────────────────────────────────────────

	r.post('/', async (c) => {
		const user = c.get('user');
		const body = await c.req.json();
		const item = await feedbackService.createFeedback(user.userId, body);
		return c.json(item, 201);
	});

	/** Auth-required public feed — same as /public/feed but additionally
	 *  enriches each item with the requesting user's reaction state. */
	r.get('/public', async (c) => {
		const user = c.get('user');
		const appId = c.req.query('appId') || undefined;
		const moduleContext = c.req.query('moduleContext') || undefined;
		const category = c.req.query('category') || undefined;
		const status = c.req.query('status') || undefined;
		const limit = parseInt(c.req.query('limit') || '50', 10);
		const offset = parseInt(c.req.query('offset') || '0', 10);

		const items = await feedbackService.getPublicFeed({
			appId,
			moduleContext,
			category,
			status,
			limit,
			offset,
			includeRealName: true,
		});

		const enriched = await Promise.all(
			items.map(async (item) => ({
				...item,
				myReactions: await feedbackService.getMyReactionsFor(item.id, user.userId),
			}))
		);

		return c.json({ items: enriched });
	});

	r.get('/me', async (c) => {
		const user = c.get('user');
		return c.json(await feedbackService.getMyFeedback(user.userId));
	});

	r.get('/me/reacted', async (c) => {
		const user = c.get('user');
		const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 200);
		return c.json({ items: await feedbackService.getMyReactedItems(user.userId, limit) });
	});

	r.get('/me/notifications', async (c) => {
		const user = c.get('user');
		const unreadOnly = c.req.query('unread_only') === 'true';
		const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
		return c.json({
			items: await feedbackService.getNotifications(user.userId, { unreadOnly, limit }),
		});
	});

	r.post('/me/notifications/:id/read', async (c) => {
		const user = c.get('user');
		return c.json(await feedbackService.markNotificationRead(c.req.param('id'), user.userId));
	});

	r.post('/me/notifications/read-all', async (c) => {
		const user = c.get('user');
		return c.json(await feedbackService.markAllNotificationsRead(user.userId));
	});

	r.get('/:id/replies', async (c) => {
		return c.json(await feedbackService.getReplies(c.req.param('id'), { includeRealName: true }));
	});

	// ── Reactions ─────────────────────────────────────────────────────

	r.post('/:id/react', async (c) => {
		const user = c.get('user');
		const { emoji } = await c.req.json<{ emoji: string }>();
		if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
			throw new BadRequestError(`emoji must be one of: ${ALLOWED_EMOJIS.join(' ')}`);
		}
		const result = await feedbackService.toggleReaction(c.req.param('id'), user.userId, emoji);
		return c.json(result);
	});

	r.delete('/:id', async (c) => {
		const user = c.get('user');
		return c.json(await feedbackService.deleteFeedback(c.req.param('id'), user.userId));
	});

	// ── Admin (founder/admin role) ────────────────────────────────────

	r.get('/admin', async (c) => {
		const user = c.get('user');
		if (!FOUNDER_ROLES.has(user.role)) throw new ForbiddenError('Founder/admin role required');

		const appId = c.req.query('appId') || undefined;
		const category = c.req.query('category') || undefined;
		const status = c.req.query('status') || undefined;
		const moduleContext = c.req.query('moduleContext') || undefined;
		const limit = parseInt(c.req.query('limit') || '100', 10);
		const offset = parseInt(c.req.query('offset') || '0', 10);

		const items = await feedbackService.adminListAll({
			appId,
			category,
			status,
			moduleContext,
			limit,
			offset,
		});
		return c.json({ items });
	});

	r.patch('/admin/:id', async (c) => {
		const user = c.get('user');
		if (!FOUNDER_ROLES.has(user.role)) throw new ForbiddenError('Founder/admin role required');

		const patch = await c.req.json<{
			status?: string;
			adminResponse?: string;
			isPublic?: boolean;
		}>();
		const updated = await feedbackService.adminUpdate(c.req.param('id'), patch);
		return c.json(updated);
	});

	return r;
}
