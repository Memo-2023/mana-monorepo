/**
 * Credit Reservations — 2-phase debit for services that need to charge only
 * after a downstream call succeeds (e.g. mana-research provider fan-out).
 *
 * Flow:
 *   reserve()  — deduct balance atomically, row with status='reserved'
 *   commit()   — finalize, row becomes 'committed', ledger entry written
 *   refund()   — restore balance, row becomes 'refunded'
 */

import { pgEnum, text, timestamp, integer, uuid, index } from 'drizzle-orm/pg-core';
import { creditsSchema } from './credits';

export const reservationStatusEnum = pgEnum('reservation_status', [
	'reserved',
	'committed',
	'refunded',
]);

export const creditReservations = creditsSchema.table(
	'reservations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		amount: integer('amount').notNull(),
		reason: text('reason').notNull(),
		status: reservationStatusEnum('status').default('reserved').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	},
	(t) => ({
		userIdx: index('reservations_user_id_idx').on(t.userId),
		statusIdx: index('reservations_status_idx').on(t.status),
	})
);

export type CreditReservation = typeof creditReservations.$inferSelect;
export type NewCreditReservation = typeof creditReservations.$inferInsert;
