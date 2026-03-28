/**
 * Login Attempts Schema
 *
 * Tracks login attempts for account lockout functionality.
 * Failed attempts within a time window trigger account lockout.
 */

import { pgSchema, text, boolean, timestamp, index, serial } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const loginAttempts = authSchema.table(
	'login_attempts',
	{
		id: serial('id').primaryKey(),
		email: text('email').notNull(),
		ipAddress: text('ip_address'),
		successful: boolean('successful').default(false).notNull(),
		attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('login_attempts_email_attempted_at_idx').on(table.email, table.attemptedAt)]
);
