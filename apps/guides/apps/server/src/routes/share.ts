/**
 * Share routes — public guide links (Phase 3, in-memory store for MVP)
 *
 * POST /api/v1/share        → create shareable link for a guide snapshot
 * GET  /api/v1/share/:token → retrieve shared guide by token
 */

import { Hono } from 'hono';

export const shareRoutes = new Hono();

// In-memory store for shared guides (replace with DB in Phase 4)
const sharedGuides = new Map<string, { guide: unknown; sections: unknown[]; createdAt: string; expiresAt: string }>();

shareRoutes.post('/', async (c) => {
	const body = await c.req.json<{ guide: unknown; sections: unknown[] }>();

	if (!body.guide) {
		return c.json({ error: 'Kein Guide-Inhalt angegeben' }, 400);
	}

	const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

	sharedGuides.set(token, {
		guide: body.guide,
		sections: body.sections ?? [],
		createdAt: new Date().toISOString(),
		expiresAt,
	});

	const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5200';
	return c.json({ token, url: `${baseUrl}/shared/${token}`, expiresAt });
});

shareRoutes.get('/:token', (c) => {
	const { token } = c.req.param();
	const shared = sharedGuides.get(token);

	if (!shared) {
		return c.json({ error: 'Guide nicht gefunden oder Link abgelaufen' }, 404);
	}

	if (new Date(shared.expiresAt) < new Date()) {
		sharedGuides.delete(token);
		return c.json({ error: 'Dieser Link ist abgelaufen' }, 410);
	}

	return c.json(shared);
});
