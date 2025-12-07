/**
 * Referrals Schema
 *
 * Database schema for the ManaCore referral system including:
 * - Referral codes (auto, custom, campaign)
 * - Referral relationships and stage tracking
 * - User tiers and bonus multipliers
 * - Cross-app activation tracking
 * - Fraud detection (fingerprints, patterns, rate limits)
 * - Analytics and review queue
 */

import {
	pgSchema,
	uuid,
	text,
	timestamp,
	boolean,
	integer,
	real,
	index,
	unique,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const referralsSchema = pgSchema('referrals');

// ============================================
// ENUMS
// ============================================

export const referralCodeTypeEnum = pgEnum('referral_code_type', ['auto', 'custom', 'campaign']);

export const referralStatusEnum = pgEnum('referral_status', [
	'registered',
	'activated',
	'qualified',
	'retained',
]);

export const referralTierEnum = pgEnum('referral_tier', ['bronze', 'silver', 'gold', 'platinum']);

export const bonusEventTypeEnum = pgEnum('bonus_event_type', [
	'registered',
	'activated',
	'qualified',
	'retained',
	'cross_app',
]);

export const bonusStatusEnum = pgEnum('bonus_status', ['pending', 'paid', 'held', 'rejected']);

export const fraudPatternTypeEnum = pgEnum('fraud_pattern_type', [
	'email_domain',
	'ip_range',
	'device_pattern',
]);

export const fraudSeverityEnum = pgEnum('fraud_severity', ['low', 'medium', 'high', 'critical']);

export const reviewStatusEnum = pgEnum('review_status', [
	'pending',
	'approved',
	'rejected',
	'escalated',
]);

// ============================================
// CORE TABLES
// ============================================

/**
 * Referral Codes
 *
 * Global unique codes that users can share.
 * Types: auto (generated), custom (user-created), campaign (admin-created)
 */
export const codes = referralsSchema.table(
	'codes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		code: text('code').notNull().unique(), // Global unique
		type: referralCodeTypeEnum('type').notNull().default('auto'),
		sourceAppId: text('source_app_id'), // App where code was created
		isActive: boolean('is_active').default(true).notNull(),
		usesCount: integer('uses_count').default(0).notNull(),
		maxUses: integer('max_uses'), // NULL = unlimited
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		metadata: text('metadata'), // JSON string for flexibility
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		codeLookupIdx: index('codes_lookup_idx').on(table.code),
		userIdx: index('codes_user_idx').on(table.userId),
		activeIdx: index('codes_active_idx').on(table.isActive),
	})
);

/**
 * Referral Relationships
 *
 * Tracks the relationship between referrer and referee.
 * A user can only be referred once (referee_id is unique).
 */
export const relationships = referralsSchema.table(
	'relationships',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		referrerId: text('referrer_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		refereeId: text('referee_id')
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: 'cascade' }),
		codeId: uuid('code_id')
			.notNull()
			.references(() => codes.id, { onDelete: 'restrict' }),
		sourceAppId: text('source_app_id'), // App where referral link was used

		// Stage Tracking
		status: referralStatusEnum('status').notNull().default('registered'),
		registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
		activatedAt: timestamp('activated_at', { withTimezone: true }),
		qualifiedAt: timestamp('qualified_at', { withTimezone: true }),
		retainedAt: timestamp('retained_at', { withTimezone: true }),

		// Fraud Detection
		fraudScore: integer('fraud_score').default(0).notNull(),
		fraudSignals: text('fraud_signals'), // JSON array of signal names
		isFlagged: boolean('is_flagged').default(false).notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		referrerIdx: index('relationships_referrer_idx').on(table.referrerId),
		refereeIdx: index('relationships_referee_idx').on(table.refereeId),
		statusIdx: index('relationships_status_idx').on(table.status),
		flaggedIdx: index('relationships_flagged_idx').on(table.isFlagged),
		codeIdx: index('relationships_code_idx').on(table.codeId),
	})
);

/**
 * Cross-App Activations
 *
 * Tracks when a referred user uses a new app for the first time.
 * One bonus per app per referral relationship.
 */
export const crossAppActivations = referralsSchema.table(
	'cross_app_activations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		relationshipId: uuid('relationship_id')
			.notNull()
			.references(() => relationships.id, { onDelete: 'cascade' }),
		appId: text('app_id').notNull(),
		activatedAt: timestamp('activated_at', { withTimezone: true }).defaultNow().notNull(),
		bonusPaid: boolean('bonus_paid').default(false).notNull(),
	},
	(table) => ({
		relationshipAppUnique: unique('cross_app_relationship_app_unique').on(
			table.relationshipId,
			table.appId
		),
		relationshipIdx: index('cross_app_relationship_idx').on(table.relationshipId),
	})
);

/**
 * User Tiers
 *
 * Tracks each user's referral tier status based on lifetime qualified referrals.
 * Tiers: bronze (0-4), silver (5-14), gold (15-29), platinum (30+)
 */
export const userTiers = referralsSchema.table('user_tiers', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	tier: referralTierEnum('tier').notNull().default('bronze'),
	qualifiedCount: integer('qualified_count').default(0).notNull(), // Lifetime qualified referrals
	totalEarned: integer('total_earned').default(0).notNull(), // Lifetime credits from referrals
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================
// BONUS TABLES
// ============================================

/**
 * Bonus Events
 *
 * Audit trail of all referral bonuses.
 * Links to credits.transactions for the actual credit transfer.
 */
export const bonusEvents = referralsSchema.table(
	'bonus_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		relationshipId: uuid('relationship_id')
			.notNull()
			.references(() => relationships.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		eventType: bonusEventTypeEnum('event_type').notNull(),
		appId: text('app_id'), // For cross_app events

		// Credit calculation
		creditsBase: integer('credits_base').notNull(), // Base credits before multiplier
		tierMultiplier: real('tier_multiplier').notNull().default(1.0),
		creditsFinal: integer('credits_final').notNull(), // After multiplier (rounded)
		tierAtTime: referralTierEnum('tier_at_time').notNull(),

		// Transaction reference (to credits.transactions)
		transactionId: uuid('transaction_id'),

		// Hold status for fraud detection
		status: bonusStatusEnum('status').notNull().default('pending'),
		holdReason: text('hold_reason'),
		holdUntil: timestamp('hold_until', { withTimezone: true }),
		releasedAt: timestamp('released_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		relationshipIdx: index('bonus_events_relationship_idx').on(table.relationshipId),
		userIdx: index('bonus_events_user_idx').on(table.userId),
		statusIdx: index('bonus_events_status_idx').on(table.status),
		eventTypeIdx: index('bonus_events_event_type_idx').on(table.eventType),
	})
);

// ============================================
// FRAUD DETECTION TABLES
// ============================================

/**
 * Fingerprints
 *
 * Stores hashed IP and device fingerprints for fraud detection.
 * IPs are hashed for privacy (GDPR compliance).
 */
export const fingerprints = referralsSchema.table(
	'fingerprints',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		// IP data (hashed for privacy)
		ipHash: text('ip_hash').notNull(),
		ipType: text('ip_type').default('unknown').notNull(), // residential, datacenter, vpn, proxy, tor
		ipCountry: text('ip_country'),
		ipAsn: text('ip_asn'),

		// Device data
		deviceHash: text('device_hash'),
		userAgentHash: text('user_agent_hash'),

		// Stats
		firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
		registrationCount: integer('registration_count').default(0).notNull(),
		flaggedCount: integer('flagged_count').default(0).notNull(),
	},
	(table) => ({
		ipHashIdx: index('fingerprints_ip_hash_idx').on(table.ipHash),
		deviceHashIdx: index('fingerprints_device_hash_idx').on(table.deviceHash),
		ipDeviceUnique: unique('fingerprints_ip_device_unique').on(table.ipHash, table.deviceHash),
	})
);

/**
 * User Fingerprints
 *
 * Links users to fingerprints they've been seen from.
 * Helps detect multi-account fraud.
 */
export const userFingerprints = referralsSchema.table(
	'user_fingerprints',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		fingerprintId: uuid('fingerprint_id')
			.notNull()
			.references(() => fingerprints.id, { onDelete: 'cascade' }),
		seenAt: timestamp('seen_at', { withTimezone: true }).defaultNow().notNull(),
		context: text('context'), // registration, login, code_validation
	},
	(table) => ({
		pk: unique('user_fingerprints_pk').on(table.userId, table.fingerprintId),
		userIdx: index('user_fingerprints_user_idx').on(table.userId),
		fingerprintIdx: index('user_fingerprints_fingerprint_idx').on(table.fingerprintId),
	})
);

/**
 * Fraud Patterns
 *
 * Admin-defined patterns for fraud detection.
 * Examples: blocked email domains, suspicious IP ranges.
 */
export const fraudPatterns = referralsSchema.table(
	'fraud_patterns',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		patternType: fraudPatternTypeEnum('pattern_type').notNull(),
		patternValue: text('pattern_value').notNull(), // Regex or exact match
		severity: fraudSeverityEnum('severity').notNull().default('medium'),
		scoreImpact: integer('score_impact').notNull(), // Points added to fraud score
		description: text('description'),
		isActive: boolean('is_active').default(true).notNull(),
		createdBy: text('created_by'), // Admin user ID
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		activeIdx: index('fraud_patterns_active_idx').on(table.isActive),
		typeIdx: index('fraud_patterns_type_idx').on(table.patternType),
	})
);

/**
 * Rate Limits
 *
 * Tracks rate limit counters for fraud prevention.
 * Uses sliding window approach.
 */
export const rateLimits = referralsSchema.table(
	'rate_limits',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		identifier: text('identifier').notNull(), // IP, user ID, or code
		identifierType: text('identifier_type').notNull(), // ip, user, code
		action: text('action').notNull(), // code_validation, code_creation, registration
		count: integer('count').default(1).notNull(),
		windowStart: timestamp('window_start', { withTimezone: true }).defaultNow().notNull(),
		windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
	},
	(table) => ({
		lookupIdx: index('rate_limits_lookup_idx').on(
			table.identifier,
			table.identifierType,
			table.action
		),
		windowIdx: index('rate_limits_window_idx').on(table.windowEnd),
	})
);

/**
 * Review Queue
 *
 * Referrals flagged for manual review by admins.
 */
export const reviewQueue = referralsSchema.table(
	'review_queue',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		relationshipId: uuid('relationship_id')
			.notNull()
			.references(() => relationships.id, { onDelete: 'cascade' }),
		fraudScore: integer('fraud_score').notNull(),
		fraudSignals: text('fraud_signals').notNull(), // JSON array
		priority: fraudSeverityEnum('priority').notNull().default('medium'),
		status: reviewStatusEnum('status').notNull().default('pending'),
		assignedTo: text('assigned_to'), // Admin user ID
		notes: text('notes'),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		statusPriorityIdx: index('review_queue_status_priority_idx').on(table.status, table.priority),
		relationshipIdx: index('review_queue_relationship_idx').on(table.relationshipId),
	})
);

// ============================================
// ANALYTICS TABLES
// ============================================

/**
 * Daily Stats
 *
 * Aggregated daily statistics for dashboard and reporting.
 */
export const dailyStats = referralsSchema.table(
	'daily_stats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		date: timestamp('date', { withTimezone: true }).notNull(),
		appId: text('app_id'), // NULL = global

		registrations: integer('registrations').default(0).notNull(),
		activations: integer('activations').default(0).notNull(),
		qualifications: integer('qualifications').default(0).notNull(),
		retentions: integer('retentions').default(0).notNull(),

		creditsPaid: integer('credits_paid').default(0).notNull(),
		creditsHeld: integer('credits_held').default(0).notNull(),

		fraudBlocked: integer('fraud_blocked').default(0).notNull(),
	},
	(table) => ({
		dateAppIdx: index('daily_stats_date_app_idx').on(table.date, table.appId),
		dateUnique: unique('daily_stats_date_app_unique').on(table.date, table.appId),
	})
);

// ============================================
// TYPE EXPORTS
// ============================================

export type ReferralCode = typeof codes.$inferSelect;
export type NewReferralCode = typeof codes.$inferInsert;

export type ReferralRelationship = typeof relationships.$inferSelect;
export type NewReferralRelationship = typeof relationships.$inferInsert;

export type CrossAppActivation = typeof crossAppActivations.$inferSelect;
export type NewCrossAppActivation = typeof crossAppActivations.$inferInsert;

export type UserTier = typeof userTiers.$inferSelect;
export type NewUserTier = typeof userTiers.$inferInsert;

export type BonusEvent = typeof bonusEvents.$inferSelect;
export type NewBonusEvent = typeof bonusEvents.$inferInsert;

export type Fingerprint = typeof fingerprints.$inferSelect;
export type NewFingerprint = typeof fingerprints.$inferInsert;

export type UserFingerprint = typeof userFingerprints.$inferSelect;
export type NewUserFingerprint = typeof userFingerprints.$inferInsert;

export type FraudPattern = typeof fraudPatterns.$inferSelect;
export type NewFraudPattern = typeof fraudPatterns.$inferInsert;

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;

export type ReviewQueueItem = typeof reviewQueue.$inferSelect;
export type NewReviewQueueItem = typeof reviewQueue.$inferInsert;

export type DailyStat = typeof dailyStats.$inferSelect;
export type NewDailyStat = typeof dailyStats.$inferInsert;

// Tier configuration (for use in services)
export const TIER_CONFIG = {
	bronze: { minQualified: 0, maxQualified: 4, multiplier: 1.0 },
	silver: { minQualified: 5, maxQualified: 14, multiplier: 1.5 },
	gold: { minQualified: 15, maxQualified: 29, multiplier: 2.0 },
	platinum: { minQualified: 30, maxQualified: Infinity, multiplier: 3.0 },
} as const;

// Bonus amounts (base credits before tier multiplier)
export const BONUS_AMOUNTS = {
	registered: { referrer: 5, referee: 25 },
	activated: { referrer: 10, referee: 0 },
	qualified: { referrer: 25, referee: 0 },
	retained: { referrer: 15, referee: 0 },
	cross_app: { referrer: 5, referee: 0 },
} as const;

// Fraud score thresholds
export const FRAUD_THRESHOLDS = {
	lowRisk: 29, // 0-29: auto-pay
	mediumRisk: 59, // 30-59: 48h hold
	highRisk: 89, // 60-89: manual review
	critical: 90, // 90+: blocked
} as const;

// Fraud signal scores
export const FRAUD_SIGNALS = {
	same_ip: 30,
	same_device: 50,
	disposable_email: 20,
	similar_email: 25,
	rapid_registration: 15,
	bulk_registrations: 40,
	vpn_proxy: 20,
	new_account_referrer: 15,
	instant_qualification: 35,
	minimal_activity: 25,
} as const;

// Rate limit configurations
export const RATE_LIMITS = {
	codeValidation: { limit: 20, windowMinutes: 1 },
	codeCreation: { limit: 10, windowMinutes: 60 },
	registrationsPerCode: { limit: 50, windowMinutes: 1440 }, // 24h
	registrationsPerReferrer: { limit: 20, windowMinutes: 1440 }, // 24h
	bonusClaims: { limit: 100, windowMinutes: 1440 }, // 24h
} as const;

// Timing rules (in milliseconds)
export const TIMING_RULES = {
	minTimeToActivation: 5 * 60 * 1000, // 5 minutes
	minTimeToQualification: 24 * 60 * 60 * 1000, // 24 hours
	retentionCheckDays: 30,
	fraudReviewWindowDays: 7,
} as const;

// Trackable apps for cross-app bonus
export const TRACKABLE_APPS = [
	'chat',
	'picture',
	'presi',
	'mail',
	'manadeck',
	'todo',
	'calendar',
	'contacts',
	'finance',
	'clock',
	'zitare',
	'storage',
	'moodlit',
] as const;
