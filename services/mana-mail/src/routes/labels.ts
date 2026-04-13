/**
 * Label routes — mailbox/folder listing (JWT auth).
 */

import { Hono } from 'hono';
import type { MailService } from '../services/mail-service';
import type { AuthUser } from '../middleware/jwt-auth';

export function createLabelRoutes(mailService: MailService) {
	return new Hono<{ Variables: { user: AuthUser } }>().get('/labels', async (c) => {
		const user = c.get('user');
		const mailboxes = await mailService.getMailboxes(user.userId);
		return c.json(mailboxes);
	});
}
