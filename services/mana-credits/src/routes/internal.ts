/**
 * Internal routes — service-to-service endpoints (X-Service-Key auth)
 */

import { Hono } from 'hono';
import type { CreditsService } from '../services/credits';
import type { GiftCodeService } from '../services/gift-code';
import type { SyncBillingService } from '../services/sync-billing';
import {
	internalUseCreditsSchema,
	internalRefundSchema,
	internalInitSchema,
	internalRedeemPendingSchema,
	internalReserveSchema,
	internalCommitSchema,
	internalRefundReservationSchema,
} from '../lib/validation';

export function createInternalRoutes(
	creditsService: CreditsService,
	giftCodeService: GiftCodeService,
	syncBillingService: SyncBillingService
) {
	return new Hono()
		.get('/credits/balance/:userId', async (c) => {
			const balance = await creditsService.getBalance(c.req.param('userId'));
			return c.json(balance);
		})
		.post('/credits/use', async (c) => {
			const body = internalUseCreditsSchema.parse(await c.req.json());
			const { userId, ...params } = body;
			const result = await creditsService.useCredits(userId, params);
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
		.post('/credits/reserve', async (c) => {
			const body = internalReserveSchema.parse(await c.req.json());
			const result = await creditsService.reserve(body.userId, body.amount, body.reason);
			return c.json(result);
		})
		.post('/credits/commit', async (c) => {
			const body = internalCommitSchema.parse(await c.req.json());
			const result = await creditsService.commitReservation(body.reservationId, body.description);
			return c.json(result);
		})
		.post('/credits/refund-reservation', async (c) => {
			const body = internalRefundReservationSchema.parse(await c.req.json());
			const result = await creditsService.refundReservation(body.reservationId);
			return c.json(result);
		})
		.post('/gifts/redeem-pending', async (c) => {
			const body = internalRedeemPendingSchema.parse(await c.req.json());
			const result = await giftCodeService.redeemPendingForUser(body.userId, body.email);
			return c.json(result);
		})
		.get('/sync/status/:userId', async (c) => {
			const status = await syncBillingService.getSyncStatus(c.req.param('userId'));
			return c.json(status);
		})
		.post('/sync/charge-recurring', async (c) => {
			const result = await syncBillingService.chargeRecurring();
			return c.json(result);
		});
}
