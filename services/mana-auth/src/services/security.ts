/**
 * Security Services — Audit logging + Account lockout
 */

import { eq, and, gte, desc, sql } from 'drizzle-orm';
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
		try {
			// Use raw SQL since securityEvents table may be in auth schema
			await this.db.execute(
				sql`INSERT INTO auth.security_events (id, user_id, event_type, ip_address, user_agent, metadata, created_at)
				VALUES (gen_random_uuid(), ${params.userId}, ${params.eventType}, ${params.ipAddress}, ${params.userAgent}, ${JSON.stringify(params.metadata || {})}::jsonb, NOW())`
			);
		} catch (error) {
			console.warn('Failed to log security event (non-critical):', params.eventType);
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
			const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
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
		} catch {
			return { locked: false };
		}
	}

	async recordAttempt(email: string, successful: boolean, ipAddress?: string) {
		try {
			await this.db.execute(
				sql`INSERT INTO auth.login_attempts (id, email, successful, ip_address, attempted_at)
				VALUES (gen_random_uuid(), ${email}, ${successful}, ${ipAddress}, NOW())`
			);
		} catch {
			// Non-critical
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
