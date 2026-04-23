/**
 * Unit tests for the auth error classifier + response shaper.
 *
 * Covers every branch of `classifyFromError`, `classifyFromResponse`,
 * and the key invariants of `respondWithError`:
 *   - infra errors (Postgres schema drift, fetch failures, unknown)
 *     must NOT increment the lockout counter
 *   - credential errors (bad password, bad 2FA) must increment it
 *   - security-event type matches the classification
 *   - the response body never leaks the cause/stack
 *
 * No network, no DB — fakes injected for `security.logEvent` and
 * `lockout.recordAttempt`.
 */

import { describe, it, expect } from 'bun:test';
import { Hono } from 'hono';
import {
	AuthErrorCode,
	classify,
	classifyFromError,
	classifyFromResponse,
	respondWithError,
	type AuthErrorDeps,
	type ClassifiedError,
} from './auth-errors';

// ─── Fakes ────────────────────────────────────────────────────

function makeFakeDeps(): {
	deps: AuthErrorDeps;
	securityCalls: Array<Record<string, unknown>>;
	lockoutCalls: Array<{ email: string; successful: boolean; ip?: string }>;
} {
	const securityCalls: Array<Record<string, unknown>> = [];
	const lockoutCalls: Array<{ email: string; successful: boolean; ip?: string }> = [];
	const deps: AuthErrorDeps = {
		security: {
			logEvent: (params) => {
				securityCalls.push(params as Record<string, unknown>);
			},
		},
		lockout: {
			recordAttempt: (email, successful, ip) => {
				lockoutCalls.push({ email, successful, ip });
			},
		},
	};
	return { deps, securityCalls, lockoutCalls };
}

/**
 * Build a throwaway Hono context the shaper can write into. We can't
 * construct a real context directly; round-trip through a tiny app so
 * the response shaper's `c.json(...)` + header calls work identically
 * to production.
 */
async function runShaperInContext(
	classified: ClassifiedError,
	email: string | undefined,
	deps: AuthErrorDeps
): Promise<{ status: number; body: unknown; headers: Headers }> {
	const app = new Hono();
	app.get('/test', (c) =>
		respondWithError(c, classified, { endpoint: '/test', email, ipAddress: '127.0.0.1' }, deps)
	);
	const res = await app.request('/test');
	return {
		status: res.status,
		body: await res.json().catch(() => null),
		headers: res.headers,
	};
}

// ─── classifyFromError ────────────────────────────────────────

describe('classifyFromError', () => {
	describe('Better Auth APIError', () => {
		it('maps body.code INVALID_EMAIL_OR_PASSWORD → INVALID_CREDENTIALS', () => {
			const err = {
				name: 'APIError',
				status: 'UNAUTHORIZED',
				statusCode: 401,
				body: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Nope' },
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
			expect(c.countsTowardLockout).toBe(true);
			expect(c.message).toBe('Nope');
		});

		it('maps body.code USER_ALREADY_EXISTS → EMAIL_ALREADY_REGISTERED', () => {
			const err = {
				name: 'APIError',
				status: 'UNPROCESSABLE_ENTITY',
				statusCode: 422,
				body: { code: 'USER_ALREADY_EXISTS' },
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.EMAIL_ALREADY_REGISTERED);
			expect(c.status).toBe(409);
		});

		it('maps status FORBIDDEN (no code) → EMAIL_NOT_VERIFIED', () => {
			const err = {
				name: 'APIError',
				status: 'FORBIDDEN',
				statusCode: 403,
				body: {},
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED);
		});

		it('maps status UNPROCESSABLE_ENTITY with exists-message → EMAIL_ALREADY_REGISTERED', () => {
			const err = {
				name: 'APIError',
				status: 'UNPROCESSABLE_ENTITY',
				statusCode: 422,
				body: { message: 'User with email already exists' },
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.EMAIL_ALREADY_REGISTERED);
		});

		it('falls back to status when body has no useful code', () => {
			const err = {
				name: 'APIError',
				status: 'INTERNAL_SERVER_ERROR',
				statusCode: 500,
				body: {},
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		});
	});

	describe('Postgres errors', () => {
		it('23505 unique violation → EMAIL_ALREADY_REGISTERED', () => {
			const err = { code: '23505', severity: 'ERROR', message: 'duplicate key' };
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.EMAIL_ALREADY_REGISTERED);
		});

		it('42703 undefined column → SERVICE_UNAVAILABLE', () => {
			// This is the exact shape that caused the onboarding_completed_at
			// incident — the classifier MUST bucket it as infra, not auth.
			const err = {
				code: '42703',
				severity: 'ERROR',
				message: 'column "onboarding_completed_at" does not exist',
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
			expect(c.countsTowardLockout).toBe(false);
			expect(c.logLevel).toBe('error');
		});

		it('08006 connection failure → SERVICE_UNAVAILABLE', () => {
			const err = { code: '08006', severity: 'FATAL', message: 'connection lost' };
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		});
	});

	describe('Zod errors', () => {
		it('issues[0].path + message → VALIDATION with path', () => {
			const err = {
				issues: [{ path: ['email'], message: 'Invalid email' }],
			};
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.VALIDATION);
			expect(c.message).toBe('email: Invalid email');
		});

		it('empty issues → generic VALIDATION', () => {
			const err = { issues: [] };
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.VALIDATION);
		});
	});

	describe('Network errors', () => {
		it('AbortError → SERVICE_UNAVAILABLE', () => {
			const err = new Error('aborted');
			err.name = 'AbortError';
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		});

		it('fetch failed → SERVICE_UNAVAILABLE', () => {
			const err = new Error('fetch failed');
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		});

		it('ECONNREFUSED → SERVICE_UNAVAILABLE', () => {
			const err = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
			const c = classifyFromError(err);
			expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		});
	});

	describe('Unknown / bare errors', () => {
		it('bare Error → INTERNAL', () => {
			const c = classifyFromError(new Error('something broke'));
			expect(c.code).toBe(AuthErrorCode.INTERNAL);
			expect(c.logLevel).toBe('error');
		});

		it('null → INTERNAL', () => {
			const c = classifyFromError(null);
			expect(c.code).toBe(AuthErrorCode.INTERNAL);
		});

		it('string → INTERNAL', () => {
			const c = classifyFromError('wat');
			expect(c.code).toBe(AuthErrorCode.INTERNAL);
		});
	});
});

// ─── classifyFromResponse ─────────────────────────────────────

describe('classifyFromResponse', () => {
	it('401 with {code: INVALID_EMAIL_OR_PASSWORD} → INVALID_CREDENTIALS', async () => {
		const res = new Response(
			JSON.stringify({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Wrong' }),
			{ status: 401, headers: { 'content-type': 'application/json' } }
		);
		const c = await classifyFromResponse(res);
		expect(c.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
		expect(c.message).toBe('Wrong');
	});

	it('403 with {code: EMAIL_NOT_VERIFIED} → EMAIL_NOT_VERIFIED', async () => {
		const res = new Response(JSON.stringify({ code: 'EMAIL_NOT_VERIFIED' }), {
			status: 403,
			headers: { 'content-type': 'application/json' },
		});
		const c = await classifyFromResponse(res);
		expect(c.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED);
	});

	it('500 with empty body → SERVICE_UNAVAILABLE', async () => {
		// The bug case: Better Auth's internal handler crashed on the
		// missing column and returned a 500 with no body. The wrapper
		// must classify this as infra, not bad password.
		const res = new Response('', { status: 500 });
		const c = await classifyFromResponse(res);
		expect(c.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
		expect(c.countsTowardLockout).toBe(false);
	});

	it('401 with non-JSON body → INVALID_CREDENTIALS (fallback)', async () => {
		const res = new Response('nope', { status: 401 });
		const c = await classifyFromResponse(res);
		expect(c.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
	});

	it('does not consume the caller body (clone)', async () => {
		const res = new Response(JSON.stringify({ code: 'X' }), {
			status: 400,
			headers: { 'content-type': 'application/json' },
		});
		await classifyFromResponse(res);
		// Original body should still be readable.
		const body = await res.json();
		expect(body).toEqual({ code: 'X' });
	});
});

// ─── respondWithError ─────────────────────────────────────────

describe('respondWithError', () => {
	it('writes JSON body with {error, message, status}', async () => {
		const { deps } = makeFakeDeps();
		const { status, body } = await runShaperInContext(
			classify(AuthErrorCode.INVALID_CREDENTIALS),
			'user@x.de',
			deps
		);
		expect(status).toBe(401);
		expect(body).toEqual({
			error: 'INVALID_CREDENTIALS',
			message: 'Invalid credentials',
			status: 401,
		});
	});

	it('increments lockout ONLY for credential failures', async () => {
		const { deps, lockoutCalls } = makeFakeDeps();
		await runShaperInContext(classify(AuthErrorCode.INVALID_CREDENTIALS), 'user@x.de', deps);
		expect(lockoutCalls).toHaveLength(1);
		expect(lockoutCalls[0]!.successful).toBe(false);
	});

	it('does NOT increment lockout on SERVICE_UNAVAILABLE', async () => {
		// THE bug this classifier exists to fix: if the DB is down, every
		// login returned 401 AND incremented the counter, so after 5
		// retries the user was locked out of their own account. Infra
		// errors must be invisible to the lockout.
		const { deps, lockoutCalls } = makeFakeDeps();
		await runShaperInContext(classify(AuthErrorCode.SERVICE_UNAVAILABLE), 'user@x.de', deps);
		expect(lockoutCalls).toHaveLength(0);
	});

	it('does NOT increment lockout on EMAIL_NOT_VERIFIED', async () => {
		const { deps, lockoutCalls } = makeFakeDeps();
		await runShaperInContext(classify(AuthErrorCode.EMAIL_NOT_VERIFIED), 'u@x.de', deps);
		expect(lockoutCalls).toHaveLength(0);
	});

	it('fires LOGIN_FAILURE security event for bad credentials', async () => {
		const { deps, securityCalls } = makeFakeDeps();
		await runShaperInContext(classify(AuthErrorCode.INVALID_CREDENTIALS), 'u@x.de', deps);
		expect(securityCalls).toHaveLength(1);
		expect(securityCalls[0]!.eventType).toBe('LOGIN_FAILURE');
	});

	it('fires SERVICE_ERROR security event (not LOGIN_FAILURE) for infra failures', async () => {
		const { deps, securityCalls } = makeFakeDeps();
		await runShaperInContext(classify(AuthErrorCode.SERVICE_UNAVAILABLE), 'u@x.de', deps);
		expect(securityCalls).toHaveLength(1);
		expect(securityCalls[0]!.eventType).toBe('SERVICE_ERROR');
	});

	it('sets Retry-After header for 429s with retryAfterSec', async () => {
		const { deps } = makeFakeDeps();
		const { headers, body } = await runShaperInContext(
			classify(AuthErrorCode.ACCOUNT_LOCKED, { retryAfterSec: 180 }),
			'u@x.de',
			deps
		);
		expect(headers.get('Retry-After')).toBe('180');
		expect((body as { retryAfterSec?: number }).retryAfterSec).toBe(180);
	});

	it('never leaks `cause` into the response body', async () => {
		const { deps } = makeFakeDeps();
		const classified = classify(AuthErrorCode.INTERNAL, {
			cause: new Error('db password was "hunter2" do not leak'),
		});
		const { body } = await runShaperInContext(classified, undefined, deps);
		const s = JSON.stringify(body);
		expect(s).not.toContain('hunter2');
		expect(s).not.toContain('stack');
	});

	it('skips lockout when email is not provided', async () => {
		const { deps, lockoutCalls } = makeFakeDeps();
		// /validate, /refresh, and /session-to-token don't have a user email
		// in scope — the shaper must cope without one rather than crash.
		await runShaperInContext(classify(AuthErrorCode.INVALID_CREDENTIALS), undefined, deps);
		expect(lockoutCalls).toHaveLength(0);
	});
});
