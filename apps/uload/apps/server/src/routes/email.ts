import { Hono } from 'hono';
import type { AuthVariables } from '@mana/shared-hono';

export function createEmailRoutes() {
	return new Hono<{ Variables: AuthVariables }>().post('/send-invitation', async (c) => {
		// TODO: Implement with Resend
		return c.json({ error: 'Email not configured yet' }, 501);
	});
}
