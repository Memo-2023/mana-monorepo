/**
 * Website module — block-tree CMS backend.
 *
 * M1 scope (this file): health + reserved-slug validation endpoint.
 *
 * CRUD for sites / pages / blocks goes through the generic mana-sync
 * pipeline (local-first); this module only hosts compute-style
 * endpoints that need server authority:
 *   - slug / path validation (reserved-list check)
 *   - publish (M2) — builds snapshot, writes published_snapshots,
 *     purges Cloudflare cache
 *   - submit (M4) — unauthenticated form endpoint
 *   - published-snapshot read (M2) — powers the public /s/[slug] renderer
 *
 * See docs/plans/website-builder.md.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@mana/shared-hono';
import { RESERVED_SLUGS, isValidSlug } from './reserved-slugs';
import { websitePublishRoutes } from './publish';
import { websiteDomainsRoutes } from './domains';

const routes = new Hono<{ Variables: AuthVariables }>();

routes.get('/health', (c) => c.json({ status: 'ok', module: 'website', milestone: 'M2' }));

/**
 * Slug validation endpoint — mirrors the client-side check in
 * constants.ts but with server-authoritative reserved-list. Used by
 * the editor before create to surface a clear error early.
 */
routes.get('/slugs/check', (c) => {
	const slug = c.req.query('slug') ?? '';
	const reserved = RESERVED_SLUGS.includes(slug.toLowerCase());
	const valid = isValidSlug(slug);
	return c.json({
		slug,
		valid,
		reserved,
		reason: !valid ? (reserved ? 'reserved' : 'format') : null,
	});
});

/**
 * Expose the reserved-slug list so future tools (AI agents, import
 * scripts) don't hard-code their own copy.
 */
routes.get('/slugs/reserved', (c) => c.json({ reserved: RESERVED_SLUGS }));

// ─── Publish + rollback (authenticated) ────────────────
routes.route('/', websitePublishRoutes);

// ─── Custom-domain CRUD (authenticated, founder-gated above) ──
routes.route('/', websiteDomainsRoutes);

export const websiteRoutes = routes;
