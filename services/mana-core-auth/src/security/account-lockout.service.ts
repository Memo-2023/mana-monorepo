/**
 * Account Lockout Service
 *
 * Tracks failed login attempts and locks accounts after too many failures.
 * Uses the login_attempts table for efficient counting.
 *
 * Policy:
 * - 5 failed attempts within 15 minutes → account locked for 30 minutes
 * - Successful login clears all previous attempts
 * - Lockout is per-email (not per-IP) to prevent distributed brute force
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../db/connection';
import { loginAttempts } from '../db/schema/login-attempts.schema';
import { LoggerService } from '../common/logger';
import { and, eq, gte, sql, desc } from 'drizzle-orm';

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 30;

export interface LockoutStatus {
	locked: boolean;
	remainingSeconds?: number;
	attempts?: number;
}

@Injectable()
export class AccountLockoutService {
	private readonly logger: LoggerService;
	private readonly databaseUrl: string;

	constructor(
		loggerService: LoggerService,
		private configService: ConfigService
	) {
		this.logger = loggerService;
		this.logger.setContext('AccountLockoutService');
		this.databaseUrl = this.configService.get<string>('database.url') || '';
	}

	private getDb() {
		return getDb(this.databaseUrl);
	}

	/**
	 * Check if an account is locked due to too many failed login attempts
	 */
	async checkLockout(email: string): Promise<LockoutStatus> {
		try {
			const db = this.getDb();
			const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000);

			// Count failed attempts in the window
			const result = await db
				.select({
					count: sql<number>`count(*)::int`,
					latestAttempt: sql<Date>`max(${loginAttempts.attemptedAt})`,
				})
				.from(loginAttempts)
				.where(
					and(
						eq(loginAttempts.email, email.toLowerCase()),
						eq(loginAttempts.successful, false),
						gte(loginAttempts.attemptedAt, windowStart)
					)
				);

			const failedCount = result[0]?.count ?? 0;
			const latestAttempt = result[0]?.latestAttempt;

			if (failedCount >= MAX_ATTEMPTS && latestAttempt) {
				const lockoutEnd = new Date(
					new Date(latestAttempt).getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000
				);
				const remainingMs = lockoutEnd.getTime() - Date.now();

				if (remainingMs > 0) {
					return {
						locked: true,
						remainingSeconds: Math.ceil(remainingMs / 1000),
						attempts: failedCount,
					};
				}
			}

			return { locked: false, attempts: failedCount };
		} catch (error) {
			// On error, do not lock out (fail open for availability)
			this.logger.warn('Failed to check lockout status', {
				email,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return { locked: false };
		}
	}

	/**
	 * Record a login attempt (successful or failed)
	 */
	async recordAttempt(email: string, successful: boolean, ipAddress?: string): Promise<void> {
		try {
			const db = this.getDb();
			await db.insert(loginAttempts).values({
				email: email.toLowerCase(),
				ipAddress: ipAddress || null,
				successful,
			});
		} catch (error) {
			this.logger.warn('Failed to record login attempt', {
				email,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Clear all failed attempts for an email (called on successful login)
	 */
	async clearAttempts(email: string): Promise<void> {
		try {
			const db = this.getDb();
			const windowStart = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);
			await db
				.delete(loginAttempts)
				.where(
					and(
						eq(loginAttempts.email, email.toLowerCase()),
						gte(loginAttempts.attemptedAt, windowStart)
					)
				);
		} catch (error) {
			this.logger.warn('Failed to clear login attempts', {
				email,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
