/**
 * Guild routes — Organization management with shared Mana pools
 */

import { Hono } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Config } from '../config';
import type { BetterAuthInstance } from '../auth/better-auth.config';

export function createGuildRoutes(auth: BetterAuthInstance, config: Config) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.post('/', async (c) => {
			const user = c.get('user');
			const body = await c.req.json();

			// Check subscription limits
			const limitsRes = await fetch(
				`${config.manaSubscriptionsUrl}/api/v1/internal/plan-limits/${user.userId}`,
				{ headers: { 'X-Service-Key': config.serviceKey } }
			).catch(() => null);
			const limits = limitsRes?.ok ? await limitsRes.json() : { maxOrganizations: 1 };

			// Create org via Better Auth
			const result = await auth.api.createOrganization({
				body: { name: body.name, slug: body.slug, logo: body.logo },
				headers: c.req.raw.headers,
			});

			// Init guild pool via mana-credits
			if (result?.id) {
				fetch(`${config.manaCreditsUrl}/api/v1/internal/guild-pool/init`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
					body: JSON.stringify({ organizationId: result.id }),
				}).catch(() => {});
			}

			return c.json({ gilde: result, pool: { balance: 0 } }, 201);
		})
		.get('/', async (c) => {
			const result = await auth.api.listOrganizations({ headers: c.req.raw.headers });
			return c.json(result);
		})
		.get('/:id', async (c) => {
			const result = await auth.api.getFullOrganization({
				query: { organizationId: c.req.param('id') },
				headers: c.req.raw.headers,
			});
			return c.json(result);
		})
		.put('/:id', async (c) => {
			const body = await c.req.json();
			const result = await auth.api.updateOrganization({
				body: { organizationId: c.req.param('id'), data: body },
				headers: c.req.raw.headers,
			});
			return c.json(result);
		})
		.delete('/:id', async (c) => {
			await auth.api.deleteOrganization({
				body: { organizationId: c.req.param('id') },
				headers: c.req.raw.headers,
			});
			return c.json({ success: true });
		})
		.post('/:id/invite', async (c) => {
			const body = await c.req.json();
			const result = await auth.api.createInvitation({
				body: {
					organizationId: c.req.param('id'),
					email: body.email,
					role: body.role || 'member',
				},
				headers: c.req.raw.headers,
			});
			return c.json(result);
		})
		.post('/accept-invitation', async (c) => {
			const { invitationId } = await c.req.json();
			const result = await auth.api.acceptInvitation({
				body: { invitationId },
				headers: c.req.raw.headers,
			});
			return c.json(result);
		})
		.delete('/:id/members/:memberId', async (c) => {
			await auth.api.removeMember({
				body: {
					organizationId: c.req.param('id'),
					memberIdOrEmail: c.req.param('memberId'),
				},
				headers: c.req.raw.headers,
			});
			return c.json({ success: true });
		})
		.put('/:id/members/:memberId/role', async (c) => {
			const { role } = await c.req.json();
			const result = await auth.api.updateMemberRole({
				body: {
					organizationId: c.req.param('id'),
					memberId: c.req.param('memberId'),
					role,
				},
				headers: c.req.raw.headers,
			});
			return c.json(result);
		});
}
