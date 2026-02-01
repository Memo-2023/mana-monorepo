/**
 * Fraud Detection Service
 *
 * Handles fraud detection for the referral system:
 * - Device fingerprinting and tracking
 * - IP address analysis
 * - Pattern detection (velocity, clusters)
 * - Fraud scoring
 * - Auto-hold and review queue management
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, gte, count, desc, or } from 'drizzle-orm';
import { getDb } from '../../db/connection';
import {
	fingerprints,
	userFingerprints,
	fraudPatterns,
	rateLimits,
	reviewQueue,
	relationships,
	FRAUD_THRESHOLDS,
	FRAUD_SIGNALS,
	RATE_LIMITS,
	type ReviewQueueItem,
} from '../../db/schema/referrals.schema';
import * as crypto from 'crypto';

/**
 * Fraud check input data
 */
export interface FraudCheckInput {
	userId: string;
	referrerId?: string;
	ipAddress?: string;
	userAgent?: string;
	deviceFingerprint?: string;
	email?: string;
}

/**
 * Fraud check result
 */
export interface FraudCheckResult {
	score: number;
	signals: string[];
	action: 'allow' | 'hold' | 'reject';
	holdReason?: string;
}

/**
 * Fingerprint data for storage
 */
export interface FingerprintData {
	ipAddress: string;
	deviceHash?: string;
	userAgent?: string;
}

@Injectable()
export class FraudDetectionService {
	private readonly logger = new Logger(FraudDetectionService.name);

	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Hash a value for privacy (GDPR compliance)
	 */
	private hashValue(value: string): string {
		return crypto.createHash('sha256').update(value).digest('hex');
	}

	/**
	 * Perform comprehensive fraud check for a referral
	 */
	async checkFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
		const signals: string[] = [];
		let score = 0;

		try {
			// 1. Check IP-based signals
			if (input.ipAddress) {
				const ipSignals = await this.checkIpSignals(input.ipAddress, input.referrerId);
				signals.push(...ipSignals.signals);
				score += ipSignals.score;
			}

			// 2. Check device fingerprint signals
			if (input.deviceFingerprint) {
				const fpSignals = await this.checkFingerprintSignals(
					input.deviceFingerprint,
					input.referrerId
				);
				signals.push(...fpSignals.signals);
				score += fpSignals.score;
			}

			// 3. Check referrer velocity (too many referrals too fast)
			if (input.referrerId) {
				const velocitySignals = await this.checkReferrerVelocity(input.referrerId);
				signals.push(...velocitySignals.signals);
				score += velocitySignals.score;
			}

			// 4. Check email patterns
			if (input.email) {
				const emailSignals = this.checkEmailPatterns(input.email);
				signals.push(...emailSignals.signals);
				score += emailSignals.score;
			}

			// 5. Check for known fraud patterns
			const patternSignals = await this.checkKnownPatterns(input);
			signals.push(...patternSignals.signals);
			score += patternSignals.score;

			// Determine action based on score
			let action: 'allow' | 'hold' | 'reject' = 'allow';
			let holdReason: string | undefined;

			if (score >= FRAUD_THRESHOLDS.critical) {
				action = 'reject';
			} else if (score >= FRAUD_THRESHOLDS.highRisk) {
				action = 'hold';
				holdReason = signals.join(', ');
			}

			this.logger.debug(
				`Fraud check for user ${input.userId}: score=${score}, action=${action}, signals=${signals.join(', ')}`
			);

			return { score, signals, action, holdReason };
		} catch (error) {
			this.logger.error('Error during fraud check:', error);
			// On error, allow but flag for review
			return {
				score: FRAUD_THRESHOLDS.highRisk,
				signals: ['check_error'],
				action: 'hold',
				holdReason: 'Fraud check encountered an error',
			};
		}
	}

	/**
	 * Check IP-based fraud signals
	 */
	private async checkIpSignals(
		ipAddress: string,
		referrerId?: string
	): Promise<{ score: number; signals: string[] }> {
		const db = this.getDb();
		const signals: string[] = [];
		let score = 0;
		const ipHash = this.hashValue(ipAddress);

		// Check how many users registered from this IP
		const [ipCount] = await db
			.select({ count: count() })
			.from(fingerprints)
			.where(eq(fingerprints.ipHash, ipHash));

		if (ipCount.count >= 5) {
			signals.push('same_ip');
			score += FRAUD_SIGNALS.same_ip;
		}

		// Check if IP was used by referrer
		if (referrerId) {
			const [referrerIP] = await db
				.select()
				.from(userFingerprints)
				.innerJoin(fingerprints, eq(userFingerprints.fingerprintId, fingerprints.id))
				.where(and(eq(userFingerprints.userId, referrerId), eq(fingerprints.ipHash, ipHash)))
				.limit(1);

			if (referrerIP) {
				signals.push('same_ip');
				score += FRAUD_SIGNALS.same_ip;
			}
		}

		// Check if IP is from known proxy/VPN ranges
		if (this.isProxyIP(ipAddress)) {
			signals.push('vpn_proxy');
			score += FRAUD_SIGNALS.vpn_proxy;
		}

		return { score, signals };
	}

	/**
	 * Check device fingerprint signals
	 */
	private async checkFingerprintSignals(
		deviceHash: string,
		referrerId?: string
	): Promise<{ score: number; signals: string[] }> {
		const db = this.getDb();
		const signals: string[] = [];
		let score = 0;

		// Check how many users share this device
		const [fpCount] = await db
			.select({ count: count() })
			.from(userFingerprints)
			.innerJoin(fingerprints, eq(userFingerprints.fingerprintId, fingerprints.id))
			.where(eq(fingerprints.deviceHash, deviceHash));

		if (fpCount.count >= 3) {
			signals.push('same_device');
			score += FRAUD_SIGNALS.same_device;
		}

		// Check if device was used by referrer
		if (referrerId) {
			const [referrerDevice] = await db
				.select()
				.from(userFingerprints)
				.innerJoin(fingerprints, eq(userFingerprints.fingerprintId, fingerprints.id))
				.where(
					and(eq(userFingerprints.userId, referrerId), eq(fingerprints.deviceHash, deviceHash))
				)
				.limit(1);

			if (referrerDevice) {
				signals.push('same_device');
				score += FRAUD_SIGNALS.same_device;
			}
		}

		return { score, signals };
	}

	/**
	 * Check referrer velocity (too many referrals too fast)
	 */
	private async checkReferrerVelocity(
		referrerId: string
	): Promise<{ score: number; signals: string[] }> {
		const db = this.getDb();
		const signals: string[] = [];
		let score = 0;

		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

		// Check referrals in last day
		const [dailyCount] = await db
			.select({ count: count() })
			.from(relationships)
			.where(
				and(eq(relationships.referrerId, referrerId), gte(relationships.createdAt, oneDayAgo))
			);

		if (dailyCount.count >= RATE_LIMITS.registrationsPerReferrer.limit) {
			signals.push('rapid_registration');
			score += FRAUD_SIGNALS.rapid_registration;
		}

		if (dailyCount.count >= 10) {
			signals.push('bulk_registrations');
			score += FRAUD_SIGNALS.bulk_registrations;
		}

		return { score, signals };
	}

	/**
	 * Check email patterns for fraud indicators
	 */
	private checkEmailPatterns(email: string): { score: number; signals: string[] } {
		const signals: string[] = [];
		let score = 0;

		const lowerEmail = email.toLowerCase();

		// Check for disposable email domains
		const disposableDomains = [
			'tempmail.com',
			'throwaway.com',
			'guerrillamail.com',
			'10minutemail.com',
			'mailinator.com',
			'yopmail.com',
			'fakeinbox.com',
			'trashmail.com',
		];

		const domain = lowerEmail.split('@')[1];
		if (disposableDomains.some((d) => domain?.includes(d))) {
			signals.push('disposable_email');
			score += FRAUD_SIGNALS.disposable_email;
		}

		// Check for plus-addressing pattern abuse (test+1@gmail.com)
		if (lowerEmail.includes('+') && /\+\d+@/.test(lowerEmail)) {
			signals.push('similar_email');
			score += FRAUD_SIGNALS.similar_email;
		}

		return { score, signals };
	}

	/**
	 * Check for known fraud patterns in database
	 */
	private async checkKnownPatterns(
		input: FraudCheckInput
	): Promise<{ score: number; signals: string[] }> {
		const db = this.getDb();
		const signals: string[] = [];
		let score = 0;

		if (!input.email) {
			return { score, signals };
		}

		const domain = input.email.split('@')[1];
		if (!domain) {
			return { score, signals };
		}

		// Check for known bad email domains
		const patterns = await db
			.select()
			.from(fraudPatterns)
			.where(
				and(
					eq(fraudPatterns.isActive, true),
					eq(fraudPatterns.patternType, 'email_domain'),
					eq(fraudPatterns.patternValue, domain)
				)
			);

		for (const pattern of patterns) {
			signals.push(`known_pattern_${pattern.patternType}`);
			score += pattern.scoreImpact;
		}

		return { score, signals };
	}

	/**
	 * Simple check for proxy/VPN IPs
	 */
	private isProxyIP(_ip: string): boolean {
		// In production, use services like IPQualityScore, MaxMind, or IP2Proxy
		// For now, return false (disabled)
		return false;
	}

	/**
	 * Store device fingerprint for a user
	 */
	async storeFingerprint(userId: string, data: FingerprintData): Promise<void> {
		const db = this.getDb();

		try {
			const ipHash = this.hashValue(data.ipAddress);
			const deviceHash = data.deviceHash || null;
			const userAgentHash = data.userAgent ? this.hashValue(data.userAgent) : null;

			// Check if fingerprint already exists
			let [existingFp] = await db
				.select()
				.from(fingerprints)
				.where(
					and(
						eq(fingerprints.ipHash, ipHash),
						deviceHash
							? eq(fingerprints.deviceHash, deviceHash)
							: sql`${fingerprints.deviceHash} IS NULL`
					)
				)
				.limit(1);

			if (!existingFp) {
				// Create new fingerprint
				[existingFp] = await db
					.insert(fingerprints)
					.values({
						ipHash,
						deviceHash,
						userAgentHash,
						firstSeenAt: new Date(),
						lastSeenAt: new Date(),
						registrationCount: 1,
					})
					.returning();
			} else {
				// Update existing
				await db
					.update(fingerprints)
					.set({
						lastSeenAt: new Date(),
						registrationCount: sql`${fingerprints.registrationCount} + 1`,
					})
					.where(eq(fingerprints.id, existingFp.id));
			}

			// Link fingerprint to user (check if exists first)
			const [existingLink] = await db
				.select()
				.from(userFingerprints)
				.where(
					and(
						eq(userFingerprints.userId, userId),
						eq(userFingerprints.fingerprintId, existingFp.id)
					)
				)
				.limit(1);

			if (!existingLink) {
				await db.insert(userFingerprints).values({
					userId,
					fingerprintId: existingFp.id,
					seenAt: new Date(),
					context: 'registration',
				});
			}
		} catch (error) {
			this.logger.error('Error storing fingerprint:', error);
		}
	}

	/**
	 * Add item to review queue
	 */
	async addToReviewQueue(
		relationshipId: string,
		fraudScore: number,
		signals: string[],
		_reason: string
	): Promise<void> {
		const db = this.getDb();

		try {
			const priority =
				fraudScore >= FRAUD_THRESHOLDS.critical
					? 'critical'
					: fraudScore >= FRAUD_THRESHOLDS.highRisk
						? 'high'
						: fraudScore >= FRAUD_THRESHOLDS.mediumRisk
							? 'medium'
							: 'low';

			await db.insert(reviewQueue).values({
				relationshipId,
				fraudScore,
				fraudSignals: JSON.stringify(signals),
				priority,
				status: 'pending',
				createdAt: new Date(),
			});
		} catch (error) {
			this.logger.error('Error adding to review queue:', error);
		}
	}

	/**
	 * Get pending review items
	 */
	async getPendingReviews(limit = 50, offset = 0): Promise<ReviewQueueItem[]> {
		const db = this.getDb();

		return db
			.select()
			.from(reviewQueue)
			.where(eq(reviewQueue.status, 'pending'))
			.orderBy(desc(reviewQueue.fraudScore), reviewQueue.createdAt)
			.limit(limit)
			.offset(offset);
	}

	/**
	 * Process review decision
	 */
	async processReview(
		reviewId: string,
		decision: 'approved' | 'rejected',
		_reviewerId: string,
		notes?: string
	): Promise<void> {
		const db = this.getDb();

		await db
			.update(reviewQueue)
			.set({
				status: decision,
				reviewedAt: new Date(),
				notes,
			})
			.where(eq(reviewQueue.id, reviewId));

		// Get review to find relationship
		const [review] = await db
			.select()
			.from(reviewQueue)
			.where(eq(reviewQueue.id, reviewId))
			.limit(1);

		if (!review) return;

		if (decision === 'approved') {
			// Reset fraud score
			await db
				.update(relationships)
				.set({ fraudScore: 0, isFlagged: false })
				.where(eq(relationships.id, review.relationshipId));
		} else if (decision === 'rejected') {
			// Mark as fraudulent
			await db
				.update(relationships)
				.set({ fraudScore: 100, isFlagged: true })
				.where(eq(relationships.id, review.relationshipId));
		}
	}

	/**
	 * Add a fraud pattern to the database
	 */
	async addFraudPattern(
		patternType: 'email_domain' | 'ip_range' | 'device_pattern',
		patternValue: string,
		severity: 'low' | 'medium' | 'high' | 'critical',
		scoreImpact: number,
		description: string,
		createdBy: string
	): Promise<void> {
		const db = this.getDb();

		await db.insert(fraudPatterns).values({
			patternType,
			patternValue,
			severity,
			scoreImpact,
			description,
			createdBy,
			isActive: true,
			createdAt: new Date(),
		});
	}

	/**
	 * Check rate limit for an action
	 */
	async checkRateLimit(
		identifier: string,
		identifierType: string,
		action: string,
		limit: number,
		windowMinutes: number
	): Promise<{ allowed: boolean; remaining: number }> {
		const db = this.getDb();

		const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
		const windowEnd = new Date(Date.now() + windowMinutes * 60 * 1000);

		const [record] = await db
			.select()
			.from(rateLimits)
			.where(
				and(
					eq(rateLimits.identifier, identifier),
					eq(rateLimits.identifierType, identifierType),
					eq(rateLimits.action, action),
					gte(rateLimits.windowStart, windowStart)
				)
			)
			.limit(1);

		if (!record) {
			// Create new rate limit record
			await db.insert(rateLimits).values({
				identifier,
				identifierType,
				action,
				count: 1,
				windowStart: new Date(),
				windowEnd,
			});

			return { allowed: true, remaining: limit - 1 };
		}

		if (record.count >= limit) {
			return { allowed: false, remaining: 0 };
		}

		// Increment count
		await db
			.update(rateLimits)
			.set({ count: record.count + 1 })
			.where(eq(rateLimits.id, record.id));

		return { allowed: true, remaining: limit - record.count - 1 };
	}

	/**
	 * Get fraud statistics for admin dashboard
	 */
	async getFraudStats(): Promise<{
		pendingReviews: number;
		rejectedToday: number;
		flaggedReferrals: number;
	}> {
		const db = this.getDb();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Count pending reviews
		const [pendingCount] = await db
			.select({ count: count() })
			.from(reviewQueue)
			.where(eq(reviewQueue.status, 'pending'));

		// Count rejected today
		const [rejectedCount] = await db
			.select({ count: count() })
			.from(reviewQueue)
			.where(and(eq(reviewQueue.status, 'rejected'), gte(reviewQueue.reviewedAt, today)));

		// Count flagged referrals
		const [flaggedCount] = await db
			.select({ count: count() })
			.from(relationships)
			.where(eq(relationships.isFlagged, true));

		return {
			pendingReviews: pendingCount.count,
			rejectedToday: rejectedCount.count,
			flaggedReferrals: flaggedCount.count,
		};
	}
}
