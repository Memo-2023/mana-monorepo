/**
 * Auth error classification + response shaper.
 *
 * Problem this solves: every /login, /register etc. wrapper around
 * Better Auth's native handler used to map every non-2xx upstream
 * response onto `401 Invalid credentials`, with no log. A missing DB
 * column, a space-create hook crash, a transient 5xx, and an actually
 * wrong password all looked identical from the client. When debugging
 * the onboarding_completed_at schema drift, that swallow cost ~30 min
 * before the real error surfaced via a one-off reproducer script.
 *
 * The classifier turns an unknown error (APIError from Better Auth,
 * PostgresError, Zod, fetch failure, Response, bare Error) into a
 * machine-readable `{code, status, message, …}` envelope. `respond`
 * writes the response, logs at the right level, fires the right
 * security event, and — critically — only increments the password
 * lockout counter for *credential* failures, so a DB outage does not
 * lock every user out.
 */

import type { Context } from 'hono';
import { logger } from '@mana/shared-hono';

// ─── Error codes ──────────────────────────────────────────────

/**
 * Canonical error codes the client switches on. Stable string values
 * so the web/mobile UIs can i18n against them without carrying the
 * server taxonomy by number.
 */
export enum AuthErrorCode {
	// Credential flows
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
	EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
	WEAK_PASSWORD = 'WEAK_PASSWORD',
	// Throttling
	ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
	SIGNUP_LIMIT_REACHED = 'SIGNUP_LIMIT_REACHED',
	RATE_LIMITED = 'RATE_LIMITED',
	// Tokens
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
	TOKEN_INVALID = 'TOKEN_INVALID',
	// Two-factor
	TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
	TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
	// Passkeys
	PASSKEY_NOT_ENABLED = 'PASSKEY_NOT_ENABLED',
	PASSKEY_CANCELLED = 'PASSKEY_CANCELLED',
	PASSKEY_VERIFICATION_FAILED = 'PASSKEY_VERIFICATION_FAILED',
	// Input
	VALIDATION = 'VALIDATION',
	// Generic
	UNAUTHORIZED = 'UNAUTHORIZED',
	NOT_FOUND = 'NOT_FOUND',
	// Infra (do NOT count toward lockout)
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	INTERNAL = 'INTERNAL',
}

/** Log level the classifier recommends for this category of error. */
type LogLevel = 'info' | 'warn' | 'error';

/**
 * Classified error envelope. `cause` and `stack` are for server-side
 * logging only — they never leave the server (see `serializeResponseBody`).
 */
export interface ClassifiedError {
	code: AuthErrorCode;
	status: number;
	message: string;
	retryAfterSec?: number;
	/** Original error, preserved for logs. Never serialised to client. */
	cause?: unknown;
	logLevel: LogLevel;
	/** Security event to fire, if any. `null` = no event. */
	securityEventType: string | null;
	/** Whether `lockout.recordAttempt(false)` should fire for this error. */
	countsTowardLockout: boolean;
}

// ─── Defaults per code ────────────────────────────────────────

type Defaults = Pick<
	ClassifiedError,
	'status' | 'message' | 'logLevel' | 'securityEventType' | 'countsTowardLockout'
>;

const DEFAULTS: Record<AuthErrorCode, Defaults> = {
	[AuthErrorCode.INVALID_CREDENTIALS]: {
		status: 401,
		message: 'Invalid credentials',
		logLevel: 'info',
		securityEventType: 'LOGIN_FAILURE',
		countsTowardLockout: true,
	},
	[AuthErrorCode.EMAIL_NOT_VERIFIED]: {
		status: 403,
		message: 'Email not verified',
		logLevel: 'info',
		securityEventType: 'LOGIN_FAILURE',
		countsTowardLockout: false,
	},
	[AuthErrorCode.EMAIL_ALREADY_REGISTERED]: {
		status: 409,
		message: 'Email already registered',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.WEAK_PASSWORD]: {
		status: 400,
		message: 'Password too weak',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.ACCOUNT_LOCKED]: {
		status: 429,
		message: 'Account temporarily locked',
		logLevel: 'warn',
		securityEventType: 'ACCOUNT_LOCKED',
		countsTowardLockout: false,
	},
	[AuthErrorCode.SIGNUP_LIMIT_REACHED]: {
		status: 429,
		message: 'Signup limit reached',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.RATE_LIMITED]: {
		status: 429,
		message: 'Too many requests',
		logLevel: 'warn',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.TOKEN_EXPIRED]: {
		status: 401,
		message: 'Link expired',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.TOKEN_INVALID]: {
		status: 400,
		message: 'Invalid link',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.TWO_FACTOR_REQUIRED]: {
		status: 401,
		message: 'Two-factor authentication required',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.TWO_FACTOR_FAILED]: {
		status: 401,
		message: 'Invalid two-factor code',
		logLevel: 'info',
		securityEventType: 'LOGIN_FAILURE',
		countsTowardLockout: true,
	},
	[AuthErrorCode.PASSKEY_NOT_ENABLED]: {
		status: 404,
		message: 'Passkey authentication is not enabled',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.PASSKEY_CANCELLED]: {
		status: 400,
		message: 'Passkey authentication was cancelled',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.PASSKEY_VERIFICATION_FAILED]: {
		status: 401,
		message: 'Passkey verification failed',
		logLevel: 'warn',
		securityEventType: 'PASSKEY_LOGIN_FAILURE',
		countsTowardLockout: false,
	},
	[AuthErrorCode.VALIDATION]: {
		status: 400,
		message: 'Invalid request',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.UNAUTHORIZED]: {
		status: 401,
		message: 'Unauthorized',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.NOT_FOUND]: {
		status: 404,
		message: 'Not found',
		logLevel: 'info',
		securityEventType: null,
		countsTowardLockout: false,
	},
	[AuthErrorCode.SERVICE_UNAVAILABLE]: {
		status: 503,
		message: 'Service temporarily unavailable',
		logLevel: 'error',
		securityEventType: 'SERVICE_ERROR',
		countsTowardLockout: false,
	},
	[AuthErrorCode.INTERNAL]: {
		status: 500,
		message: 'Unexpected server error',
		logLevel: 'error',
		securityEventType: 'SERVICE_ERROR',
		countsTowardLockout: false,
	},
};

/** Build a ClassifiedError from a code + optional overrides. */
export function classify(
	code: AuthErrorCode,
	overrides?: Partial<Pick<ClassifiedError, 'message' | 'retryAfterSec' | 'cause'>>
): ClassifiedError {
	return { code, ...DEFAULTS[code], ...overrides };
}

// ─── Classifier ───────────────────────────────────────────────

/**
 * Parse a Better Auth error-body code string (the `code` field in the
 * JSON body it returns from /api/auth/*) and map it onto our taxonomy.
 * Unknown codes fall through to null so the caller can fall back to
 * status-based classification.
 */
function codeFromBetterAuthBody(code: string | undefined): AuthErrorCode | null {
	if (!code) return null;
	switch (code) {
		case 'INVALID_EMAIL_OR_PASSWORD':
		case 'INVALID_CREDENTIALS':
		case 'INVALID_PASSWORD':
			return AuthErrorCode.INVALID_CREDENTIALS;
		case 'EMAIL_NOT_VERIFIED':
			return AuthErrorCode.EMAIL_NOT_VERIFIED;
		case 'USER_ALREADY_EXISTS':
		case 'EMAIL_ALREADY_EXISTS':
			return AuthErrorCode.EMAIL_ALREADY_REGISTERED;
		case 'PASSWORD_TOO_SHORT':
		case 'PASSWORD_TOO_LONG':
		case 'WEAK_PASSWORD':
			return AuthErrorCode.WEAK_PASSWORD;
		case 'INVALID_TOKEN':
			return AuthErrorCode.TOKEN_INVALID;
		case 'TOKEN_EXPIRED':
			return AuthErrorCode.TOKEN_EXPIRED;
		case 'VALIDATION_ERROR':
			return AuthErrorCode.VALIDATION;
		default:
			return null;
	}
}

/**
 * Classify a fetch Response from Better Auth's native handler.
 *
 * Reads the body once (clones so the caller can still introspect the
 * original). Missing / non-JSON bodies fall back to status-based
 * classification.
 */
export async function classifyFromResponse(res: Response): Promise<ClassifiedError> {
	// Clone before consuming — the /login wrapper reads headers from the
	// original for set-cookie capture in the success path, so we can't
	// drain the caller's response.
	let body: { code?: string; message?: string } = {};
	try {
		body = (await res.clone().json()) as typeof body;
	} catch {
		// Non-JSON response (Better Auth returns empty body on some 5xx)
		body = {};
	}

	const mapped = codeFromBetterAuthBody(body.code);
	if (mapped) {
		return classify(mapped, body.message ? { message: body.message } : undefined);
	}

	return classifyFromStatus(res.status, body.message);
}

/**
 * Classify a Better Auth APIError thrown by `auth.api.*` calls.
 *
 * APIError has `{status: string | number, statusCode: number, body: {message?, code?}}`.
 * We look at `body.code` first (most specific), then fall back to the
 * string status enum ("UNPROCESSABLE_ENTITY" etc.), then the numeric
 * statusCode.
 */
function classifyFromApiError(err: {
	status: string | number;
	statusCode: number;
	body?: { message?: string; code?: string };
}): ClassifiedError {
	const mapped = codeFromBetterAuthBody(err.body?.code);
	if (mapped) {
		return classify(
			mapped,
			err.body?.message ? { message: err.body.message, cause: err } : { cause: err }
		);
	}

	// Better Auth uses UNPROCESSABLE_ENTITY for "user already exists" in
	// some paths.
	if (err.status === 'UNPROCESSABLE_ENTITY' && err.body?.message?.toLowerCase().includes('exist')) {
		return classify(AuthErrorCode.EMAIL_ALREADY_REGISTERED, { cause: err });
	}

	if (err.status === 'FORBIDDEN') {
		return classify(AuthErrorCode.EMAIL_NOT_VERIFIED, { cause: err });
	}

	return classifyFromStatus(err.statusCode, err.body?.message, err);
}

/** Fallback classifier when only a status code is available. */
function classifyFromStatus(status: number, message?: string, cause?: unknown): ClassifiedError {
	if (status === 400) return classify(AuthErrorCode.VALIDATION, { message, cause });
	if (status === 401) return classify(AuthErrorCode.INVALID_CREDENTIALS, { message, cause });
	if (status === 403) return classify(AuthErrorCode.EMAIL_NOT_VERIFIED, { message, cause });
	if (status === 404) return classify(AuthErrorCode.NOT_FOUND, { message, cause });
	if (status === 409) return classify(AuthErrorCode.EMAIL_ALREADY_REGISTERED, { message, cause });
	if (status === 422) return classify(AuthErrorCode.VALIDATION, { message, cause });
	if (status === 429) return classify(AuthErrorCode.RATE_LIMITED, { message, cause });
	if (status >= 500 && status < 600) {
		return classify(AuthErrorCode.SERVICE_UNAVAILABLE, { cause });
	}
	return classify(AuthErrorCode.INTERNAL, { cause });
}

/**
 * Classify an unknown thrown error.
 *
 * Recognises (in order): Better Auth APIError → Postgres errors →
 * Zod-ish validation errors → network errors → bare Error → unknown.
 */
export function classifyFromError(err: unknown): ClassifiedError {
	// Better Auth APIError: check duck-type because the class lives
	// inside `better-call` (a nested dep) and the instanceof doesn't
	// survive re-bundling across workspace boundaries in all cases.
	if (
		err &&
		typeof err === 'object' &&
		(err as { name?: string }).name === 'APIError' &&
		'statusCode' in err
	) {
		return classifyFromApiError(err as never);
	}

	// Postgres error — `postgres` (postgres-js) and `pg` both expose a
	// `code` string (SQLSTATE). 23505 = unique violation. 42703 = undefined
	// column (the onboarding_completed_at bug). 08* = connection issues.
	if (
		err &&
		typeof err === 'object' &&
		'code' in err &&
		typeof (err as { code?: unknown }).code === 'string' &&
		'severity' in err
	) {
		const pgCode = (err as { code: string }).code;
		if (pgCode === '23505') {
			return classify(AuthErrorCode.EMAIL_ALREADY_REGISTERED, { cause: err });
		}
		// Everything else — schema drift (42703, 42P01), conn refused (08*),
		// timeout, etc. — is infrastructure, not user input.
		return classify(AuthErrorCode.SERVICE_UNAVAILABLE, { cause: err });
	}

	// Zod error — `.issues` is the canonical discriminator.
	if (err && typeof err === 'object' && Array.isArray((err as { issues?: unknown }).issues)) {
		const issues = (err as { issues: { path?: (string | number)[]; message?: string }[] }).issues;
		const first = issues[0];
		const path = first?.path?.join('.') || '';
		const msg = first?.message || 'Invalid input';
		return classify(AuthErrorCode.VALIDATION, {
			message: path ? `${path}: ${msg}` : msg,
			cause: err,
		});
	}

	// Network errors: fetch() in Bun/Node throws TypeError with cause,
	// AbortError, or Error with code ECONNREFUSED/ETIMEDOUT.
	if (err instanceof Error) {
		const msg = err.message.toLowerCase();
		const code = (err as Error & { code?: string }).code || '';
		if (
			err.name === 'AbortError' ||
			msg.includes('fetch failed') ||
			msg.includes('timeout') ||
			code === 'ECONNREFUSED' ||
			code === 'ETIMEDOUT' ||
			code === 'ENOTFOUND'
		) {
			return classify(AuthErrorCode.SERVICE_UNAVAILABLE, { cause: err });
		}
		return classify(AuthErrorCode.INTERNAL, { cause: err });
	}

	return classify(AuthErrorCode.INTERNAL, { cause: err });
}

// ─── Response shaper ──────────────────────────────────────────

/**
 * Shape of the JSON body returned to clients. Never carries stack /
 * cause / internal details.
 */
export interface AuthErrorResponseBody {
	error: AuthErrorCode;
	message: string;
	status: number;
	retryAfterSec?: number;
}

/**
 * Context passed to `respondWithError` so it can tag logs + security
 * events. All fields optional — the handler is responsible for filling
 * in what it knows.
 */
export interface AuthErrorContext {
	email?: string;
	userId?: string;
	ipAddress?: string;
	userAgent?: string;
	endpoint: string;
	/** Additional metadata to include in the log entry (not security event). */
	extra?: Record<string, unknown>;
}

/**
 * Side-effect hooks the response shaper needs. Passed as deps so the
 * shaper stays unit-testable without instantiating the whole service
 * graph.
 */
export interface AuthErrorDeps {
	security: {
		logEvent(params: {
			userId?: string;
			eventType: string;
			ipAddress?: string;
			userAgent?: string;
			metadata?: Record<string, unknown>;
		}): Promise<void> | void;
	};
	lockout: {
		recordAttempt(email: string, successful: boolean, ipAddress?: string): Promise<void> | void;
	};
}

/**
 * Write the error response: JSON body + HTTP status + structured log +
 * (optional) security event + (optional) lockout bump.
 *
 * Returns the Hono Response so the caller can `return respondWithError(...)`.
 */
export function respondWithError(
	c: Context,
	classified: ClassifiedError,
	ctx: AuthErrorContext,
	deps: AuthErrorDeps
): Response {
	// Log first so the stack trace lands before any async side effects
	// that might throw again.
	const logEntry: Record<string, unknown> = {
		endpoint: ctx.endpoint,
		code: classified.code,
		status: classified.status,
		email: ctx.email,
		userId: ctx.userId,
		ipAddress: ctx.ipAddress,
		...ctx.extra,
	};
	if (classified.cause !== undefined) {
		logEntry.cause = serializeCauseForLog(classified.cause);
	}
	logger[classified.logLevel]('auth error', logEntry);

	// Security event (fire-and-forget; the service itself never throws).
	if (classified.securityEventType) {
		void deps.security.logEvent({
			userId: ctx.userId,
			eventType: classified.securityEventType,
			ipAddress: ctx.ipAddress,
			userAgent: ctx.userAgent,
			metadata: {
				code: classified.code,
				endpoint: ctx.endpoint,
				...(ctx.email ? { email: ctx.email } : {}),
			},
		});
	}

	// Lockout bump: only credential failures count. A DB outage (→
	// SERVICE_UNAVAILABLE) must NOT lock every user out.
	if (classified.countsTowardLockout && ctx.email) {
		void deps.lockout.recordAttempt(ctx.email, false, ctx.ipAddress);
	}

	// Retry-After header for 429s — both informational for humans and
	// respected by `fetch()` callers.
	if (classified.retryAfterSec) {
		c.header('Retry-After', String(classified.retryAfterSec));
	}

	const body: AuthErrorResponseBody = {
		error: classified.code,
		message: classified.message,
		status: classified.status,
	};
	if (classified.retryAfterSec) body.retryAfterSec = classified.retryAfterSec;

	return c.json(body, classified.status as never);
}

/**
 * Serialise an error's `cause` for logging without risking runaway
 * output. Extracts message + stack from Error instances; otherwise
 * shallow-stringifies.
 */
function serializeCauseForLog(cause: unknown): unknown {
	if (cause instanceof Error) {
		return {
			name: cause.name,
			message: cause.message,
			stack: cause.stack,
			// postgres / APIError-shaped extras
			code: (cause as { code?: unknown }).code,
			body: (cause as { body?: unknown }).body,
		};
	}
	return cause;
}
