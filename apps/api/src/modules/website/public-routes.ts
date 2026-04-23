/**
 * Public website routes — UNAUTHENTICATED.
 *
 * Mounted at `/api/v1/website/public/*` BEFORE the global
 * `authMiddleware` in apps/api/src/index.ts so anonymous visitors can
 * fetch published snapshots.
 */

import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db, publishedSnapshots, customDomains } from './schema';
import { errorResponse } from '../../lib/responses';
import { websiteSubmitRoutes } from './submit';

const routes = new Hono();
routes.route('/', websiteSubmitRoutes);

/**
 * GET /api/v1/website/public/resolve-host?host=custom.example.com
 *
 * SvelteKit's hooks.server.ts calls this on every request to figure
 * out if a non-mana.how hostname (custom domain) should be rewritten
 * to a public site route. Returns `{ slug, siteId }` on match, 404
 * otherwise. Only `status='verified'` bindings match.
 */
routes.get('/resolve-host', async (c) => {
	const raw = c.req.query('host');
	const host = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
	if (!host) return errorResponse(c, 'host query param required', 400);

	const rows = await db
		.select({ siteId: customDomains.siteId, hostname: customDomains.hostname })
		.from(customDomains)
		.where(and(eq(customDomains.hostname, host), eq(customDomains.status, 'verified')))
		.limit(1);

	if (!rows[0]) return errorResponse(c, 'Host not found', 404, { code: 'NOT_FOUND' });

	// Look up the slug from the most recent published snapshot.
	const snap = await db
		.select({ slug: publishedSnapshots.slug })
		.from(publishedSnapshots)
		.where(
			and(eq(publishedSnapshots.siteId, rows[0].siteId), eq(publishedSnapshots.isCurrent, true))
		)
		.limit(1);

	if (!snap[0]) {
		return errorResponse(c, 'Site not currently published', 404, {
			code: 'NOT_PUBLISHED',
		});
	}

	c.header('Cache-Control', 'public, max-age=60, s-maxage=600');
	return c.json({ slug: snap[0].slug, siteId: rows[0].siteId });
});

/**
 * GET /api/v1/website/public/sites/:slug
 *
 * Returns the currently-published snapshot blob (404 if not found).
 * The blob includes all pages — the SvelteKit route picks the right
 * one by path client-side / in its server-load. One round trip serves
 * the whole site.
 */
routes.get('/sites/:slug', async (c) => {
	const slug = c.req.param('slug');
	if (!slug) return errorResponse(c, 'slug required', 400);

	const rows = await db
		.select({
			id: publishedSnapshots.id,
			slug: publishedSnapshots.slug,
			blob: publishedSnapshots.blob,
			publishedAt: publishedSnapshots.publishedAt,
		})
		.from(publishedSnapshots)
		.where(and(eq(publishedSnapshots.slug, slug), eq(publishedSnapshots.isCurrent, true)))
		.limit(1);

	if (!rows[0]) return errorResponse(c, 'Site not found', 404, { code: 'NOT_FOUND' });

	// Conservative caching: short freshness window, aggressive stale-while-
	// revalidate. Publish endpoint will purge by tag in M6; until then CF
	// respects the max-age on the edge layer.
	c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
	c.header('Cache-Tag', `site-${rows[0].id}`);

	return c.json({
		snapshotId: rows[0].id,
		slug: rows[0].slug,
		publishedAt: rows[0].publishedAt.toISOString(),
		blob: rows[0].blob,
	});
});

export const websitePublicRoutes = routes;
