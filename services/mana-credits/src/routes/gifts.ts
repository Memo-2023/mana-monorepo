/**
 * Gift code routes — mixed auth (public GET /:code, JWT for rest)
 */

import { Hono } from 'hono';
import type { GiftCodeService } from '../services/gift-code';
import type { AuthUser } from '../middleware/jwt-auth';
import { jwtAuth } from '../middleware/jwt-auth';
import { createGiftSchema, redeemGiftSchema } from '../lib/validation';

export function createGiftRoutes(giftCodeService: GiftCodeService, authUrl: string) {
	const app = new Hono();

	// Public: Get gift info by code
	app.get('/:code', async (c) => {
		const info = await giftCodeService.getGiftInfo(c.req.param('code'));
		return c.json(info);
	});

	// Protected routes
	const authed = new Hono<{ Variables: { user: AuthUser } }>();
	authed.use('*', jwtAuth(authUrl));

	authed.post('/', async (c) => {
		const user = c.get('user');
		const body = createGiftSchema.parse(await c.req.json());
		const gift = await giftCodeService.createGift(user.userId, user.email, body);
		return c.json(gift, 201);
	});

	authed.get('/me/created', async (c) => {
		const user = c.get('user');
		const gifts = await giftCodeService.getCreatedGifts(user.userId);
		return c.json(gifts);
	});

	authed.get('/me/received', async (c) => {
		const user = c.get('user');
		const gifts = await giftCodeService.getReceivedGifts(user.userId);
		return c.json(gifts);
	});

	authed.post('/:code/redeem', async (c) => {
		const user = c.get('user');
		const body = redeemGiftSchema.parse(await c.req.json());
		const result = await giftCodeService.redeemGift(
			c.req.param('code'),
			user.userId,
			body.riddleAnswer,
			body.sourceAppId
		);
		return c.json(result);
	});

	authed.delete('/:id', async (c) => {
		const user = c.get('user');
		const result = await giftCodeService.cancelGift(c.req.param('id'), user.userId);
		return c.json(result);
	});

	app.route('/', authed);
	return app;
}
