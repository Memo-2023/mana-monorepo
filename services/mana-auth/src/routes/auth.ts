/**
 * Auth routes — Custom endpoints wrapping Better Auth
 *
 * Adds business logic (security events, lockout, credit init)
 * around Better Auth's native sign-in/sign-up.
 */

import { Hono } from 'hono';
import { logger } from '@mana/shared-hono';
import type { AuthUser } from '../middleware/jwt-auth';
import type { BetterAuthInstance } from '../auth/better-auth.config';
import type { SecurityEventsService, AccountLockoutService } from '../services/security';
import type { SignupLimitService } from '../services/signup-limit';
import type { Config } from '../config';
import { sourceAppStore, passwordResetRedirectStore } from '../auth/stores';
import {
	AuthErrorCode,
	classify,
	classifyFromError,
	classifyFromResponse,
	respondWithError,
	type AuthErrorDeps,
} from '../lib/auth-errors';

export function createAuthRoutes(
	auth: BetterAuthInstance,
	config: Config,
	security: SecurityEventsService,
	lockout: AccountLockoutService,
	signupLimit: SignupLimitService
) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// Deps passed to respondWithError. security + lockout are held by
	// reference so later construction order doesn't matter; the shaper
	// only calls these when it writes an error response.
	const errDeps: AuthErrorDeps = { security, lockout };

	// ─── Registration ────────────────────────────────────────

	// ─── Signup Status (public) ─────────────────────────────

	app.get('/signup-status', async (c) => {
		const status = await signupLimit.getStatus();
		return c.json(status);
	});

	app.post('/register', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { email?: string; password?: string; name?: string; sourceAppUrl?: string };
		try {
			body = await c.req.json();
		} catch (err) {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/register', ipAddress: ip },
				errDeps
			);
		}

		// Check daily signup limit
		const limitCheck = await signupLimit.checkLimit();
		if (!limitCheck.allowed) {
			return respondWithError(
				c,
				classify(AuthErrorCode.SIGNUP_LIMIT_REACHED, {
					message: 'Das tägliche Registrierungslimit ist erreicht. Versuche es morgen wieder.',
				}),
				{
					endpoint: '/register',
					ipAddress: ip,
					email: body.email,
					extra: { resetsAt: limitCheck.resetsAt },
				},
				errDeps
			);
		}

		// Store source app URL for email verification redirect
		if (body.sourceAppUrl && body.email) {
			sourceAppStore.set(body.email, body.sourceAppUrl);
		}

		let response;
		try {
			response = await auth.api.signUpEmail({
				body: {
					email: body.email || '',
					password: body.password || '',
					name: body.name || (body.email || '').split('@')[0],
				},
				headers: c.req.raw.headers,
			});
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/register', ipAddress: ip, email: body.email },
				errDeps
			);
		}

		if (response?.user?.id) {
			void security.logEvent({
				userId: response.user.id,
				eventType: 'REGISTER',
				ipAddress: ip,
			});
			// Init credits (fire-and-forget)
			fetch(`${config.manaCreditsUrl}/api/v1/internal/credits/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
				body: JSON.stringify({ userId: response.user.id }),
			}).catch(() => {});
			// Redeem pending gifts
			fetch(`${config.manaCreditsUrl}/api/v1/internal/gifts/redeem-pending`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
				body: JSON.stringify({ userId: response.user.id, email: body.email }),
			}).catch(() => {});
			// Provision mail account (fire-and-forget)
			fetch(`${config.manaMailUrl}/api/v1/internal/mail/on-user-created`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
				body: JSON.stringify({
					userId: response.user.id,
					email: body.email,
					name: body.name || (body.email || '').split('@')[0],
				}),
			}).catch(() => {});
		}

		return c.json(response);
	});

	// ─── Login ───────────────────────────────────────────────

	app.post('/login', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		const userAgent = c.req.header('user-agent') ?? undefined;

		let body: { email?: string; password?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/login', ipAddress: ip, userAgent },
				errDeps
			);
		}

		// Check lockout BEFORE talking to Better Auth — a locked account
		// should not add further upstream load.
		const lockoutStatus = await lockout.checkLockout(body.email || '');
		if (lockoutStatus.locked) {
			return respondWithError(
				c,
				classify(AuthErrorCode.ACCOUNT_LOCKED, {
					retryAfterSec: lockoutStatus.remainingSeconds,
				}),
				{ endpoint: '/login', ipAddress: ip, userAgent, email: body.email },
				errDeps
			);
		}

		// Sign in via Better Auth's HTTP handler so we get back a real
		// Response with Set-Cookie. The auth.api.signInEmail() SDK call
		// only returns the body and we'd lose the signed cookie envelope
		// that /api/auth/token needs to validate the session — the cookie
		// value is `<sessionToken>.<HMAC>`, not just the raw session token,
		// so reconstructing it from the API response doesn't work.
		let signInResponse: Response;
		try {
			signInResponse = await auth.handler(
				new Request(new URL('/api/auth/sign-in/email', config.baseUrl), {
					method: 'POST',
					headers: new Headers({
						'Content-Type': 'application/json',
						// Forward original X-Forwarded-For so Better Auth's rate
						// limiting and our security log see the right IP.
						...(c.req.header('x-forwarded-for')
							? { 'X-Forwarded-For': c.req.header('x-forwarded-for') as string }
							: {}),
					}),
					body: JSON.stringify({ email: body.email, password: body.password }),
				})
			);
		} catch (error) {
			// Upstream threw before even returning a response — Better Auth
			// internals blew up (e.g. the APIError('FORBIDDEN') for
			// unverified emails, or an unhandled DB error like the
			// onboarding_completed_at case). Classifier handles both.
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/login', ipAddress: ip, userAgent, email: body.email },
				errDeps
			);
		}

		if (!signInResponse.ok) {
			return respondWithError(
				c,
				await classifyFromResponse(signInResponse),
				{ endpoint: '/login', ipAddress: ip, userAgent, email: body.email },
				errDeps
			);
		}

		const response = (await signInResponse.json()) as {
			user?: { id: string };
			token?: string;
			redirect?: boolean;
		};

		if (response?.user?.id) {
			void security.logEvent({
				userId: response.user.id,
				eventType: 'LOGIN_SUCCESS',
				ipAddress: ip,
			});
			void lockout.clearAttempts(body.email || '');
		}

		// Capture the signed session cookie that Better Auth set on the
		// sign-in response and forward it verbatim to /api/auth/token to
		// mint a JWT. This is the only path that produces a cookie value
		// with a valid HMAC signature.
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

		// JWT mint failed (or no Set-Cookie came back). Still return the
		// sign-in body so the client at least sees the user object.
		return c.json(response);
	});

	// ─── Session → JWT Token Exchange ───────────────────────
	// Used by SSO (trySSO) and after 2FA verification to get JWT from session cookie

	app.post('/session-to-token', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		try {
			const sessionResponse = await auth.handler(
				new Request(new URL('/api/auth/get-session', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);

			if (!sessionResponse.ok) {
				return respondWithError(
					c,
					classify(AuthErrorCode.UNAUTHORIZED, { message: 'No valid session' }),
					{ endpoint: '/session-to-token', ipAddress: ip },
					errDeps
				);
			}

			const sessionData = await sessionResponse.json();
			if (!sessionData?.session?.token) {
				return respondWithError(
					c,
					classify(AuthErrorCode.UNAUTHORIZED, { message: 'No valid session' }),
					{ endpoint: '/session-to-token', ipAddress: ip },
					errDeps
				);
			}

			const tokenResponse = await auth.handler(
				new Request(new URL('/api/auth/token', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);

			if (!tokenResponse.ok) {
				return respondWithError(
					c,
					await classifyFromResponse(tokenResponse),
					{ endpoint: '/session-to-token', ipAddress: ip, extra: { step: 'mint-jwt' } },
					errDeps
				);
			}

			const tokenData = await tokenResponse.json();
			return c.json({
				accessToken: tokenData.token,
				// Session token serves as refresh mechanism via session cookie
				refreshToken: sessionData.session.token,
			});
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/session-to-token', ipAddress: ip },
				errDeps
			);
		}
	});

	// ─── Token Validation ────────────────────────────────────

	app.post('/validate', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { token?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/validate', ipAddress: ip },
				errDeps
			);
		}

		if (!body.token) {
			// /validate is a lookup; an absent token is a callable "is this
			// JWT valid" query rather than an error. Return a falsey body
			// at 200 to match the pre-existing contract (clients branch on
			// `valid: false`, not status).
			return c.json({ valid: false });
		}

		try {
			const { jwtVerify, createRemoteJWKSet } = await import('jose');
			const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', config.baseUrl));
			const { payload } = await jwtVerify(body.token, jwks, {
				issuer: config.baseUrl,
				audience: 'mana',
			});
			return c.json({ valid: true, payload });
		} catch (error) {
			const msg = error instanceof Error ? error.message.toLowerCase() : '';
			// Expired / malformed JWT is a cold-path signal, not an outage.
			// Only bucket JWKS-fetch failures as infra.
			if (msg.includes('jwks') || msg.includes('fetch failed')) {
				return respondWithError(
					c,
					classify(AuthErrorCode.SERVICE_UNAVAILABLE, { cause: error }),
					{ endpoint: '/validate', ipAddress: ip },
					errDeps
				);
			}
			return c.json({ valid: false });
		}
	});

	// ─── Session & Logout ────────────────────────────────────

	app.post('/logout', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		try {
			return await auth.handler(
				new Request(new URL('/api/auth/sign-out', config.baseUrl), {
					method: 'POST',
					headers: c.req.raw.headers,
				})
			);
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/logout', ipAddress: ip },
				errDeps
			);
		}
	});

	app.get('/session', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		try {
			return await auth.handler(
				new Request(new URL('/api/auth/get-session', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/session', ipAddress: ip },
				errDeps
			);
		}
	});

	app.post('/refresh', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		try {
			const tokenResponse = await auth.handler(
				new Request(new URL('/api/auth/token', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);

			if (!tokenResponse.ok) {
				// 401/403 here means "session expired" — Better Auth's /token
				// only returns them when the cookie failed validation. Map
				// to TOKEN_EXPIRED rather than INVALID_CREDENTIALS (which is
				// the classifier's status-based fallback) so the client can
				// trigger a clean re-login flow instead of showing a
				// misleading "wrong password" toast.
				if (tokenResponse.status === 401 || tokenResponse.status === 403) {
					return respondWithError(
						c,
						classify(AuthErrorCode.TOKEN_EXPIRED, { message: 'Session expired' }),
						{ endpoint: '/refresh', ipAddress: ip },
						errDeps
					);
				}
				return respondWithError(
					c,
					await classifyFromResponse(tokenResponse),
					{ endpoint: '/refresh', ipAddress: ip },
					errDeps
				);
			}

			const tokenData = await tokenResponse.json();

			// Also get session data for the refresh token. If this upstream
			// fails we still return the access token so the refresh flow
			// isn't a hard-dependency on two round-trips succeeding.
			const sessionResponse = await auth.handler(
				new Request(new URL('/api/auth/get-session', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);
			const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;

			return c.json({
				accessToken: tokenData.token,
				refreshToken: sessionData?.session?.token,
			});
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/refresh', ipAddress: ip },
				errDeps
			);
		}
	});

	// ─── Password Management ─────────────────────────────────

	app.post('/forgot-password', async (c) => {
		// Intentionally 200-always: revealing "email not registered" here
		// is a user-enumeration oracle. We log upstream failures server-
		// side so the failure mode is observable without leaking anything
		// to the client.
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { email?: string; redirectTo?: string };
		try {
			body = await c.req.json();
		} catch {
			return c.json({ success: true });
		}
		if (body.redirectTo && body.email) {
			passwordResetRedirectStore.set(body.email, body.redirectTo);
		}
		try {
			// Better Auth's plugin calls this `requestPasswordReset` in
			// 1.6+ (the older `forgetPassword` was a typo retained for
			// back-compat and is typed-away in current builds).
			await auth.api.requestPasswordReset({
				body: { email: body.email || '', redirectTo: body.redirectTo },
			});
			void security.logEvent({
				eventType: 'PASSWORD_RESET_REQUESTED',
				ipAddress: ip,
				metadata: { email: body.email },
			});
		} catch (error) {
			// Log but do not surface — see comment above.
			logger.warn('forgot-password upstream failed (still returning 200)', {
				email: body.email,
				error: error instanceof Error ? error.message : String(error),
			});
		}
		return c.json({ success: true });
	});

	app.post('/reset-password', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { newPassword?: string; token?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/reset-password', ipAddress: ip },
				errDeps
			);
		}
		try {
			await auth.api.resetPassword({
				body: { newPassword: body.newPassword || '', token: body.token || '' },
			});
			void security.logEvent({ eventType: 'PASSWORD_RESET_COMPLETED', ipAddress: ip });
			return c.json({ success: true });
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/reset-password', ipAddress: ip },
				errDeps
			);
		}
	});

	app.post('/resend-verification', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { email?: string; sourceAppUrl?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/resend-verification', ipAddress: ip },
				errDeps
			);
		}
		if (body.sourceAppUrl && body.email) {
			sourceAppStore.set(body.email, body.sourceAppUrl);
		}
		try {
			await auth.api.sendVerificationEmail({ body: { email: body.email || '' } });
			return c.json({ success: true });
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/resend-verification', ipAddress: ip, email: body.email },
				errDeps
			);
		}
	});

	// ─── Profile ─────────────────────────────────────────────

	app.get('/profile', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		try {
			return await auth.handler(
				new Request(new URL('/api/auth/get-session', config.baseUrl), {
					method: 'GET',
					headers: c.req.raw.headers,
				})
			);
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: 'GET /profile', ipAddress: ip },
				errDeps
			);
		}
	});

	app.post('/profile', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: Record<string, unknown>;
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: 'POST /profile', ipAddress: ip },
				errDeps
			);
		}
		try {
			const result = await auth.api.updateUser({ body, headers: c.req.raw.headers });
			void security.logEvent({ eventType: 'PROFILE_UPDATED', ipAddress: ip });
			return c.json(result);
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: 'POST /profile', ipAddress: ip },
				errDeps
			);
		}
	});

	app.post('/change-email', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { newEmail?: string; callbackURL?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/change-email', ipAddress: ip },
				errDeps
			);
		}
		if (!body.newEmail) {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'newEmail is required' }),
				{ endpoint: '/change-email', ipAddress: ip },
				errDeps
			);
		}
		try {
			await auth.api.changeEmail({
				body: { newEmail: body.newEmail, callbackURL: body.callbackURL },
				headers: c.req.raw.headers,
			});
			void security.logEvent({
				eventType: 'EMAIL_CHANGE_REQUESTED',
				ipAddress: ip,
				metadata: { newEmail: body.newEmail },
			});
			return c.json({ success: true, message: 'Verification email sent to new address' });
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/change-email', ipAddress: ip },
				errDeps
			);
		}
	});

	app.post('/change-password', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { currentPassword?: string; newPassword?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: '/change-password', ipAddress: ip },
				errDeps
			);
		}
		try {
			await auth.api.changePassword({
				body: {
					currentPassword: body.currentPassword || '',
					newPassword: body.newPassword || '',
				},
				headers: c.req.raw.headers,
			});
			void security.logEvent({ eventType: 'PASSWORD_CHANGED', ipAddress: ip });
			return c.json({ success: true });
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: '/change-password', ipAddress: ip },
				errDeps
			);
		}
	});

	app.delete('/account', async (c) => {
		const ip = c.req.header('x-forwarded-for') || 'unknown';
		let body: { password?: string };
		try {
			body = await c.req.json();
		} catch {
			return respondWithError(
				c,
				classify(AuthErrorCode.VALIDATION, { message: 'Invalid JSON body' }),
				{ endpoint: 'DELETE /account', ipAddress: ip },
				errDeps
			);
		}
		try {
			await auth.api.deleteUser({
				body: { password: body.password || '' },
				headers: c.req.raw.headers,
			});
			void security.logEvent({ eventType: 'ACCOUNT_DELETED', ipAddress: ip });
			return c.json({ success: true });
		} catch (error) {
			return respondWithError(
				c,
				classifyFromError(error),
				{ endpoint: 'DELETE /account', ipAddress: ip },
				errDeps
			);
		}
	});

	// ─── Security Events ─────────────────────────────────────

	app.get('/security-events', async (c) => {
		const user = c.get('user');
		const events = await security.getUserEvents(user.userId);
		return c.json(events);
	});

	// ─── JWKS ────────────────────────────────────────────────

	app.get('/jwks', async (c) => {
		return auth.handler(
			new Request(new URL('/api/auth/jwks', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);
	});

	return app;
}
