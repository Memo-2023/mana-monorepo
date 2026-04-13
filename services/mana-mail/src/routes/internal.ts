/**
 * Internal routes — service-to-service (X-Service-Key auth).
 */

import { Hono } from 'hono';
import type { AccountService } from '../services/account-service';
import { onUserCreatedSchema } from '../lib/validation';

export function createInternalRoutes(accountService: AccountService) {
	return new Hono()
		.post('/mail/on-user-created', async (c) => {
			const body = onUserCreatedSchema.parse(await c.req.json());
			try {
				const account = await accountService.provisionAccount(body.userId, body.email, body.name);
				console.log(`[mana-mail] Provisioned ${account.email} for user ${body.userId}`);
				return c.json({ success: true, email: account.email });
			} catch (err) {
				console.error(`[mana-mail] Failed to provision account for ${body.userId}:`, err);
				return c.json(
					{ success: false, error: err instanceof Error ? err.message : 'Unknown error' },
					500
				);
			}
		})
		.post('/mail/on-user-deleted', async (c) => {
			// Phase 2: Deactivate Stalwart account
			return c.json({ success: true, message: 'Not yet implemented' });
		});
}
