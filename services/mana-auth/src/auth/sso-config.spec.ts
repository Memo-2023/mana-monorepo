/**
 * SSO config consistency tests.
 *
 * Locks in the relationship between three places that must agree about
 * which origins are allowed to talk to mana-auth:
 *
 *   1. `TRUSTED_ORIGINS` in `better-auth.config.ts` — Better Auth's
 *      cross-origin allow-list. A missing entry causes silent login
 *      failure (request rejected before any handler runs).
 *   2. `CORS_ORIGINS` env var on the `mana-auth` service in
 *      `docker-compose.macmini.yml` — Hono's CORS preflight check.
 *      A missing entry causes browsers to block the response.
 *   3. The set of HTTPS origins in (1) must be a SUBSET of (2) — every
 *      production origin Better Auth trusts must also pass CORS.
 *
 * The reverse is intentionally NOT enforced: docker-compose may list
 * extra origins (e.g. legacy subdomains) that Better Auth doesn't yet
 * trust. But if it does, this test reports them so dead entries get
 * cleaned up rather than accumulating forever.
 *
 * This test is referenced from the root CLAUDE.md as the canonical
 * way to verify "I added a new app to SSO" — see "Adding an app to SSO"
 * in `/CLAUDE.md`.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRUSTED_ORIGINS } from './sso-origins';

const REPO_ROOT = join(import.meta.dir, '../../../..');
const COMPOSE_FILE = join(REPO_ROOT, 'docker-compose.macmini.yml');

/**
 * Pull the `CORS_ORIGINS` value out of the `mana-auth` service block in
 * docker-compose.macmini.yml. We deliberately do a coarse string scan
 * instead of a YAML parse to keep this test dependency-free — the
 * compose file's `mana-auth:` block is conventional enough that the
 * `service: ... CORS_ORIGINS: ...` window is unambiguous.
 */
function readManaAuthCorsOrigins(): string[] {
	const yaml = readFileSync(COMPOSE_FILE, 'utf8');
	// Find the mana-auth service definition
	const serviceMatch = yaml.match(/^ {2}mana-auth:\s*$/m);
	if (!serviceMatch) {
		throw new Error('mana-auth service not found in docker-compose.macmini.yml');
	}
	const tail = yaml.slice(serviceMatch.index! + serviceMatch[0].length);
	// CORS_ORIGINS appears within the next ~50 lines under environment:
	const corsMatch = tail.match(/CORS_ORIGINS:\s*([^\n]+)/);
	if (!corsMatch) {
		throw new Error('CORS_ORIGINS not found in mana-auth service block');
	}
	return corsMatch[1]
		.replace(/^["']|["']$/g, '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

describe('SSO trusted origins', () => {
	it('contains the canonical mana.how origin', () => {
		expect(TRUSTED_ORIGINS).toContain('https://mana.how');
	});

	it('contains the auth subdomain (Better Auth callback target)', () => {
		expect(TRUSTED_ORIGINS).toContain('https://auth.mana.how');
	});

	it('contains localhost dev origins for local development', () => {
		// Web dev server (5173) and the auth server itself (3001) — both
		// are required for the local SSO loop to work end-to-end.
		expect(TRUSTED_ORIGINS).toContain('http://localhost:5173');
		expect(TRUSTED_ORIGINS).toContain('http://localhost:3001');
	});

	it('every production origin uses HTTPS', () => {
		const httpOrigins = TRUSTED_ORIGINS.filter(
			(o) => o.startsWith('http://') && !o.includes('localhost')
		);
		expect(httpOrigins).toEqual([]);
	});

	it('every production origin is on mana.how (no third-party hosts)', () => {
		const offRoot = TRUSTED_ORIGINS.filter((o) => {
			if (o.includes('localhost')) return false;
			return !/^https:\/\/([a-z0-9-]+\.)?mana\.how$/.test(o);
		});
		expect(offRoot).toEqual([]);
	});

	it('has no duplicate entries', () => {
		const set = new Set(TRUSTED_ORIGINS);
		expect(set.size).toBe(TRUSTED_ORIGINS.length);
	});
});

describe('SSO ↔ docker-compose CORS_ORIGINS consistency', () => {
	const corsOrigins = readManaAuthCorsOrigins();

	it('every HTTPS trusted origin is also in mana-auth CORS_ORIGINS', () => {
		const productionTrusted = TRUSTED_ORIGINS.filter((o) => o.startsWith('https://'));
		const missing = productionTrusted.filter((o) => !corsOrigins.includes(o));
		// If this fails: add the listed origins to CORS_ORIGINS for the
		// mana-auth service in docker-compose.macmini.yml.
		expect(missing).toEqual([]);
	});

	it('mana-auth CORS_ORIGINS contains NO entries outside trustedOrigins (no dead drift)', () => {
		// Hard-fail on extras: if CORS lists an origin Better Auth doesn't
		// trust, the server accepts the preflight but then silently rejects
		// the auth request — worst-of-both-worlds. Tightened from a warning
		// to a hard assertion on 2026-04-19 per audit.
		// Fix: either add the origin to TRUSTED_ORIGINS (in sso-origins.ts)
		// or remove it from the mana-auth CORS_ORIGINS in
		// docker-compose.macmini.yml.
		const extras = corsOrigins.filter(
			(o) =>
				o.startsWith('https://') && !TRUSTED_ORIGINS.includes(o as (typeof TRUSTED_ORIGINS)[number])
		);
		expect(extras).toEqual([]);
	});
});
