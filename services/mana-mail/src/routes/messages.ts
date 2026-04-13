/**
 * Message routes — update email flags (JWT auth).
 */

import { Hono } from 'hono';
import type { MailService } from '../services/mail-service';
import type { AuthUser } from '../middleware/jwt-auth';
import { updateMessageSchema } from '../lib/validation';

export function createMessageRoutes(mailService: MailService) {
	return new Hono<{ Variables: { user: AuthUser } }>().put('/:emailId', async (c) => {
		const user = c.get('user');
		const emailId = c.req.param('emailId');
		const body = updateMessageSchema.parse(await c.req.json());
		await mailService.updateMessage(user.userId, emailId, body);
		return c.json({ success: true });
	});
}
