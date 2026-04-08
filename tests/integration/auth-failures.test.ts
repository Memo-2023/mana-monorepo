/**
 * Negative-path integration tests for the auth flow.
 *
 * Companion to auth-flow.test.ts (the happy path). These cover the
 * "user did something wrong" branches of mana-auth so refactors can't
 * silently break them:
 *
 *   1. Login with wrong password → 401, LOGIN_FAILURE audit row, no JWT
 *   2. Account lockout: 5 failed attempts → 6th returns 429 with
 *      remainingSeconds
 *   3. Login as unverified user → 403 EMAIL_NOT_VERIFIED
 *   4. POST /api/v1/auth/validate with garbage → valid: false
 *   5. POST /api/v1/auth/resend-verification → second email lands in
 *      mailpit (catches the bug class where the resend handler swallows
 *      its own send error)
 *
 * Same docker-compose.test.yml stack as the happy-path test — both
 * files run against `localhost:3091` (mana-auth) and `localhost:8026`
 * (mailpit). Run via `./scripts/run-integration-tests.sh`.
 */

import { test, expect, beforeAll, afterAll } from 'bun:test';

const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3091';
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8026';

// Two distinct users so the verified-user tests don't trip the
// unverified-user assertions and vice versa.
const VERIFIED_EMAIL = `failures-verified-${Date.now()}@manatest.local`;
const UNVERIFIED_EMAIL = `failures-unverified-${Date.now()}@manatest.local`;
const PASSWORD = 'TestPassword123!';

let verifiedUserId: string | null = null;
let unverifiedUserId: string | null = null;

// ─── Tiny helpers (same shape as auth-flow.test.ts) ──────────────────

async function postJson<T = unknown>(path: string, body: unknown, headers?: HeadersInit) {
	const res = await fetch(`${AUTH_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(body),
	});
	const json = (await res.json().catch(() => ({}))) as T;
	return { status: res.status, json };
}

async function pgExec(sql: string): Promise<string> {
	const proc = Bun.spawn(
		[
			'docker',
			'exec',
			'mana-test-postgres',
			'psql',
			'-U',
			'mana',
			'-d',
			'mana_platform',
			'-t',
			'-A',
			'-c',
			sql,
		],
		{ stdout: 'pipe', stderr: 'pipe' }
	);
	const out = await new Response(proc.stdout).text();
	const err = await new Response(proc.stderr).text();
	const code = await proc.exited;
	if (code !== 0) throw new Error(`psql failed (${code}): ${err}`);
	return out.trim();
}

async function countSecurityEvents(userId: string | null, eventType: string): Promise<number> {
	if (!userId) {
		// LOGIN_FAILURE rows don't carry a user_id (we don't know which
		// user yet). Match by event_type alone for those.
		const out = await pgExec(
			`SELECT COUNT(*) FROM auth.security_events WHERE event_type = '${eventType}';`
		);
		return parseInt(out, 10);
	}
	const out = await pgExec(
		`SELECT COUNT(*) FROM auth.security_events WHERE user_id = '${userId}' AND event_type = '${eventType}';`
	);
	return parseInt(out, 10);
}

async function countLoginAttempts(email: string): Promise<number> {
	const out = await pgExec(
		`SELECT COUNT(*) FROM auth.login_attempts WHERE email = '${email}' AND successful = false;`
	);
	return parseInt(out, 10);
}

async function mailpitCount(to: string): Promise<number> {
	const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
	if (!res.ok) return 0;
	const data = (await res.json()) as { messages?: unknown[] };
	return data.messages?.length ?? 0;
}

// ─── Setup: create one verified + one unverified user ────────────────

beforeAll(async () => {
	// Verified user
	const reg1 = await postJson<{ user?: { id: string } }>('/api/v1/auth/register', {
		email: VERIFIED_EMAIL,
		password: PASSWORD,
		name: 'Verified',
	});
	expect(reg1.status).toBe(200);
	verifiedUserId = reg1.json.user!.id;
	await pgExec(`UPDATE auth.users SET email_verified = true WHERE id = '${verifiedUserId}';`);

	// Unverified user (just register, leave email_verified = false)
	const reg2 = await postJson<{ user?: { id: string } }>('/api/v1/auth/register', {
		email: UNVERIFIED_EMAIL,
		password: PASSWORD,
		name: 'Unverified',
	});
	expect(reg2.status).toBe(200);
	unverifiedUserId = reg2.json.user!.id;
});

// ─── Cleanup ─────────────────────────────────────────────────────────

afterAll(async () => {
	const ids = [verifiedUserId, unverifiedUserId].filter(Boolean) as string[];
	if (ids.length === 0) return;
	const idList = ids.map((id) => `'${id}'`).join(',');
	const emailList = `'${VERIFIED_EMAIL}', '${UNVERIFIED_EMAIL}'`;
	try {
		await pgExec(
			`DELETE FROM auth.security_events WHERE user_id IN (${idList});
			 DELETE FROM auth.login_attempts WHERE email IN (${emailList});
			 DELETE FROM auth.encryption_vault_audit WHERE user_id IN (${idList});
			 DELETE FROM auth.encryption_vaults WHERE user_id IN (${idList});
			 DELETE FROM auth.users WHERE id IN (${idList});`
		);
	} catch (err) {
		console.warn('cleanup failed:', err);
	}
});

// ─── Tests ───────────────────────────────────────────────────────────

test('login with wrong password → 401, no JWT, LOGIN_FAILURE audit row', async () => {
	const failuresBefore = await countSecurityEvents(null, 'LOGIN_FAILURE');
	const attemptsBefore = await countLoginAttempts(VERIFIED_EMAIL);

	const res = await postJson<{ accessToken?: string }>('/api/v1/auth/login', {
		email: VERIFIED_EMAIL,
		password: 'definitely-not-the-password',
	});
	expect(res.status).toBe(401);
	expect(res.json.accessToken).toBeFalsy();

	const failuresAfter = await countSecurityEvents(null, 'LOGIN_FAILURE');
	expect(failuresAfter).toBe(failuresBefore + 1);

	const attemptsAfter = await countLoginAttempts(VERIFIED_EMAIL);
	expect(attemptsAfter).toBe(attemptsBefore + 1);
});

test('account lockout after 5 failed attempts → 6th returns 429', async () => {
	// Clear any prior attempts so this test is independent of the one above
	await pgExec(`DELETE FROM auth.login_attempts WHERE email = '${VERIFIED_EMAIL}';`);

	for (let i = 0; i < 5; i++) {
		const res = await postJson('/api/v1/auth/login', {
			email: VERIFIED_EMAIL,
			password: 'still-not-the-password',
		});
		expect(res.status).toBe(401);
	}

	// 6th attempt — lockout should kick in BEFORE the password check runs
	const lockedRes = await postJson<{ remainingSeconds?: number; error?: string }>(
		'/api/v1/auth/login',
		{ email: VERIFIED_EMAIL, password: PASSWORD } // even with the right pw
	);
	expect(lockedRes.status).toBe(429);
	expect(lockedRes.json.error).toBe('Account locked');
	expect(lockedRes.json.remainingSeconds).toBeGreaterThan(0);

	// Clean up so the rest of the test file can still log in if needed
	await pgExec(`DELETE FROM auth.login_attempts WHERE email = '${VERIFIED_EMAIL}';`);
});

test('login with unverified email → 403 EMAIL_NOT_VERIFIED', async () => {
	const res = await postJson<{ code?: string; accessToken?: string }>('/api/v1/auth/login', {
		email: UNVERIFIED_EMAIL,
		password: PASSWORD,
	});
	expect(res.status).toBe(403);
	expect(res.json.code).toBe('EMAIL_NOT_VERIFIED');
	expect(res.json.accessToken).toBeFalsy();
});

test('validate with garbage token → valid: false', async () => {
	const res = await postJson<{ valid: boolean }>('/api/v1/auth/validate', {
		token: 'not-a-real-jwt.totally-garbage.signature',
	});
	// Either 200 with valid: false (well-formed but invalid signature) or 401
	// (unparseable). Both are acceptable as long as valid !== true.
	expect([200, 401]).toContain(res.status);
	expect(res.json.valid).not.toBe(true);
});

test('resend verification → second email lands in mailpit', async () => {
	const before = await mailpitCount(UNVERIFIED_EMAIL);

	const res = await postJson<{ success?: boolean }>('/api/v1/auth/resend-verification', {
		email: UNVERIFIED_EMAIL,
	});
	expect(res.status).toBe(200);
	expect(res.json.success).toBe(true);

	// Poll for the new mail (the original signup mail might also be present)
	const deadline = Date.now() + 10_000;
	while (Date.now() < deadline) {
		const after = await mailpitCount(UNVERIFIED_EMAIL);
		if (after > before) return;
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Resend verification did not produce a new email within 10s`);
});
