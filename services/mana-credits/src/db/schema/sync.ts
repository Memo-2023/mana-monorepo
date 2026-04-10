/**
 * Sync Billing Schema — sync subscription tracking
 */

import { text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { creditsSchema } from './credits';

// ─── Enums ──────────────────────────────────────────────────

export const syncBillingIntervalEnum = pgEnum('sync_billing_interval', [
	'monthly',
	'quarterly',
	'yearly',
]);

// ─── Tables ─────────────────────────────────────────────────

/** Sync subscriptions — one per user, tracks billing state */
export const syncSubscriptions = creditsSchema.table('sync_subscriptions', {
	userId: text('user_id').primaryKey(),
	active: boolean('active').default(false).notNull(),
	billingInterval: syncBillingIntervalEnum('billing_interval').notNull().default('monthly'),
	amountCharged: integer('amount_charged').notNull().default(30),
	activatedAt: timestamp('activated_at', { withTimezone: true }),
	nextChargeAt: timestamp('next_charge_at', { withTimezone: true }),
	pausedAt: timestamp('paused_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type Exports ───────────────────────────────────────────

export type SyncSubscription = typeof syncSubscriptions.$inferSelect;
export type NewSyncSubscription = typeof syncSubscriptions.$inferInsert;
