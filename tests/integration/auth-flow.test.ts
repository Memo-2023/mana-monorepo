/**
 * End-to-end auth flow integration test.
 *
 * Spins up nothing on its own — assumes the docker-compose.test.yml stack
 * is already running. Run via `./scripts/run-integration-tests.sh` which
 * brings up the stack, applies the encryption-vault SQL migrations, runs
 * this test, then tears the stack down.
 *
 * What this test covers, in order:
 *
 *   1. POST /api/v1/auth/register                          → user created
 *   2. mana-auth → mana-notify → mailpit                   → email arrives
 *   3. Extract verify URL from email body
 *   4. GET <verify URL>                                    → email_verified
 *   5. POST /api/v1/auth/login                             → JWT minted
 *   6. POST /api/v1/auth/validate(JWT)                     → claims valid
 *   7. GET  /api/v1/me/data                                → user summary
 *   8. POST /api/v1/me/encryption-vault/init               → master key
 *   9. GET  /api/v1/me/encryption-vault/key                → unwrap roundtrip
 *  10. POST /api/v1/auth/logout                            → success
 *  11. (cleanup) DELETE the test user from postgres
 *
 * Every regression we hit on 2026-04-08 would have been caught here:
 *   - missing nanoid dep                → step 1 → 500
 *   - missing MANA_AUTH_KEK             → mana-auth never starts
 *   - missing encryption_vaults table   → step 8 → 500
 *   - wrong cookie name in /login       → step 5 → no accessToken
 *   - mana-notify SMTP auth fails       → step 2 → mailpit times out
 */

import { test, expect, beforeAll, afterAll } from 'bun:test';

const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3091';
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8026';

// Postgres connection (for the cleanup step). Reads the env that
// run-integration-tests.sh sets, falls back to the test stack defaults.
const PG_DSN =
	process.env.TEST_DATABASE_URL ?? 'postgresql://mana:testpassword@localhost:5443/mana_platform';

// Generated per test run so reruns don't collide.
const TEST_EMAIL = `auth-flow-${Date.now()}@manatest.local`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Auth Flow';

let createdUserId: string | null = null;

// ─── Tiny helpers ────────────────────────────────────────────────────

async function postJson<T = unknown>(path: string, body: unknown, headers?: HeadersInit) {
	const res = await fetch(`${AUTH_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(body),
	});
	const json = (await res.json().catch(() => ({}))) as T;
	return { status: res.status, json };
}

async function getJson<T = unknown>(url: string, headers?: HeadersInit) {
	const res = await fetch(url, { headers });
	const json = (await res.json().catch(() => ({}))) as T;
	return { status: res.status, json };
}

async function waitForMail(to: string, timeoutMs = 15000): Promise<{ html: string; text: string }> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const list = await fetch(
			`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`
		);
		if (list.ok) {
			const data = (await list.json()) as { messages?: Array<{ ID: string }> };
			if (data.messages && data.messages.length > 0) {
				const id = data.messages[0].ID;
				const full = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
				if (full.ok) {
					const msg = (await full.json()) as { HTML?: string; Text?: string };
					return { html: msg.HTML ?? '', text: msg.Text ?? '' };
				}
			}
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`No email to ${to} arrived within ${timeoutMs}ms`);
}

function extractVerifyUrl(html: string): string {
	// Better Auth's verify URL is /api/auth/verify-email?token=...&callbackURL=...
	// We allow either http://mana-auth:3001 or http://localhost:3091 since the
	// test runs against the host but mana-auth's BASE_URL might be either.
	const match = html.match(/https?:\/\/[^\s"'<>]+\/api\/auth\/verify-email\?[^\s"'<>]+/);
	if (!match) throw new Error(`No verify URL found in email body: ${html.slice(0, 200)}`);
	return match[0];
}

async function pgExec(sql: string): Promise<string> {
	// Shell out to docker exec rather than pulling in a postgres client lib —
	// the test container is the only place this runs and it has docker.
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

// ─── Cleanup at the end so failed runs don't leak ────────────────────

afterAll(async () => {
	if (!createdUserId) return;
	try {
		await pgExec(
			`DELETE FROM auth.encryption_vault_audit WHERE user_id = '${createdUserId}';
			 DELETE FROM auth.encryption_vaults WHERE user_id = '${createdUserId}';
			 DELETE FROM auth.users WHERE id = '${createdUserId}';`
		);
	} catch (err) {
		console.warn('cleanup failed:', err);
	}
});

// ─── The test ────────────────────────────────────────────────────────

test('full register → verify → login → vault → logout flow', async () => {
	// 1. Register
	const reg = await postJson<{ user?: { id: string } }>('/api/v1/auth/register', {
		email: TEST_EMAIL,
		password: TEST_PASSWORD,
		name: TEST_NAME,
	});
	expect(reg.status).toBe(200);
	expect(reg.json.user?.id).toBeTruthy();
	createdUserId = reg.json.user!.id;

	// 2. Wait for the verification email to land in mailpit
	const mail = await waitForMail(TEST_EMAIL);
	expect(mail.html.length).toBeGreaterThan(0);

	// 3. Extract the verify URL
	const verifyUrl = extractVerifyUrl(mail.html);

	// 4. Hit the verify URL. Better Auth issues a 302 redirect on success.
	//    Use manual redirect handling so we can assert the redirect itself.
	//
	//    Sometimes Better Auth's verify URL points at the internal docker
	//    hostname `http://mana-auth:3001/...`. Rewrite that to the host-bound
	//    port so we can actually reach it from outside the docker network.
	const reachableVerifyUrl = verifyUrl.replace('http://mana-auth:3001', AUTH_URL);
	const verifyRes = await fetch(reachableVerifyUrl, { redirect: 'manual' });
	expect([200, 302, 303]).toContain(verifyRes.status);

	// Belt-and-suspenders: confirm the DB row actually flipped.
	const verified = await pgExec(
		`SELECT email_verified FROM auth.users WHERE id = '${createdUserId}';`
	);
	expect(verified).toBe('t');

	// 5. Login. Expect accessToken (the JWT) and refreshToken (the session token).
	const login = await postJson<{
		user?: { id: string };
		accessToken?: string;
		refreshToken?: string;
	}>('/api/v1/auth/login', {
		email: TEST_EMAIL,
		password: TEST_PASSWORD,
	});
	expect(login.status).toBe(200);
	expect(login.json.user?.id).toBe(createdUserId);
	expect(login.json.accessToken).toBeTruthy();
	expect(login.json.accessToken!.split('.').length).toBe(3); // JWT has 3 segments
	expect(login.json.refreshToken).toBeTruthy();
	const jwt = login.json.accessToken!;

	// 6. Validate the JWT against the same service that minted it
	const validate = await postJson<{ valid: boolean; payload?: { sub: string; email: string } }>(
		'/api/v1/auth/validate',
		{ token: jwt }
	);
	expect(validate.status).toBe(200);
	expect(validate.json.valid).toBe(true);
	expect(validate.json.payload?.sub).toBe(createdUserId);
	expect(validate.json.payload?.email).toBe(TEST_EMAIL);

	// 7. /me/data round-trip — exercises JWT auth middleware end-to-end
	const me = await getJson<{ user?: { id: string; email: string } }>(`${AUTH_URL}/api/v1/me/data`, {
		Authorization: `Bearer ${jwt}`,
	});
	expect(me.status).toBe(200);
	expect(me.json.user?.id).toBe(createdUserId);

	// 8. Encryption vault init — exercises nanoid + MANA_AUTH_KEK + the
	//    auth.encryption_vaults / auth.encryption_vault_audit tables
	const vaultInit = await postJson<{ masterKey?: string; kekId?: string; formatVersion?: number }>(
		'/api/v1/me/encryption-vault/init',
		{},
		{ Authorization: `Bearer ${jwt}` }
	);
	expect(vaultInit.status).toBe(200);
	expect(vaultInit.json.masterKey).toBeTruthy();
	expect(vaultInit.json.formatVersion).toBe(1);
	expect(vaultInit.json.kekId).toBeTruthy();
	const mintedKey = vaultInit.json.masterKey!;

	// 9. Vault key retrieval — should return the same master key
	const vaultKey = await getJson<{ masterKey?: string }>(
		`${AUTH_URL}/api/v1/me/encryption-vault/key`,
		{ Authorization: `Bearer ${jwt}` }
	);
	expect(vaultKey.status).toBe(200);
	expect(vaultKey.json.masterKey).toBe(mintedKey);

	// 10. Logout
	const logout = await postJson<{ success?: boolean }>(
		'/api/v1/auth/logout',
		{},
		{ Authorization: `Bearer ${jwt}` }
	);
	expect(logout.status).toBe(200);
	expect(logout.json.success).toBe(true);
});
