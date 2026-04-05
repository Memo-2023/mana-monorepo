/**
 * Gifts Schema — Gift codes, redemptions
 *
 * Adapted from mana-auth: removed FK references to auth.users.
 * Added denormalized creatorName for display without cross-service calls.
 */

import { pgSchema, uuid, text, timestamp, integer, index, pgEnum } from 'drizzle-orm/pg-core';

export const giftsSchema = pgSchema('gifts');

// ─── Enums ──────────────────────────────────────────────────

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

// ─── Tables ─────────────────────────────────────────────────

/** Gift codes — user-generated codes for gifting credits */
export const giftCodes = giftsSchema.table(
	'gift_codes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		code: text('code').notNull().unique(),
		shortUrl: text('short_url'),

		creatorId: text('creator_id').notNull(),
		creatorName: text('creator_name'), // Denormalized for display

		// Credit allocation
		totalCredits: integer('total_credits').notNull(),
		creditsPerPortion: integer('credits_per_portion').notNull(),
		totalPortions: integer('total_portions').notNull().default(1),
		claimedPortions: integer('claimed_portions').notNull().default(0),

		// Type and status
		type: giftCodeTypeEnum('type').notNull().default('simple'),
		status: giftCodeStatusEnum('status').notNull().default('active'),

		// Personalization
		targetEmail: text('target_email'),
		targetMatrixId: text('target_matrix_id'),

		// Riddle
		riddleQuestion: text('riddle_question'),
		riddleAnswerHash: text('riddle_answer_hash'),

		// Message
		message: text('message'),

		// Expiration
		expiresAt: timestamp('expires_at', { withTimezone: true }),

		// Reference to credit reservation transaction
		reservationTransactionId: uuid('reservation_transaction_id'),

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

/** Gift redemptions — tracks each redemption attempt */
export const giftRedemptions = giftsSchema.table(
	'gift_redemptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		giftCodeId: uuid('gift_code_id')
			.notNull()
			.references(() => giftCodes.id, { onDelete: 'cascade' }),
		redeemerUserId: text('redeemer_user_id').notNull(),

		status: giftRedemptionStatusEnum('status').notNull(),
		creditsReceived: integer('credits_received').notNull().default(0),
		portionNumber: integer('portion_number'),

		creditTransactionId: uuid('credit_transaction_id'),
		sourceAppId: text('source_app_id'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		giftCodeIdx: index('gift_redemptions_gift_code_idx').on(table.giftCodeId),
		redeemerIdx: index('gift_redemptions_redeemer_idx').on(table.redeemerUserId),
		statusIdx: index('gift_redemptions_status_idx').on(table.status),
	})
);

// ─── Type Exports ───────────────────────────────────────────

export type GiftCode = typeof giftCodes.$inferSelect;
export type NewGiftCode = typeof giftCodes.$inferInsert;
export type GiftRedemption = typeof giftRedemptions.$inferSelect;
export type NewGiftRedemption = typeof giftRedemptions.$inferInsert;

// ─── Constants ──────────────────────────────────────────────

export const GIFT_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const GIFT_CODE_LENGTH = 6;

export const GIFT_CODE_RULES = {
	minCredits: 1,
	maxCredits: 10000,
	maxPortions: 100,
	maxMessageLength: 500,
	maxRiddleQuestionLength: 200,
	defaultExpirationDays: 90,
} as const;
