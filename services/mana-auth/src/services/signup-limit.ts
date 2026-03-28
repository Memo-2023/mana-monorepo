/**
 * Signup Limit — Daily registration cap ("Organic Growth Gate")
 *
 * Limits new registrations per day to protect hardware and
 * enable organic growth. Uses PostgreSQL security_events table
 * (no Redis dependency needed).
 *
 * Configure via MAX_DAILY_SIGNUPS env var (default: 0 = unlimited).
 */

import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

export class SignupLimitService {
	private maxDaily: number;

	constructor(private db: Database) {
		this.maxDaily = parseInt(process.env.MAX_DAILY_SIGNUPS || '0', 10);
	}

	/** Check if registration is allowed right now */
	async checkLimit(): Promise<{
		allowed: boolean;
		current: number;
		limit: number;
		resetsAt: string;
	}> {
		// 0 = unlimited (feature disabled)
		if (this.maxDaily <= 0) {
			return { allowed: true, current: 0, limit: 0, resetsAt: '' };
		}

		const todayCount = await this.getTodayCount();
		const midnight = new Date();
		midnight.setHours(24, 0, 0, 0);

		return {
			allowed: todayCount < this.maxDaily,
			current: todayCount,
			limit: this.maxDaily,
			resetsAt: midnight.toISOString(),
		};
	}

	/** Count registrations today (UTC) */
	private async getTodayCount(): Promise<number> {
		try {
			const result = await this.db.execute(
				sql`SELECT COUNT(*) as count
				FROM auth.security_events
				WHERE event_type = 'REGISTER'
				AND created_at >= CURRENT_DATE
				AND created_at < CURRENT_DATE + INTERVAL '1 day'`
			);
			const row = (result as any)[0];
			return row ? Number(row.count) : 0;
		} catch {
			// On error, allow registration (fail open)
			return 0;
		}
	}

	/** Public status for the signup page */
	async getStatus(): Promise<{
		registrationOpen: boolean;
		spotsRemaining: number | null;
		totalToday: number;
		limit: number;
		resetsAt: string;
	}> {
		if (this.maxDaily <= 0) {
			return {
				registrationOpen: true,
				spotsRemaining: null,
				totalToday: 0,
				limit: 0,
				resetsAt: '',
			};
		}

		const todayCount = await this.getTodayCount();
		const midnight = new Date();
		midnight.setHours(24, 0, 0, 0);

		return {
			registrationOpen: todayCount < this.maxDaily,
			spotsRemaining: Math.max(0, this.maxDaily - todayCount),
			totalToday: todayCount,
			limit: this.maxDaily,
			resetsAt: midnight.toISOString(),
		};
	}
}
