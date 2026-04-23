/**
 * API-login fixture.
 *
 * The web app's normal login flow is a visual concern — we're testing
 * downstream views, not the login UI, so we skip the form. Instead:
 *
 *   1. Derive the persona's password (same HMAC algorithm as the seed
 *      script + the persona-runner — all three must stay in sync).
 *   2. POST /api/v1/auth/login to capture the better-auth session cookie.
 *   3. Inject the cookie into the Playwright browser context, then goto /.
 *
 * Tests opt in via the typed `test.use({ persona: 'anna' })` below;
 * they receive a logged-in `page` with `persona.email` available.
 */

import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { createHmac } from 'node:crypto';

const AUTH_URL = process.env.PERSONAS_AUTH_URL ?? 'http://localhost:3001';
const BASE_URL = process.env.PERSONAS_BASE_URL ?? 'http://localhost:5173';
const COOKIE_DOMAIN = process.env.PERSONAS_COOKIE_DOMAIN ?? new URL(BASE_URL).hostname;
const SEED_SECRET = process.env.PERSONA_SEED_SECRET ?? 'dev-persona-seed-secret-rotate-in-prod';

/**
 * Must stay bit-identical to `scripts/personas/password.ts` and
 * `services/mana-persona-runner/src/password.ts`. Changing one without
 * the others locks the test suite out of every persona.
 */
function personaPassword(email: string): string {
	const hmac = createHmac('sha256', SEED_SECRET).update(email).digest('base64');
	return hmac.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

export interface PersonaInfo {
	name: string;
	email: string;
	archetype: string;
}

export const PERSONAS: Record<string, PersonaInfo> = {
	anna: { name: 'Anna', email: 'persona.anna@mana.test', archetype: 'adhd-student' },
	ben: { name: 'Ben', email: 'persona.ben@mana.test', archetype: 'adhd-student' },
	marcus: { name: 'Marcus', email: 'persona.marcus@mana.test', archetype: 'ceo-busy' },
	lena: { name: 'Lena', email: 'persona.lena@mana.test', archetype: 'ceo-busy' },
	sofia: { name: 'Sofia', email: 'persona.sofia@mana.test', archetype: 'creative-parent' },
	tom: { name: 'Tom', email: 'persona.tom@mana.test', archetype: 'creative-parent' },
	kai: { name: 'Kai', email: 'persona.kai@mana.test', archetype: 'solo-dev' },
	julia: { name: 'Julia', email: 'persona.julia@mana.test', archetype: 'researcher' },
	paul: { name: 'Paul', email: 'persona.paul@mana.test', archetype: 'freelancer' },
	maya: { name: 'Maya', email: 'persona.maya@mana.test', archetype: 'overwhelmed-newbie' },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

interface SetCookie {
	name: string;
	value: string;
	path?: string;
	domain?: string;
	expires?: number;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Log in over HTTP, return the Set-Cookie headers as Playwright-compatible
 * cookie objects ready for `context.addCookies()`.
 */
async function loginAndGetCookies(email: string): Promise<SetCookie[]> {
	const res = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email, password: personaPassword(email) }),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '<unreadable>');
		throw new Error(
			`Persona login ${email} failed: HTTP ${res.status} — ${text.slice(0, 300)}. ` +
				`Is mana-auth running at ${AUTH_URL}? Has \`pnpm seed:personas\` been run?`
		);
	}
	const raw =
		res.headers.getSetCookie?.() ?? res.headers.get('set-cookie')?.split(/, (?=[^ ])/) ?? [];
	const cookies: SetCookie[] = [];
	for (const line of raw) {
		const cookie = parseSetCookie(line);
		if (cookie) cookies.push(cookie);
	}
	if (cookies.length === 0) {
		throw new Error(
			`Persona login ${email} succeeded but no Set-Cookie headers — better-auth config drift?`
		);
	}
	return cookies;
}

function parseSetCookie(header: string): SetCookie | null {
	const parts = header.split(';').map((p) => p.trim());
	const [nv, ...rest] = parts;
	const eq = nv.indexOf('=');
	if (eq < 0) return null;
	const cookie: SetCookie = {
		name: nv.slice(0, eq),
		value: nv.slice(eq + 1),
		path: '/',
		domain: COOKIE_DOMAIN,
	};
	for (const attr of rest) {
		const [rk, rv] = attr.split('=', 2);
		const key = rk.toLowerCase();
		if (key === 'path' && rv) cookie.path = rv;
		else if (key === 'domain' && rv) cookie.domain = rv.replace(/^\./, '');
		else if (key === 'httponly') cookie.httpOnly = true;
		else if (key === 'secure') cookie.secure = true;
		else if (key === 'samesite' && rv) {
			const s = rv as 'Strict' | 'Lax' | 'None';
			cookie.sameSite = s;
		}
	}
	return cookie;
}

export async function loginPersonaContext(context: BrowserContext, email: string): Promise<void> {
	const cookies = await loginAndGetCookies(email);
	await context.addCookies(
		cookies.map((c) => ({
			name: c.name,
			value: c.value,
			domain: c.domain ?? COOKIE_DOMAIN,
			path: c.path ?? '/',
			httpOnly: c.httpOnly,
			secure: c.secure,
			sameSite: c.sameSite,
		}))
	);
}

// ─── Typed test fixture ───────────────────────────────────────────

type PersonaTestFixtures = {
	persona: PersonaInfo;
	/** Pre-logged-in page pointed at `/`. Waiting for networkidle already done. */
	personaPage: Page;
};

type PersonaWorkerOptions = {
	personaKey: PersonaKey;
};

/**
 * Use `test.extend<{}, PersonaWorkerOptions>` and declare `test.use({ personaKey: 'anna' })`
 * at the top of each spec. Each spec gets a freshly-logged-in page.
 */
export const test = base.extend<PersonaTestFixtures, PersonaWorkerOptions>({
	personaKey: ['anna', { option: true, scope: 'worker' }],
	persona: async ({ personaKey }, use) => {
		const info = PERSONAS[personaKey];
		if (!info) throw new Error(`Unknown persona key: ${personaKey}`);
		await use(info);
	},
	personaPage: async ({ context, persona }, use) => {
		await loginPersonaContext(context, persona.email);
		const page = await context.newPage();
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await use(page);
	},
});

export { expect };
