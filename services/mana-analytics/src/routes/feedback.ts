import { Hono } from 'hono';
import type { FeedbackService } from '../services/feedback';
import type { AuthUser } from '../middleware/jwt-auth';

export function createFeedbackRoutes(feedbackService: FeedbackService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.post('/', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();
			return c.json(await feedbackService.createFeedback(user.userId, body), 201);
		})
		.get('/public', async (c) => {
			const appId = c.req.query('appId');
			const limit = parseInt(c.req.query('limit') || '50', 10);
			const offset = parseInt(c.req.query('offset') || '0', 10);
			return c.json(await feedbackService.getPublicFeedback(appId, limit, offset));
		})
		.get('/me', async (c) => {
			const user = c.get('user');
			return c.json(await feedbackService.getMyFeedback(user.userId));
		})
		.post('/:id/vote', async (c) => {
			const user = c.get('user');
			return c.json(await feedbackService.vote(c.req.param('id'), user.userId));
		})
		.delete('/:id/vote', async (c) => {
			const user = c.get('user');
			return c.json(await feedbackService.unvote(c.req.param('id'), user.userId));
		})
		.delete('/:id', async (c) => {
			const user = c.get('user');
			return c.json(await feedbackService.deleteFeedback(c.req.param('id'), user.userId));
		});
}
