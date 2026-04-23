/**
 * Security Services — Audit logging + Account lockout
 */

import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { logger } from '@mana/shared-hono';
import type { Database } from '../db/connection';

// Security events — fire-and-forget, never throw
const EVENT_TYPES = [
	'LOGIN_SUCCESS',
	'LOGIN_FAILURE',
	'REGISTER',
	'LOGOUT',
	'PASSWORD_CHANGED',
	'PASSWORD_RESET_REQUESTED',
	'PASSWORD_RESET_COMPLETED',
	'EMAIL_VERIFIED',
	'ACCOUNT_DELETED',
	'ACCOUNT_LOCKED',
	'PROFILE_UPDATED',
	'API_KEY_CREATED',
	'API_KEY_REVOKED',
	'PASSKEY_REGISTERED',
	'PASSKEY_LOGIN_SUCCESS',
	'TWO_FACTOR_ENABLED',
	'TWO_FACTOR_DISABLED',
	'ORG_CREATED',
	'ORG_DELETED',
] as const;

export class SecurityEventsService {
	constructor(private db: Database) {}

	async logEvent(params: {
		userId?: string;
		eventType: string;
		ipAddress?: string;
		userAgent?: string;
		metadata?: Record<string, unknown>;
	}) {
		// postgres-js renders `undefined` as literal nothing in tagged-template
		// SQL — `${undefined}` collapses the parameter slot, producing
		// `VALUES (..., , , ...)` and a syntax error. Explicitly fall back to
		// `null` so optional fields go in as NULL.
		const userId = params.userId ?? null;
		const ipAddress = params.ipAddress ?? null;
		const userAgent = params.userAgent ?? null;
		const metadata = JSON.stringify(params.metadata ?? {});
		try {
			// Use raw SQL since securityEvents table may be in auth schema
			await this.db.execute(
				sql`INSERT INTO auth.security_events (id, user_id, event_type, ip_address, user_agent, metadata, created_at)
				VALUES (gen_random_uuid(), ${userId}, ${params.eventType}, ${ipAddress}, ${userAgent}, ${metadata}::jsonb, NOW())`
			);
		} catch (error) {
			// Audit logging is non-critical, so we never throw — but actually
			// surface the error message so the failure mode is debuggable
			// instead of a silent warn that hides the real cause.
			logger.warn('security.logEvent failed (non-critical)', {
				eventType: params.eventType,
				userId: params.userId,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async getUserEvents(userId: string, limit = 50) {
		try {
			const result = await this.db.execute(
				sql`SELECT * FROM auth.security_events WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`
			);
			return result;
		} catch {
			return [];
		}
	}
}

// Lockout policy: 5 failures in 15 min → locked 30 min
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 30;

export class AccountLockoutService {
	constructor(private db: Database) {}

	async checkLockout(email: string): Promise<{ locked: boolean; remainingSeconds?: number }> {
		try {
			// postgres-js can't bind a JS Date directly via the drizzle sql
			// template — it tries to byteLength() the parameter and crashes
			// with `Received an instance of Date`. Pass an ISO string instead.
			const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
			const result = await this.db.execute(
				sql`SELECT COUNT(*) as count, MAX(attempted_at) as last_attempt
				FROM auth.login_attempts
				WHERE email = ${email} AND successful = false AND attempted_at > ${windowStart}`
			);

			const row = (result as any)[0];
			if (!row || Number(row.count) < MAX_ATTEMPTS) return { locked: false };

			const lastAttempt = new Date(row.last_attempt);
			const lockoutEnd = new Date(lastAttempt.getTime() + LOCKOUT_MINUTES * 60 * 1000);
			if (Date.now() > lockoutEnd.getTime()) return { locked: false };

			return {
				locked: true,
				remainingSeconds: Math.ceil((lockoutEnd.getTime() - Date.now()) / 1000),
			};
		} catch (error) {
			// Fail open on lockout-check errors (we'd rather let a legit
			// user log in than block them on a transient DB hiccup), but
			// surface the cause so the next bug doesn't take 4 hours to
			// find like this one did.
			logger.warn('lockout.checkLockout failed (fail-open)', {
				email,
				error: error instanceof Error ? error.message : String(error),
			});
			return { locked: false };
		}
	}

	async recordAttempt(email: string, successful: boolean, ipAddress?: string) {
		try {
			// Don't INSERT id — auth.login_attempts.id is a serial integer
			// (`nextval('auth.login_attempts_id_seq')` default), not a UUID.
			// The previous code passed `gen_random_uuid()` into it and the
			// resulting type-cast error was silently eaten by the catch
			// below — meaning lockout's "5 failures in 15 min" check ran on
			// an empty table forever and the lockout never actually triggered.
			await this.db.execute(
				sql`INSERT INTO auth.login_attempts (email, successful, ip_address, attempted_at)
				VALUES (${email}, ${successful}, ${ipAddress ?? null}, NOW())`
			);
		} catch (error) {
			logger.warn('lockout.recordAttempt failed (non-critical)', {
				email,
				successful,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async clearAttempts(email: string) {
		try {
			await this.db.execute(sql`DELETE FROM auth.login_attempts WHERE email = ${email}`);
		} catch {
			// Non-critical
		}
	}
}
