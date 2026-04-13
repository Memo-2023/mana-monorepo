/**
 * Send routes — compose and send emails (JWT auth).
 */

import { Hono } from 'hono';
import type { MailService } from '../services/mail-service';
import type { AuthUser } from '../middleware/jwt-auth';
import { sendEmailSchema } from '../lib/validation';

export function createSendRoutes(mailService: MailService) {
	return new Hono<{ Variables: { user: AuthUser } }>().post('/send', async (c) => {
		const user = c.get('user');
		const body = sendEmailSchema.parse(await c.req.json());
		const result = await mailService.sendEmail(user.userId, body);
		return c.json(result);
	});
}
