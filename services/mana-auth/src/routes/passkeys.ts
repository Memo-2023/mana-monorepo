/**
 * Passkey routes (WebAuthn).
 *
 * Thin wrappers around Better Auth's `@better-auth/passkey` plugin
 * endpoints (mounted internally at /api/auth/passkey/*). The wrappers
 * add:
 *   - Security-event logging (PASSKEY_REGISTER / PASSKEY_LOGIN_*)
 *   - JWT minting on successful authentication (mirrors /login)
 *   - Rate-limit accounting via a separate per-credential bucket
 *     so passkey failures don't trip the email/password lockout
 *   - Uniform error envelope via the auth-errors classifier
 *
 * Public read: GET /capability. Authenticated: everything else.
 *
 * The handlers that proxy to native endpoints use Better Auth's
 * `auth.handler` (fetch-based) rather than the `auth.api.*` SDK so
 * we can capture Set-Cookie headers on authenticate/verify and hand
 * the cookie to /api/auth/token for the JWT mint. Same pattern as
 * the /login wrapper.
 *
 * P2.3 lands capability-probe + the /register & /authenticate/options
 * pass-throughs so the client can gate itself. P2.4 fills in verify
 * + list + delete + rename with the full security logging treatment.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import {
	AuthErrorCode,
	classify,
	classifyFromError,
	classifyFromResponse,
	respondWithError,
	type AuthErrorDeps,
} from '../lib/auth-errors';
import type { BetterAuthInstance, BetterAuthWebAuthnOptions } from '../auth/better-auth.config';
import type { SecurityEventsService, AccountLockoutService } from '../services/security';
import type { PasskeyRateLimitService } from '../services/passkey-rate-limit';
import type { Config } from '../config';

/**
 * Response shape for the capability probe. Documented here so the
 * client type in `@mana/shared-auth` can mirror it without a
 * runtime dependency on this file.
 */
export interface PasskeyCapability {
	enabled: boolean;
	conditionalUIAvailable: boolean;
	rpId: string | null;
}

export function createPasskeyRoutes(
	auth: BetterAuthInstance,
	config: Config,
	webauthn: BetterAuthWebAuthnOptions,
	security: SecurityEventsService,
	lockout: AccountLockoutService,
	rateLimit: PasskeyRateLimitService
) {
	const app = new Hono();
	const errDeps: AuthErrorDeps = { security, lockout };

	// ─── Capability probe ───────────────────────────────────
	// Called by the client once per session (cached) before it
	// renders any passkey UI. Public (no auth) — the login page
	// needs it before the user is known.
	//
	// `enabled: true` here simply means the plugin is wired up.
	// The browser still has to check `window.PublicKeyCredential`
	// and `isConditionalMediationAvailable()` — we surface the
	// server side of the gate only.
	app.get('/capability', (c) => {
		const body: PasskeyCapability = {
			enabled: true,
			conditionalUIAvailable: true,
			rpId: webauthn.rpId,
		};
		return c.json(body);
	});

	// ─── Registration options ───────────────────────────────
	// Called from /settings/security when the user clicks
	// "Add passkey". Requires auth (Better Auth enforces it on
	// /api/auth/passkey/generate-register-options).
	app.post('/register/options', async (c) => {
		return proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/generate-register-options',
			upstreamMethod: 'POST',
			endpoint: 'POST /passkeys/register/options',
			errDeps,
		});
	});

	// ─── Registration verification ──────────────────────────
	app.post('/register/verify', async (c) => {
		const res = await proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/verify-registration',
			upstreamMethod: 'POST',
			endpoint: 'POST /passkeys/register/verify',
			errDeps,
		});
		if (res.status === 200) {
			void security.logEvent({
				eventType: 'PASSKEY_REGISTERED',
				ipAddress: c.req.header('x-forwarded-for') || 'unknown',
			});
		}
		return res;
	});

	// ─── Authentication options ─────────────────────────────
	// Unauthenticated — the browser needs a challenge before the
	// user has signed in. Better Auth's native endpoint is GET
	// for this one, but we expose POST for API symmetry with the
	// rest of the passkey flow (client already posts an empty
	// body).
	//
	// Rate-limited per IP: this is the primary target for a DoS /
	// enumeration attack because it returns a fresh challenge +
	// the RP ID with no auth required.
	app.post('/authenticate/options', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		const gate = rateLimit.checkOptions(ip);
		if (!gate.allowed) {
			return respondWithError(
				c,
				classify(AuthErrorCode.RATE_LIMITED, { retryAfterSec: gate.retryAfterSec }),
				{ endpoint: 'POST /passkeys/authenticate/options', ipAddress: ip },
				errDeps
			);
		}
		return proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/generate-authenticate-options',
			upstreamMethod: 'GET',
			endpoint: 'POST /passkeys/authenticate/options',
			errDeps,
		});
	});

	// ─── Authentication verification + JWT mint ─────────────
	// Mirrors /login's pattern: call the native handler, capture
	// Set-Cookie, exchange the session cookie for a JWT via
	// /api/auth/token.
	//
	// Rate-limited per credentialID: too many failed verifies for
	// the same credential lock that credential out for 5 min (does
	// NOT touch the password lockout counter — different factor).
	app.post('/authenticate/verify', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';

		// Clone the body before the upstream read so we can extract
		// credentialID for rate-limit bookkeeping without double-
		// consuming the stream. The client sends Better-Auth's shape
		// `{ response: { id: '<base64url>', ... } }` — see
		// `verifyPasskeyAuthenticationBodySchema` in the upstream
		// @better-auth/passkey plugin. Falls back to a flat `{ id }`
		// body for any direct-to-mana-auth caller (legacy harness).
		let credentialId: string | null = null;
		let bodyText: string | null = null;
		try {
			bodyText = await c.req.text();
			const parsed = JSON.parse(bodyText);
			credentialId = parsed?.response?.id ?? parsed?.id ?? null;
		} catch {
			// Body malformed — let the upstream handler return a real
			// validation error. No rate-limit bump because we don't
			// have a credentialID.
		}

		if (credentialId) {
			const gate = rateLimit.checkVerify(credentialId);
			if (!gate.allowed) {
				return respondWithError(
					c,
					classify(AuthErrorCode.RATE_LIMITED, { retryAfterSec: gate.retryAfterSec }),
					{ endpoint: 'POST /passkeys/authenticate/verify', ipAddress: ip },
					errDeps
				);
			}
		}

		let signInResponse: Response;
		try {
			signInResponse = await auth.handler(
				new Request(new URL('/api/auth/passkey/verify-authentication', config.baseUrl), {
					method: 'POST',
					headers: c.req.raw.headers,
					body: bodyText ?? undefined,
				})
			);
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: 'POST /passkeys/authenticate/verify', ipAddress: ip },
				errDeps
			);
		}

		if (!signInResponse.ok) {
			if (credentialId) {
				rateLimit.recordVerifyFailure(credentialId);
			}
			void security.logEvent({
				eventType: 'PASSKEY_LOGIN_FAILURE',
				ipAddress: ip,
			});
			const classified = await classifyFromResponse(signInResponse);
			// Promote generic INVALID_CREDENTIALS from the passkey path
			// to the more specific PASSKEY_VERIFICATION_FAILED so the UI
			// can show "passkey didn't match" instead of "wrong password".
			const promoted =
				classified.code === AuthErrorCode.INVALID_CREDENTIALS
					? classify(AuthErrorCode.PASSKEY_VERIFICATION_FAILED, { cause: classified.cause })
					: classified;
			return respondWithError(
				c,
				promoted,
				{ endpoint: 'POST /passkeys/authenticate/verify', ipAddress: ip },
				errDeps
			);
		}

		const response = (await signInResponse.json()) as {
			user?: { id: string };
			token?: string;
		};

		if (response?.user?.id) {
			void security.logEvent({
				userId: response.user.id,
				eventType: 'PASSKEY_LOGIN_SUCCESS',
				ipAddress: ip,
			});
			if (credentialId) {
				// Reset the per-credential failure counter so a user
				// who mistyped/cancelled a few times doesn't stay
				// penalised after they succeed.
				rateLimit.clearVerifySuccess(credentialId);
			}
		}

		// Exchange the signed session cookie for a JWT — same flow as
		// /login lines 227ff.
		const setCookie = signInResponse.headers.get('set-cookie');
		if (setCookie) {
			const tokenResponse = await auth.handler(
				new Request(new URL('/api/auth/token', config.baseUrl), {
					method: 'GET',
					headers: new Headers({ cookie: setCookie }),
				})
			);
			if (tokenResponse.ok) {
				const tokenData = (await tokenResponse.json()) as { token: string };
				return c.json({
					...response,
					accessToken: tokenData.token,
					refreshToken: response.token,
				});
			}
		}

		return c.json(response);
	});

	// ─── List user's passkeys ───────────────────────────────
	app.get('/', async (c) => {
		return proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/list-user-passkeys',
			upstreamMethod: 'GET',
			endpoint: 'GET /passkeys',
			errDeps,
		});
	});

	// ─── Delete passkey ─────────────────────────────────────
	app.delete('/:id', async (c) => {
		const id = c.req.param('id');
		const res = await proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/delete-passkey',
			upstreamMethod: 'POST',
			body: JSON.stringify({ id }),
			endpoint: 'DELETE /passkeys/:id',
			errDeps,
		});
		if (res.status === 200) {
			void security.logEvent({
				eventType: 'PASSKEY_DELETED',
				ipAddress: c.req.header('x-forwarded-for') || 'unknown',
				metadata: { passkeyId: id },
			});
		}
		return res;
	});

	// ─── Rename passkey ─────────────────────────────────────
	app.patch('/:id', async (c) => {
		const id = c.req.param('id');
		let body: { name?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: 'PATCH /passkeys/:id', ipAddress: c.req.header('x-forwarded-for') },
				errDeps
			);
		}
		const res = await proxyToBetterAuth({
			c,
			auth,
			config,
			upstreamPath: '/api/auth/passkey/update-passkey',
			upstreamMethod: 'POST',
			body: JSON.stringify({ id, name: body.name }),
			endpoint: 'PATCH /passkeys/:id',
			errDeps,
		});
		if (res.status === 200) {
			void security.logEvent({
				eventType: 'PASSKEY_RENAMED',
				ipAddress: c.req.header('x-forwarded-for') || 'unknown',
				metadata: { passkeyId: id },
			});
		}
		return res;
	});

	return app;
}

// ─── Helper: proxy a request to Better Auth's handler ─────
//
// Centralises the "forward incoming headers + body, classify any
// upstream error" pattern so each passkey endpoint stays a
// three-liner.

interface ProxyOpts {
	c: Context;
	auth: BetterAuthInstance;
	config: Config;
	upstreamPath: string;
	upstreamMethod: 'GET' | 'POST';
	body?: string;
	endpoint: string;
	errDeps: AuthErrorDeps;
}

async function proxyToBetterAuth(opts: ProxyOpts): Promise<Response> {
	const { c, auth, config, upstreamPath, upstreamMethod, body, endpoint, errDeps } = opts;
	const ip = c.req.header('x-forwarded-for') || 'unknown';
	try {
		const init: RequestInit = {
			method: upstreamMethod,
			headers: c.req.raw.headers,
		};
		if (upstreamMethod === 'POST') {
			init.body = body ?? c.req.raw.body;
			// @ts-expect-error duplex is required for streaming bodies
			init.duplex = 'half';
		}
		const res = await auth.handler(new Request(new URL(upstreamPath, config.baseUrl), init));
		if (!res.ok) {
			return respondWithError(
				c,
				await classifyFromResponse(res),
				{ endpoint, ipAddress: ip },
				errDeps
			);
		}
		return res;
	} catch (error) {
		return respondWithError(c, classifyFromError(error), { endpoint, ipAddress: ip }, errDeps);
	}
}
