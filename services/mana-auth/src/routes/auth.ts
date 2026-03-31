/**
 * Auth routes — Custom endpoints wrapping Better Auth
 *
 * Adds business logic (security events, lockout, credit init)
 * around Better Auth's native sign-in/sign-up.
 */

import { Hono } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';
import type { BetterAuthInstance } from '../auth/better-auth.config';
import type { SecurityEventsService, AccountLockoutService } from '../services/security';
import type { SignupLimitService } from '../services/signup-limit';
import type { Config } from '../config';
import { sourceAppStore, passwordResetRedirectStore } from '../auth/stores';

export function createAuthRoutes(
	auth: BetterAuthInstance,
	config: Config,
	security: SecurityEventsService,
	lockout: AccountLockoutService,
	signupLimit: SignupLimitService
) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// ─── Registration ────────────────────────────────────────

	// ─── Signup Status (public) ─────────────────────────────

	app.get('/signup-status', async (c) => {
		const status = await signupLimit.getStatus();
		return c.json(status);
	});

	app.post('/register', async (c) => {
		const body = await c.req.json();

		// Check daily signup limit
		const limitCheck = await signupLimit.checkLimit();
		if (!limitCheck.allowed) {
			return c.json(
				{
					error: 'Registration limit reached',
					message: 'Das tägliche Registrierungslimit ist erreicht. Versuche es morgen wieder.',
					spotsRemaining: 0,
					resetsAt: limitCheck.resetsAt,
				},
				429
			);
		}

		// Store source app URL for email verification redirect
		if (body.sourceAppUrl && body.email) {
			sourceAppStore.set(body.email, body.sourceAppUrl);
		}

		const response = await auth.api.signUpEmail({
			body: {
				email: body.email,
				password: body.password,
				name: body.name || body.email.split('@')[0],
			},
			headers: c.req.raw.headers,
		});

		if (response?.user?.id) {
			security.logEvent({ userId: response.user.id, eventType: 'REGISTER' });
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
		}

		return c.json(response);
	});

	// ─── Login ───────────────────────────────────────────────

	app.post('/login', async (c) => {
		const body = await c.req.json();

		// Check lockout
		const lockoutStatus = await lockout.checkLockout(body.email);
		if (lockoutStatus.locked) {
			return c.json(
				{ error: 'Account locked', remainingSeconds: lockoutStatus.remainingSeconds },
				429
			);
		}

		const ip = c.req.header('x-forwarded-for') || 'unknown';

		try {
			const response = await auth.api.signInEmail({
				body: { email: body.email, password: body.password },
				headers: c.req.raw.headers,
			});

			if (response?.user?.id) {
				security.logEvent({ userId: response.user.id, eventType: 'LOGIN_SUCCESS', ipAddress: ip });
				lockout.clearAttempts(body.email);
			}

			// signInEmail returns { token (session token), user, redirect }
			// Use the session token to call Better Auth's JWT /token endpoint
			const sessionToken = response?.token;
			if (sessionToken) {
				const tokenResponse = await auth.handler(
					new Request(new URL('/api/auth/token', config.baseUrl), {
						method: 'GET',
						headers: new Headers({ cookie: `mana.session_token=${sessionToken}` }),
					})
				);

				if (tokenResponse.ok) {
					const tokenData = await tokenResponse.json();
					return c.json({
						...response,
						accessToken: tokenData.token,
						refreshToken: sessionToken,
					});
				}
			}

			return c.json(response);
		} catch (error) {
			// Better Auth throws APIError (status="FORBIDDEN", body.code="EMAIL_NOT_VERIFIED")
			const isEmailNotVerified =
				(error as any)?.body?.code === 'EMAIL_NOT_VERIFIED' ||
				(error as any)?.status === 'FORBIDDEN';
			if (isEmailNotVerified) {
				return c.json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' }, 403);
			}

			security.logEvent({
				eventType: 'LOGIN_FAILURE',
				ipAddress: ip,
				metadata: { email: body.email },
			});
			lockout.recordAttempt(body.email, false, ip);
			return c.json({ error: 'Invalid credentials' }, 401);
		}
	});

	// ─── Session → JWT Token Exchange ───────────────────────
	// Used by SSO (trySSO) and after 2FA verification to get JWT from session cookie

	app.post('/session-to-token', async (c) => {
		// First verify the session is valid
		const sessionResponse = await auth.handler(
			new Request(new URL('/api/auth/get-session', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);

		if (!sessionResponse.ok) {
			return c.json({ error: 'No valid session' }, 401);
		}

		const sessionData = await sessionResponse.json();
		if (!sessionData?.session?.token) {
			return c.json({ error: 'No valid session' }, 401);
		}

		// Generate JWT from the session
		const tokenResponse = await auth.handler(
			new Request(new URL('/api/auth/token', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);

		if (!tokenResponse.ok) {
			return c.json({ error: 'Token generation failed' }, 500);
		}

		const tokenData = await tokenResponse.json();
		return c.json({
			accessToken: tokenData.token,
			// Session token serves as refresh mechanism via session cookie
			refreshToken: sessionData.session.token,
		});
	});

	// ─── Token Validation ────────────────────────────────────

	app.post('/validate', async (c) => {
		const { token } = await c.req.json();
		if (!token) return c.json({ valid: false }, 400);

		try {
			const { jwtVerify, createRemoteJWKSet } = await import('jose');
			const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', config.baseUrl));
			const { payload } = await jwtVerify(token, jwks, {
				issuer: config.baseUrl,
				audience: 'manacore',
			});
			return c.json({ valid: true, payload });
		} catch {
			return c.json({ valid: false }, 401);
		}
	});

	// ─── Session & Logout ────────────────────────────────────

	app.post('/logout', async (c) => {
		return auth.handler(
			new Request(new URL('/api/auth/sign-out', config.baseUrl), {
				method: 'POST',
				headers: c.req.raw.headers,
			})
		);
	});

	app.get('/session', async (c) => {
		return auth.handler(
			new Request(new URL('/api/auth/get-session', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);
	});

	app.post('/refresh', async (c) => {
		// Generate a fresh JWT from the session cookie
		const tokenResponse = await auth.handler(
			new Request(new URL('/api/auth/token', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);

		if (!tokenResponse.ok) {
			return c.json({ error: 'Session expired' }, 401);
		}

		const tokenData = await tokenResponse.json();

		// Also get session data for the refresh token
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
	});

	// ─── Password Management ─────────────────────────────────

	app.post('/forgot-password', async (c) => {
		const body = await c.req.json();
		if (body.redirectTo && body.email) {
			passwordResetRedirectStore.set(body.email, body.redirectTo);
		}
		await auth.api.forgetPassword({ body: { email: body.email, redirectTo: body.redirectTo } });
		security.logEvent({ eventType: 'PASSWORD_RESET_REQUESTED', metadata: { email: body.email } });
		return c.json({ success: true });
	});

	app.post('/reset-password', async (c) => {
		const body = await c.req.json();
		await auth.api.resetPassword({ body: { newPassword: body.newPassword, token: body.token } });
		security.logEvent({ eventType: 'PASSWORD_RESET_COMPLETED' });
		return c.json({ success: true });
	});

	app.post('/resend-verification', async (c) => {
		const body = await c.req.json();
		if (body.sourceAppUrl && body.email) {
			sourceAppStore.set(body.email, body.sourceAppUrl);
		}
		await auth.api.sendVerificationEmail({ body: { email: body.email } });
		return c.json({ success: true });
	});

	// ─── Profile ─────────────────────────────────────────────

	app.get('/profile', async (c) => {
		return auth.handler(
			new Request(new URL('/api/auth/get-session', config.baseUrl), {
				method: 'GET',
				headers: c.req.raw.headers,
			})
		);
	});

	app.post('/profile', async (c) => {
		const body = await c.req.json();
		const result = await auth.api.updateUser({ body, headers: c.req.raw.headers });
		security.logEvent({ eventType: 'PROFILE_UPDATED' });
		return c.json(result);
	});

	app.post('/change-password', async (c) => {
		const body = await c.req.json();
		await auth.api.changePassword({
			body: { currentPassword: body.currentPassword, newPassword: body.newPassword },
			headers: c.req.raw.headers,
		});
		security.logEvent({ eventType: 'PASSWORD_CHANGED' });
		return c.json({ success: true });
	});

	app.delete('/account', async (c) => {
		const body = await c.req.json();
		await auth.api.deleteUser({
			body: { password: body.password },
			headers: c.req.raw.headers,
		});
		security.logEvent({ eventType: 'ACCOUNT_DELETED' });
		return c.json({ success: true });
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
