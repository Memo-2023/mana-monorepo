/**
 * Custom-domain CRUD + DNS verification — authenticated, founder-only.
 *
 * Flow:
 *   1. User adds hostname → row with status='pending', fresh
 *      verification_token (random 32-char hex)
 *   2. We return DNS instructions:
 *        CNAME {hostname}              → custom.mana.how
 *        TXT   _mana-challenge.{hostname} → {verification_token}
 *   3. User configures DNS, clicks "Verify"
 *   4. Server resolves both records via node:dns/promises, on success:
 *        - mark status='verified', set verified_at
 *        - call Cloudflare SaaS Hostnames API to provision a TLS cert
 *          (STUBBED in M6 first-pass — see cloudflareOnboard())
 *
 * The public resolver (`/public/resolve-host`) reads `verified` rows
 * only — an incomplete verification cannot serve content.
 */

import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { promises as dns } from 'node:dns';
import { requireTier, type AuthVariables } from '@mana/shared-hono';
import { errorResponse, validationError } from '../../lib/responses';
import { websiteDomainVerifyTotal } from '../../lib/metrics';
import { db, customDomains } from './schema';
import { isValidHostname } from './reserved-slugs';

const routes = new Hono<{ Variables: AuthVariables }>();

// Custom domains are a founder-tier feature. Gate every route below.
routes.use('/sites/*/domains', requireTier('founder'));
routes.use('/sites/*/domains/*', requireTier('founder'));

// ─── Constants ────────────────────────────────────────────

const DNS_TARGET = process.env.WEBSITE_DNS_TARGET ?? 'custom.mana.how';
const CHALLENGE_PREFIX = '_mana-challenge';

function randomToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// ─── POST /sites/:id/domains — add a domain ───────────────

routes.post('/sites/:id/domains', async (c) => {
	const userId = c.get('userId');
	const siteId = c.req.param('id');
	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const body = (await c.req.json().catch(() => null)) as { hostname?: unknown } | null;
	const raw = typeof body?.hostname === 'string' ? body.hostname : '';
	const hostname = raw.toLowerCase().trim();
	if (!isValidHostname(hostname)) {
		return validationError(c, [
			{
				code: 'invalid_string',
				path: ['hostname'],
				message: 'Ungültiger oder reservierter Hostname',
			},
		]);
	}

	try {
		const [row] = await db
			.insert(customDomains)
			.values({
				siteId,
				hostname,
				status: 'pending',
				verificationToken: randomToken(),
				dnsTarget: DNS_TARGET,
				createdBy: userId,
			})
			.returning();
		if (!row) throw new Error('insert returned no row');

		return c.json(serialize(row), 201);
	} catch (err) {
		if (err instanceof Error && /unique/i.test(err.message)) {
			return errorResponse(c, 'Hostname ist bereits registriert', 409, {
				code: 'HOSTNAME_TAKEN',
			});
		}
		throw err;
	}
});

// ─── GET /sites/:id/domains — list ────────────────────────

routes.get('/sites/:id/domains', async (c) => {
	const siteId = c.req.param('id');
	if (!siteId) return errorResponse(c, 'siteId required', 400);

	const rows = await db
		.select()
		.from(customDomains)
		.where(eq(customDomains.siteId, siteId))
		.orderBy(desc(customDomains.createdAt));

	return c.json({ domains: rows.map(serialize) });
});

// ─── POST /sites/:id/domains/:domainId/verify ─────────────

routes.post('/sites/:id/domains/:domainId/verify', async (c) => {
	const siteId = c.req.param('id');
	const domainId = c.req.param('domainId');
	if (!siteId || !domainId) return errorResponse(c, 'ids required', 400);

	const [row] = await db
		.select()
		.from(customDomains)
		.where(and(eq(customDomains.id, domainId), eq(customDomains.siteId, siteId)))
		.limit(1);
	if (!row) return errorResponse(c, 'Domain not found', 404, { code: 'NOT_FOUND' });

	// Mark verifying first so concurrent clicks don't all hit DNS.
	await db
		.update(customDomains)
		.set({ status: 'verifying', updatedAt: new Date(), errorMessage: null })
		.where(eq(customDomains.id, domainId));

	const result = await verifyDns(row.hostname, row.verificationToken, row.dnsTarget);

	if (result.ok) {
		await db
			.update(customDomains)
			.set({
				status: 'verified',
				verifiedAt: new Date(),
				errorMessage: null,
				updatedAt: new Date(),
			})
			.where(eq(customDomains.id, domainId));
		// Fire-and-forget CF onboarding. If it fails, the binding is
		// still `verified` in our DB — the Cloudflare hostname just
		// isn't issued yet, so TLS won't terminate. Ops owns that gap
		// in M6; automated retry comes in M7 alongside observability.
		void cloudflareOnboard(row.hostname).catch((err) => {
			console.error('[website] cloudflare onboard failed', { hostname: row.hostname, err });
		});
		websiteDomainVerifyTotal.inc({ result: 'verified' });
		return c.json({ verified: true, hostname: row.hostname });
	}

	await db
		.update(customDomains)
		.set({
			status: 'failed',
			errorMessage: result.reason,
			updatedAt: new Date(),
		})
		.where(eq(customDomains.id, domainId));

	websiteDomainVerifyTotal.inc({ result: 'failed' });
	return c.json({ verified: false, reason: result.reason }, 400);
});

// ─── DELETE /sites/:id/domains/:domainId ──────────────────

routes.delete('/sites/:id/domains/:domainId', async (c) => {
	const siteId = c.req.param('id');
	const domainId = c.req.param('domainId');
	if (!siteId || !domainId) return errorResponse(c, 'ids required', 400);

	const deleted = await db
		.delete(customDomains)
		.where(and(eq(customDomains.id, domainId), eq(customDomains.siteId, siteId)))
		.returning({ id: customDomains.id, hostname: customDomains.hostname });

	if (deleted.length === 0) {
		return errorResponse(c, 'Domain not found', 404, { code: 'NOT_FOUND' });
	}

	// Best-effort CF cleanup — same contract as onboard.
	void cloudflareOffboard(deleted[0]!.hostname).catch((err) => {
		console.error('[website] cloudflare offboard failed', { err });
	});

	return c.json({ deleted: true });
});

// ─── Helpers ─────────────────────────────────────────────

function serialize(row: typeof customDomains.$inferSelect) {
	return {
		id: row.id,
		siteId: row.siteId,
		hostname: row.hostname,
		status: row.status,
		dnsTarget: row.dnsTarget,
		verificationToken: row.verificationToken,
		errorMessage: row.errorMessage,
		verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/**
 * Run the two DNS checks. Returns `{ ok: true }` if both succeed,
 * otherwise a human-readable reason that bubbles to the UI.
 */
async function verifyDns(
	hostname: string,
	expectedToken: string,
	cnameTarget: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
	// 1. TXT challenge: _mana-challenge.{hostname} must contain token.
	let txtChunks: string[][];
	try {
		txtChunks = await dns.resolveTxt(`${CHALLENGE_PREFIX}.${hostname}`);
	} catch (err) {
		const code = (err as { code?: string }).code ?? 'UNKNOWN';
		if (code === 'ENOTFOUND' || code === 'ENODATA') {
			return {
				ok: false,
				reason: `TXT-Record ${CHALLENGE_PREFIX}.${hostname} nicht gefunden`,
			};
		}
		return { ok: false, reason: `DNS-Fehler (TXT): ${code}` };
	}
	const txtValues = txtChunks.map((chunks) => chunks.join(''));
	if (!txtValues.includes(expectedToken)) {
		return {
			ok: false,
			reason: `TXT-Record-Wert stimmt nicht überein. Erwartet: ${expectedToken}`,
		};
	}

	// 2. CNAME on root hostname must point to dnsTarget. For apex
	//    domains (myportfolio.com), DNS providers typically require
	//    ALIAS / ANAME instead of CNAME — we accept both by falling
	//    back to resolve4() against dnsTarget's IP if CNAME lookup
	//    returns ENODATA.
	try {
		const cnames = await dns.resolveCname(hostname);
		if (!cnames.map((c) => c.toLowerCase()).includes(cnameTarget.toLowerCase())) {
			return {
				ok: false,
				reason: `CNAME zeigt nicht auf ${cnameTarget} (gefunden: ${cnames.join(', ') || '—'})`,
			};
		}
	} catch (err) {
		const code = (err as { code?: string }).code ?? 'UNKNOWN';
		if (code === 'ENODATA') {
			// Apex-domain fallback — compare resolved A records.
			try {
				const [hostIps, targetIps] = await Promise.all([
					dns.resolve4(hostname),
					dns.resolve4(cnameTarget),
				]);
				const matches = hostIps.some((ip) => targetIps.includes(ip));
				if (!matches) {
					return {
						ok: false,
						reason: `A/ALIAS-Record zeigt nicht auf ${cnameTarget} (IPs: ${hostIps.join(', ')})`,
					};
				}
			} catch {
				return {
					ok: false,
					reason: `Weder CNAME noch A-Record-Abgleich mit ${cnameTarget} möglich`,
				};
			}
		} else if (code === 'ENOTFOUND') {
			return { ok: false, reason: `Hostname ${hostname} nicht auflösbar` };
		} else {
			return { ok: false, reason: `DNS-Fehler (CNAME): ${code}` };
		}
	}

	return { ok: true };
}

/**
 * Provision the custom hostname in Cloudflare SaaS Hostnames so TLS
 * works end-to-end. STUBBED in M6 first-pass.
 *
 * What needs to happen in production:
 *   POST https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/custom_hostnames
 *     body: { hostname, ssl: { method: 'http', type: 'dv' } }
 *     headers: Authorization: Bearer CF_API_TOKEN
 *
 * We also need to watch CF's hostname status (issued → active) and
 * reflect it in our `status` column. That's a M7 observability task.
 */
async function cloudflareOnboard(hostname: string): Promise<void> {
	const token = process.env.CF_API_TOKEN;
	const zoneId = process.env.CF_ZONE_ID;
	if (!token || !zoneId) {
		console.warn('[website] CF onboard skipped — no credentials', { hostname });
		return;
	}
	// Real implementation goes here. Left unimplemented in M6 because
	// we haven't provisioned CF_ZONE_ID yet; the stub logs the intent.
	console.info('[website] CF onboard TODO', { hostname, zoneId: '***' });
}

async function cloudflareOffboard(hostname: string): Promise<void> {
	const token = process.env.CF_API_TOKEN;
	const zoneId = process.env.CF_ZONE_ID;
	if (!token || !zoneId) return;
	console.info('[website] CF offboard TODO', { hostname, zoneId: '***' });
}

export const websiteDomainsRoutes = routes;
