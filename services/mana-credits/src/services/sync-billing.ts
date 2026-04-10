/**
 * Sync Billing Service — manages sync subscriptions and recurring charges
 */

import { eq, and, lte } from 'drizzle-orm';
import { syncSubscriptions } from '../db/schema/sync';
import type { Database } from '../db/connection';
import type { CreditsService } from './credits';
import { BadRequestError, NotFoundError, InsufficientCreditsError } from '../lib/errors';

type BillingInterval = 'monthly' | 'quarterly' | 'yearly';

const SYNC_PRICES: Record<BillingInterval, number> = {
	monthly: 30,
	quarterly: 90,
	yearly: 360,
};

function getNextChargeDate(from: Date, interval: BillingInterval): Date {
	const next = new Date(from);
	switch (interval) {
		case 'monthly':
			next.setMonth(next.getMonth() + 1);
			break;
		case 'quarterly':
			next.setMonth(next.getMonth() + 3);
			break;
		case 'yearly':
			next.setFullYear(next.getFullYear() + 1);
			break;
	}
	return next;
}

export class SyncBillingService {
	constructor(
		private db: Database,
		private creditsService: CreditsService
	) {}

	async getSyncStatus(userId: string) {
		const [sub] = await this.db
			.select()
			.from(syncSubscriptions)
			.where(eq(syncSubscriptions.userId, userId))
			.limit(1);

		if (!sub) {
			return {
				active: false,
				interval: 'monthly' as BillingInterval,
				nextChargeAt: null,
				pausedAt: null,
			};
		}

		return {
			active: sub.active,
			interval: sub.billingInterval as BillingInterval,
			nextChargeAt: sub.nextChargeAt?.toISOString() ?? null,
			pausedAt: sub.pausedAt?.toISOString() ?? null,
		};
	}

	async activateSync(userId: string, interval: BillingInterval = 'monthly') {
		const amount = SYNC_PRICES[interval];
		const now = new Date();

		// Check if already active
		const [existing] = await this.db
			.select()
			.from(syncSubscriptions)
			.where(eq(syncSubscriptions.userId, userId))
			.limit(1);

		if (existing?.active) {
			throw new BadRequestError('Sync is already active');
		}

		// Charge credits
		await this.creditsService.useCredits(userId, {
			amount,
			appId: 'sync',
			description: `Cloud Sync activated (${interval})`,
			metadata: { interval, type: 'sync_subscription' },
		});

		const nextChargeAt = getNextChargeDate(now, interval);

		if (existing) {
			// Reactivate existing subscription
			await this.db
				.update(syncSubscriptions)
				.set({
					active: true,
					billingInterval: interval,
					amountCharged: amount,
					activatedAt: now,
					nextChargeAt,
					pausedAt: null,
					updatedAt: now,
				})
				.where(eq(syncSubscriptions.userId, userId));
		} else {
			// Create new subscription
			await this.db.insert(syncSubscriptions).values({
				userId,
				active: true,
				billingInterval: interval,
				amountCharged: amount,
				activatedAt: now,
				nextChargeAt,
			});
		}

		return {
			success: true,
			active: true,
			interval,
			nextChargeAt: nextChargeAt.toISOString(),
			amountCharged: amount,
		};
	}

	async deactivateSync(userId: string) {
		const [sub] = await this.db
			.select()
			.from(syncSubscriptions)
			.where(eq(syncSubscriptions.userId, userId))
			.limit(1);

		if (!sub || !sub.active) {
			throw new BadRequestError('Sync is not active');
		}

		await this.db
			.update(syncSubscriptions)
			.set({
				active: false,
				nextChargeAt: null,
				updatedAt: new Date(),
			})
			.where(eq(syncSubscriptions.userId, userId));

		return { success: true };
	}

	async changeBillingInterval(userId: string, newInterval: BillingInterval) {
		const [sub] = await this.db
			.select()
			.from(syncSubscriptions)
			.where(eq(syncSubscriptions.userId, userId))
			.limit(1);

		if (!sub || !sub.active) {
			throw new BadRequestError('Sync is not active');
		}

		const newAmount = SYNC_PRICES[newInterval];

		// Change takes effect at next billing cycle
		await this.db
			.update(syncSubscriptions)
			.set({
				billingInterval: newInterval,
				amountCharged: newAmount,
				updatedAt: new Date(),
			})
			.where(eq(syncSubscriptions.userId, userId));

		return {
			success: true,
			interval: newInterval,
			amountCharged: newAmount,
			effectiveAt: sub.nextChargeAt?.toISOString() ?? null,
		};
	}

	/**
	 * Charge all due sync subscriptions. Called by cron job (daily).
	 * Returns summary of charges, pauses, and errors.
	 */
	async chargeRecurring() {
		const now = new Date();

		const dueSubscriptions = await this.db
			.select()
			.from(syncSubscriptions)
			.where(and(eq(syncSubscriptions.active, true), lte(syncSubscriptions.nextChargeAt, now)));

		let charged = 0;
		let paused = 0;
		let errors = 0;

		for (const sub of dueSubscriptions) {
			try {
				await this.creditsService.useCredits(sub.userId, {
					amount: sub.amountCharged,
					appId: 'sync',
					description: `Cloud Sync renewal (${sub.billingInterval})`,
					metadata: { interval: sub.billingInterval, type: 'sync_renewal' },
				});

				// Update next charge date
				const nextChargeAt = getNextChargeDate(now, sub.billingInterval as BillingInterval);
				await this.db
					.update(syncSubscriptions)
					.set({ nextChargeAt, updatedAt: now })
					.where(eq(syncSubscriptions.userId, sub.userId));

				charged++;
			} catch (error) {
				if (error instanceof InsufficientCreditsError) {
					// Pause subscription
					await this.db
						.update(syncSubscriptions)
						.set({
							active: false,
							pausedAt: now,
							updatedAt: now,
						})
						.where(eq(syncSubscriptions.userId, sub.userId));

					paused++;
					// TODO Phase 2: send notification via mana-notify
				} else {
					errors++;
					console.error(`[sync-billing] Failed to charge user ${sub.userId}:`, error);
				}
			}
		}

		return { charged, paused, errors, total: dueSubscriptions.length };
	}
}
