import { Hono } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';

export function createEmailRoutes() {
	return new Hono<{ Variables: { user: AuthUser } }>().post('/send-invitation', async (c) => {
		// TODO: Implement with Resend
		return c.json({ error: 'Email not configured yet' }, 501);
	});
}
