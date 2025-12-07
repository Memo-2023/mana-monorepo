/**
 * Referral Cron Service
 *
 * Handles scheduled tasks for the referral system:
 * - Retention checking (30-day mark)
 * - Daily statistics aggregation
 * - Cleanup of expired rate limits
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, lte, gte, count, isNull } from 'drizzle-orm';
import { getDb } from '../../db/connection';
import {
	relationships,
	bonusEvents,
	dailyStats,
	rateLimits,
	userTiers,
	BONUS_AMOUNTS,
	TIMING_RULES,
} from '../../db/schema/referrals.schema';
import { balances } from '../../db/schema/credits.schema';
import { ReferralTierService } from './referral-tier.service';

@Injectable()
export class ReferralCronService {
	private readonly logger = new Logger(ReferralCronService.name);

	constructor(
		private configService: ConfigService,
		private tierService: ReferralTierService
	) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Check for retained referrals (30 days after qualification)
	 * Runs every hour
	 */
	@Cron(CronExpression.EVERY_HOUR)
	async processRetentionCheck(): Promise<void> {
		this.logger.log('Starting retention check...');
		const db = this.getDb();

		try {
			const retentionDays = TIMING_RULES.retentionCheckDays;
			const retentionDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

			// Find qualified referrals that are now retained
			const eligibleReferrals = await db
				.select()
				.from(relationships)
				.where(
					and(
						eq(relationships.status, 'qualified'),
						lte(relationships.qualifiedAt, retentionDate),
						isNull(relationships.retainedAt)
					)
				)
				.limit(100);

			let processedCount = 0;
			let errorCount = 0;

			for (const referral of eligibleReferrals) {
				try {
					await this.processRetention(referral);
					processedCount++;
				} catch (error) {
					errorCount++;
					this.logger.error(`Error processing retention for referral ${referral.id}:`, error);
				}
			}

			this.logger.log(
				`Retention check complete: ${processedCount} processed, ${errorCount} errors`
			);
		} catch (error) {
			this.logger.error('Error in retention check:', error);
		}
	}

	/**
	 * Process a single retention transition
	 */
	private async processRetention(referral: typeof relationships.$inferSelect): Promise<void> {
		const db = this.getDb();

		// Get referrer's tier for multiplier
		const multiplier = await this.tierService.getMultiplier(referral.referrerId);
		const baseBonus = BONUS_AMOUNTS.retained.referrer;
		const finalBonus = Math.round(baseBonus * multiplier);

		// Get referrer's current tier
		const tierInfo = await this.tierService.getUserTier(referral.referrerId);

		// Update relationship to retained
		await db
			.update(relationships)
			.set({
				status: 'retained',
				retainedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(relationships.id, referral.id));

		// Award retention bonus to referrer (if not held for fraud)
		if (referral.fraudScore < 50) {
			await db
				.update(balances)
				.set({
					balance: sql`${balances.balance} + ${finalBonus}`,
					totalEarned: sql`${balances.totalEarned} + ${finalBonus}`,
				})
				.where(eq(balances.userId, referral.referrerId));

			// Record bonus event
			await db.insert(bonusEvents).values({
				relationshipId: referral.id,
				userId: referral.referrerId,
				eventType: 'retained',
				creditsBase: baseBonus,
				tierMultiplier: multiplier,
				creditsFinal: finalBonus,
				tierAtTime: tierInfo.current,
				status: 'paid',
				createdAt: new Date(),
			});
		} else {
			// Record as held due to fraud score
			await db.insert(bonusEvents).values({
				relationshipId: referral.id,
				userId: referral.referrerId,
				eventType: 'retained',
				creditsBase: baseBonus,
				tierMultiplier: multiplier,
				creditsFinal: finalBonus,
				tierAtTime: tierInfo.current,
				status: 'held',
				holdReason: `High fraud score: ${referral.fraudScore}`,
				createdAt: new Date(),
			});
		}
	}

	/**
	 * Aggregate daily statistics
	 * Runs at midnight every day
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async aggregateDailyStats(): Promise<void> {
		this.logger.log('Starting daily stats aggregation...');
		const db = this.getDb();

		try {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Count registrations
			const [registrationsResult] = await db
				.select({ count: count() })
				.from(relationships)
				.where(and(gte(relationships.createdAt, yesterday), lte(relationships.createdAt, today)));

			// Count activations
			const [activationsResult] = await db
				.select({ count: count() })
				.from(relationships)
				.where(
					and(gte(relationships.activatedAt, yesterday), lte(relationships.activatedAt, today))
				);

			// Count qualifications
			const [qualificationsResult] = await db
				.select({ count: count() })
				.from(relationships)
				.where(
					and(gte(relationships.qualifiedAt, yesterday), lte(relationships.qualifiedAt, today))
				);

			// Count retentions
			const [retentionsResult] = await db
				.select({ count: count() })
				.from(relationships)
				.where(and(gte(relationships.retainedAt, yesterday), lte(relationships.retainedAt, today)));

			// Sum credits paid
			const [creditsPaidResult] = await db
				.select({ total: sql<number>`COALESCE(SUM(${bonusEvents.creditsFinal}), 0)` })
				.from(bonusEvents)
				.where(
					and(
						eq(bonusEvents.status, 'paid'),
						gte(bonusEvents.createdAt, yesterday),
						lte(bonusEvents.createdAt, today)
					)
				);

			// Sum credits held
			const [creditsHeldResult] = await db
				.select({ total: sql<number>`COALESCE(SUM(${bonusEvents.creditsFinal}), 0)` })
				.from(bonusEvents)
				.where(
					and(
						eq(bonusEvents.status, 'held'),
						gte(bonusEvents.createdAt, yesterday),
						lte(bonusEvents.createdAt, today)
					)
				);

			// Count fraud blocked
			const [fraudBlockedResult] = await db
				.select({ count: count() })
				.from(relationships)
				.where(
					and(
						gte(relationships.fraudScore, 90),
						gte(relationships.createdAt, yesterday),
						lte(relationships.createdAt, today)
					)
				);

			// Insert daily stats
			await db.insert(dailyStats).values({
				date: yesterday,
				registrations: registrationsResult.count,
				activations: activationsResult.count,
				qualifications: qualificationsResult.count,
				retentions: retentionsResult.count,
				creditsPaid: creditsPaidResult.total || 0,
				creditsHeld: creditsHeldResult.total || 0,
				fraudBlocked: fraudBlockedResult.count,
			});

			this.logger.log('Daily stats aggregation complete');
		} catch (error) {
			this.logger.error('Error aggregating daily stats:', error);
		}
	}

	/**
	 * Cleanup expired rate limits
	 * Runs every 6 hours
	 */
	@Cron(CronExpression.EVERY_6_HOURS)
	async cleanupRateLimits(): Promise<void> {
		this.logger.log('Cleaning up expired rate limits...');
		const db = this.getDb();

		try {
			await db.delete(rateLimits).where(lte(rateLimits.windowEnd, new Date()));

			this.logger.log('Rate limit cleanup complete');
		} catch (error) {
			this.logger.error('Error cleaning up rate limits:', error);
		}
	}

	/**
	 * Recalculate tier standings for all users
	 * Runs weekly on Sunday at 3am
	 */
	@Cron('0 3 * * 0')
	async recalculateTiers(): Promise<void> {
		this.logger.log('Recalculating all user tiers...');
		const db = this.getDb();

		try {
			// Get all user tiers
			const allTiers = await db.select().from(userTiers);

			let updatedCount = 0;

			for (const userTier of allTiers) {
				// Recalculate qualified count from relationships
				const [actualCount] = await db
					.select({ count: count() })
					.from(relationships)
					.where(
						and(
							eq(relationships.referrerId, userTier.userId),
							eq(relationships.status, 'qualified')
						)
					);

				// Add retained counts too
				const [retainedCount] = await db
					.select({ count: count() })
					.from(relationships)
					.where(
						and(eq(relationships.referrerId, userTier.userId), eq(relationships.status, 'retained'))
					);

				const totalQualified = actualCount.count + retainedCount.count;

				// Update if different
				if (totalQualified !== userTier.qualifiedCount) {
					const newTier = this.tierService.calculateTierFromCount(totalQualified);

					await db
						.update(userTiers)
						.set({
							qualifiedCount: totalQualified,
							tier: newTier,
							updatedAt: new Date(),
						})
						.where(eq(userTiers.userId, userTier.userId));

					updatedCount++;
				}
			}

			this.logger.log(`Tier recalculation complete: ${updatedCount} users updated`);
		} catch (error) {
			this.logger.error('Error recalculating tiers:', error);
		}
	}
}
