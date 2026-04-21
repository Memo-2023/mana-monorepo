/**
 * Public tracking endpoints — NO auth (recipients aren't logged in).
 *
 * Verification happens via HMAC on the token in the URL. A leaked / forged
 * token just silently falls through to a graceful response; we never
 * reveal whether a token was recognised or not, because that would help
 * an attacker probe the space.
 *
 * M4 status: tokens are signed and validated, but event persistence is
 * a minimal stub — inserts with metadata only, no dedup / IP-hashing.
 * M5 adds the full tracking pipeline (rate-limited dedup, user-agent
 * hashing, bounce webhook integration).
 */

import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { sends, events } from '../db/schema';
import { verifyToken } from '../services/tracking-token';

// ─── Response helpers ───────────────────────────────────

/**
 * 1×1 transparent GIF for the open-tracking pixel. Generated once — this
 * is the smallest valid GIF that renders correctly in every mail client.
 */
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function pixelResponse(): Response {
	return new Response(PIXEL_GIF, {
		status: 200,
		headers: {
			'content-type': 'image/gif',
			'content-length': String(PIXEL_GIF.byteLength),
			'cache-control': 'no-store, no-cache, must-revalidate, private',
			pragma: 'no-cache',
			expires: '0',
		},
	});
}

function hashIp(ip: string): string {
	return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function hashUserAgent(ua: string): string {
	return createHash('sha256').update(ua).digest('hex').slice(0, 16);
}

// ─── Routes ────────────────────────────────────────────

export function createBroadcastTrackRoutes(db: Database, trackingSecret: string, baseUrl: string) {
	const app = new Hono();

	/**
	 * GET /track/open/:token — 1×1 pixel. Always returns the pixel even
	 * on bad tokens so there's no signal to whoever's probing.
	 */
	app.get('/track/open/:token', async (c) => {
		const token = c.req.param('token');
		const payload = verifyToken(token, trackingSecret);
		if (!payload) return pixelResponse();

		const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
		const ua = c.req.header('user-agent') ?? '';

		// Best-effort insert — if the DB is unreachable, we still return
		// the pixel so the email displays correctly in the client.
		try {
			await db.insert(events).values({
				sendId: payload.sendId,
				kind: 'open',
				ipHash: hashIp(ip),
				userAgentHash: hashUserAgent(ua),
			});
		} catch {
			// Swallow — see comment above.
		}

		return pixelResponse();
	});

	/**
	 * GET /track/click/:token?url=... — 302 to the original URL. Same
	 * graceful-fall-through on verification failure so a broken token
	 * doesn't strand the recipient on a dead page.
	 */
	app.get('/track/click/:token', async (c) => {
		const token = c.req.param('token');
		const targetUrl = c.req.query('url');
		if (!targetUrl) return c.text('missing url', 400);

		// Validate target is http(s) to prevent open-redirect-to-javascript:
		// et al. If it's not, refuse rather than bounce through.
		if (!/^https?:\/\//i.test(targetUrl)) return c.text('bad url', 400);

		const payload = verifyToken(token, trackingSecret);
		if (payload) {
			try {
				await db.insert(events).values({
					sendId: payload.sendId,
					kind: 'click',
					linkUrl: targetUrl,
					ipHash: hashIp(c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'),
					userAgentHash: hashUserAgent(c.req.header('user-agent') ?? ''),
				});
			} catch {
				// Best-effort; continue to redirect.
			}
		}

		return c.redirect(targetUrl, 302);
	});

	/**
	 * GET /track/unsubscribe/:token — confirmation page + implicit
	 * one-click unsubscribe.
	 *
	 * RFC 8058 wants one-click via POST to this URL. We also handle GET
	 * so a plain anchor link works for older clients — but we still
	 * persist the unsubscribe on GET because the user actively clicked.
	 */
	app.get('/track/unsubscribe/:token', async (c) => {
		const token = c.req.param('token');
		const payload = verifyToken(token, trackingSecret);
		if (!payload) {
			return c.html(
				'<!doctype html><html><body><h1>Ungültiger Abmelde-Link</h1><p>Der Link ist entweder abgelaufen oder wurde manipuliert.</p></body></html>',
				400
			);
		}

		try {
			await db
				.update(sends)
				.set({ status: 'unsubscribed', unsubscribedAt: new Date() })
				.where(eq(sends.id, payload.sendId));
			await db.insert(events).values({
				sendId: payload.sendId,
				kind: 'unsubscribe',
			});
		} catch {
			// Still render the success page — the recipient did their part,
			// db hiccups are our problem not theirs.
		}

		return c.html(
			'<!doctype html><html><head><meta charset="utf-8"><title>Abgemeldet</title></head>' +
				'<body style="font-family:system-ui,sans-serif;max-width:480px;margin:48px auto;padding:24px;color:#0f172a;">' +
				'<h1 style="font-size:24px;">Du wurdest abgemeldet</h1>' +
				'<p>Du bekommst von uns keine weiteren Newsletter mehr.</p>' +
				'<p style="color:#64748b;font-size:14px;">Falls das ein Versehen war, antworte einfach auf eine unserer letzten E-Mails — wir kümmern uns darum.</p>' +
				'</body></html>'
		);
	});

	/**
	 * POST /track/unsubscribe/:token — RFC 8058 one-click unsubscribe.
	 * Same effect as GET but returns 204 so the client doesn't show a
	 * page (Gmail/Apple-Mail's native button calls this).
	 */
	app.post('/track/unsubscribe/:token', async (c) => {
		const token = c.req.param('token');
		const payload = verifyToken(token, trackingSecret);
		if (!payload) return c.text('', 400);

		try {
			await db
				.update(sends)
				.set({ status: 'unsubscribed', unsubscribedAt: new Date() })
				.where(eq(sends.id, payload.sendId));
			await db.insert(events).values({ sendId: payload.sendId, kind: 'unsubscribe' });
		} catch {
			return c.text('', 500);
		}

		return c.text('', 204);
	});

	void baseUrl; // reserved for future asset URLs
	return app;
}
