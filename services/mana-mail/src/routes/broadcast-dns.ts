/**
 * GET /v1/mail/dns-check?domain=<apex> — JWT auth.
 *
 * Returns the SPF / DKIM / DMARC status for the user's sending domain
 * plus the exact records they should publish. Called on-demand from
 * the broadcast settings UI.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { checkDomain } from '../services/dns-check';
import type { AuthUser } from '../middleware/jwt-auth';

const querySchema = z.object({
	domain: z
		.string()
		.min(3)
		.regex(/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i, 'Domain sieht nicht valide aus'),
	selector: z.string().optional(),
});

export function createBroadcastDnsRoutes(defaultMailDomain: string) {
	return new Hono<{ Variables: { user: AuthUser } }>().get('/dns-check', async (c) => {
		const parsed = querySchema.safeParse({
			domain: c.req.query('domain'),
			selector: c.req.query('selector'),
		});
		if (!parsed.success) {
			return c.json({ error: parsed.error.issues[0]?.message ?? 'bad query' }, 400);
		}
		try {
			const result = await checkDomain(parsed.data.domain, {
				mailDomain: defaultMailDomain,
				dkimSelector: parsed.data.selector,
			});
			return c.json(result);
		} catch (err) {
			const reason = err instanceof Error ? err.message : String(err);
			return c.json({ error: `DNS-Lookup fehlgeschlagen: ${reason}` }, 502);
		}
	});
}
