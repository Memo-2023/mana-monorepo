/**
 * Internal routes — service-to-service endpoints (X-Service-Key auth)
 */

import { Hono } from 'hono';
import type { CreditsService } from '../services/credits';
import type { GiftCodeService } from '../services/gift-code';
import type { GuildPoolService } from '../services/guild-pool';
import {
	internalUseCreditsSchema,
	internalRefundSchema,
	internalInitSchema,
	internalRedeemPendingSchema,
} from '../lib/validation';

export function createInternalRoutes(
	creditsService: CreditsService,
	giftCodeService: GiftCodeService,
	guildPoolService: GuildPoolService
) {
	return new Hono()
		.get('/credits/balance/:userId', async (c) => {
			const balance = await creditsService.getBalance(c.req.param('userId'));
			return c.json(balance);
		})
		.post('/credits/use', async (c) => {
			const body = internalUseCreditsSchema.parse(await c.req.json());
			const { userId, ...params } = body;
			const result = await creditsService.useCreditsWithSource(userId, params);
			return c.json(result);
		})
		.post('/credits/refund', async (c) => {
			const body = internalRefundSchema.parse(await c.req.json());
			const result = await creditsService.refundCredits(
				body.userId,
				body.amount,
				body.description,
				body.appId,
				body.metadata
			);
			return c.json(result);
		})
		.post('/credits/init', async (c) => {
			const body = internalInitSchema.parse(await c.req.json());
			const balance = await creditsService.initializeBalance(body.userId);
			return c.json(balance);
		})
		.post('/gifts/redeem-pending', async (c) => {
			const body = internalRedeemPendingSchema.parse(await c.req.json());
			const result = await giftCodeService.redeemPendingForUser(body.userId, body.email);
			return c.json(result);
		})
		.post('/guild-pool/init', async (c) => {
			const body = await c.req.json();
			const pool = await guildPoolService.initializePool(body.organizationId);
			return c.json(pool);
		});
}
