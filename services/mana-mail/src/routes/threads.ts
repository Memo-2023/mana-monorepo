/**
 * Thread routes — inbox and thread detail (JWT auth).
 */

import { Hono } from 'hono';
import type { MailService } from '../services/mail-service';
import type { AuthUser } from '../middleware/jwt-auth';

export function createThreadRoutes(mailService: MailService) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/threads', async (c) => {
			const user = c.get('user');
			const mailboxId = c.req.query('mailboxId');
			const limit = parseInt(c.req.query('limit') || '50', 10);
			const offset = parseInt(c.req.query('offset') || '0', 10);
			const result = await mailService.getThreads(user.userId, { mailboxId, limit, offset });
			return c.json(result);
		})
		.get('/threads/:threadId', async (c) => {
			const user = c.get('user');
			const threadId = c.req.param('threadId');
			const thread = await mailService.getThread(user.userId, threadId);
			return c.json(thread);
		});
}
