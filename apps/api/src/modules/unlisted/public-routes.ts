/**
 * Unlisted Snapshots — public read endpoint.
 *
 * GET /:token  — resolve a share-token to its snapshot blob. Returns
 *                { collection, blob, createdAt, expiresAt? }. Revoked
 *                or expired tokens → 410 Gone. Unknown tokens → 404.
 *
 * Rate-limited aggressively since this is the untrusted entry point:
 *   - 20 requests per minute per token (normal reload behaviour)
 *   - 60 requests per minute per client IP (enumeration-safety)
 *
 * Mounted pre-auth in index.ts so anonymous visitors can resolve
 * their share links without a Mana account.
 *
 * See docs/plans/unlisted-sharing.md §2.
 */

import { Hono } from 'hono';
import { rateLimitMiddleware } from '@mana/shared-hono';
import { eq } from 'drizzle-orm';
import { errorResponse } from '../../lib/responses';
import { db, snapshots } from './schema';

const routes = new Hono();

// Token-scoped rate limit. 20 requests/min per token covers a reasonable
// browser reload pattern; more than that on a single link is enumeration
// or a hammering client.
routes.use(
	'/:token',
	rateLimitMiddleware({
		max: 20,
		windowMs: 60_000,
		keyFn: (c) => `unlisted:token:${c.req.param('token')}`,
	})
);

// IP-scoped rate limit. Stacks on the token limit — 60 req/min/IP caps
// how fast a scanner can enumerate the token space from one host.
routes.use(
	'/:token',
	rateLimitMiddleware({
		max: 60,
		windowMs: 60_000,
		keyFn: (c) => {
			const ip =
				c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
				c.req.header('x-real-ip') ||
				'unknown';
			return `unlisted:ip:${ip}`;
		},
	})
);

const TOKEN_REGEX = /^[A-Za-z0-9_-]{32}$/;

routes.get('/:token', async (c) => {
	const token = c.req.param('token');
	if (!TOKEN_REGEX.test(token)) {
		return errorResponse(c, 'Invalid token format', 400, { code: 'INVALID_TOKEN' });
	}

	const rows = await db
		.select({
			token: snapshots.token,
			collection: snapshots.collection,
			blob: snapshots.blob,
			createdAt: snapshots.createdAt,
			updatedAt: snapshots.updatedAt,
			expiresAt: snapshots.expiresAt,
			revokedAt: snapshots.revokedAt,
		})
		.from(snapshots)
		.where(eq(snapshots.token, token))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return errorResponse(c, 'Link nicht gefunden', 404, { code: 'NOT_FOUND' });
	}
	if (row.revokedAt) {
		return errorResponse(c, 'Link wurde widerrufen', 410, { code: 'REVOKED' });
	}
	if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
		return errorResponse(c, 'Link ist abgelaufen', 410, { code: 'EXPIRED' });
	}

	// Short private cache — revocation is still near-immediate (60s
	// max) but repeated hits from the same client don't hammer the db.
	c.header('Cache-Control', 'private, max-age=60');
	// Belt-and-suspenders for search bots that don't read the HTML
	// meta tag.
	c.header('X-Robots-Tag', 'noindex, nofollow');

	return c.json({
		token: row.token,
		collection: row.collection,
		blob: row.blob,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
	});
});

export const unlistedPublicRoutes = routes;
