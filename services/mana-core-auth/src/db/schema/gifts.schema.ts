/**
 * Gifts Schema
 *
 * Database schema for user-generated gift codes including:
 * - Gift codes (simple, personalized, split, first_come, riddle)
 * - Gift redemptions tracking
 * - Credit reservations and releases
 */

import {
	pgSchema,
	uuid,
	text,
	timestamp,
	integer,
	index,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const giftsSchema = pgSchema('gifts');

// ============================================
// ENUMS
// ============================================

export const giftCodeTypeEnum = pgEnum('gift_code_type', [
	'simple',
	'personalized',
	'split',
	'first_come',
	'riddle',
]);

export const giftCodeStatusEnum = pgEnum('gift_code_status', [
	'active',
	'depleted',
	'expired',
	'cancelled',
	'refunded',
]);

export const giftRedemptionStatusEnum = pgEnum('gift_redemption_status', [
	'success',
	'failed_wrong_answer',
	'failed_wrong_user',
	'failed_depleted',
	'failed_expired',
	'failed_already_claimed',
]);

// ============================================
// TABLES
// ============================================

/**
 * Gift Codes
 *
 * User-generated codes for gifting credits.
 * Supports various modes: simple, personalized, split, first_come, riddle
 */
export const giftCodes = giftsSchema.table(
	'gift_codes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		code: text('code').notNull().unique(), // 6-char code like "ABC123"
		shortUrl: text('short_url'), // mana.how/g/ABC123

		creatorId: text('creator_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Credit allocation
		totalCredits: integer('total_credits').notNull(), // Total reserved credits
		creditsPerPortion: integer('credits_per_portion').notNull(), // Credits per redemption
		totalPortions: integer('total_portions').notNull().default(1), // Number of portions (1 = simple)
		claimedPortions: integer('claimed_portions').notNull().default(0), // Portions redeemed

		// Type and status
		type: giftCodeTypeEnum('type').notNull().default('simple'),
		status: giftCodeStatusEnum('status').notNull().default('active'),

		// Personalization (for 'personalized' type)
		targetEmail: text('target_email'),
		targetMatrixId: text('target_matrix_id'),

		// Riddle (for 'riddle' type)
		riddleQuestion: text('riddle_question'),
		riddleAnswerHash: text('riddle_answer_hash'), // bcrypt hash of answer

		// Message
		message: text('message'),

		// Expiration
		expiresAt: timestamp('expires_at', { withTimezone: true }),

		// Reference to credit reservation transaction
		reservationTransactionId: uuid('reservation_transaction_id'),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		codeLookupIdx: index('gift_codes_code_idx').on(table.code),
		creatorIdx: index('gift_codes_creator_idx').on(table.creatorId),
		statusIdx: index('gift_codes_status_idx').on(table.status),
		expiresAtIdx: index('gift_codes_expires_at_idx').on(table.expiresAt),
	})
);

/**
 * Gift Redemptions
 *
 * Tracks each redemption attempt and success.
 */
export const giftRedemptions = giftsSchema.table(
	'gift_redemptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		giftCodeId: uuid('gift_code_id')
			.notNull()
			.references(() => giftCodes.id, { onDelete: 'cascade' }),
		redeemerUserId: text('redeemer_user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Redemption result
		status: giftRedemptionStatusEnum('status').notNull(),
		creditsReceived: integer('credits_received').notNull().default(0),
		portionNumber: integer('portion_number'), // Which portion was claimed (for split/first_come)

		// Reference to credit transaction
		creditTransactionId: uuid('credit_transaction_id'),

		// Source tracking
		sourceAppId: text('source_app_id'), // 'matrix-bot', 'web', etc.

		// Timestamp
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		giftCodeIdx: index('gift_redemptions_gift_code_idx').on(table.giftCodeId),
		redeemerIdx: index('gift_redemptions_redeemer_idx').on(table.redeemerUserId),
		statusIdx: index('gift_redemptions_status_idx').on(table.status),
	})
);

// ============================================
// TYPE EXPORTS
// ============================================

export type GiftCode = typeof giftCodes.$inferSelect;
export type NewGiftCode = typeof giftCodes.$inferInsert;

export type GiftRedemption = typeof giftRedemptions.$inferSelect;
export type NewGiftRedemption = typeof giftRedemptions.$inferInsert;

// ============================================
// CONSTANTS
// ============================================

/**
 * Characters used for gift code generation (uppercase, no ambiguous chars)
 */
export const GIFT_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Default gift code length
 */
export const GIFT_CODE_LENGTH = 6;

/**
 * Gift code validation rules
 */
export const GIFT_CODE_RULES = {
	minCredits: 1,
	maxCredits: 10000,
	maxPortions: 100,
	maxMessageLength: 500,
	maxRiddleQuestionLength: 200,
	defaultExpirationDays: 90,
} as const;
