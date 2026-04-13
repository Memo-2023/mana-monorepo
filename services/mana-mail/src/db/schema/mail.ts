/**
 * Mail schema — user mailbox settings and AI metadata cache.
 *
 * Actual mail content lives in Stalwart (JMAP). This schema stores:
 * - Account mapping (mana userId → Stalwart account)
 * - AI-generated metadata per thread (summaries, categories)
 */

import {
	pgSchema,
	uuid,
	text,
	timestamp,
	jsonb,
	index,
	boolean,
	integer,
} from 'drizzle-orm/pg-core';

export const mailSchema = pgSchema('mail');

// ─── Accounts ───────────────────────────────────────────────

export const accounts = mailSchema.table(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		email: text('email').notNull().unique(),
		displayName: text('display_name'),
		provider: text('provider').default('stalwart').notNull(),
		isDefault: boolean('is_default').default(true).notNull(),
		signature: text('signature'),
		stalwartAccountId: text('stalwart_account_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('mail_accounts_user_id_idx').on(table.userId),
	})
);

export type MailAccount = typeof accounts.$inferSelect;
export type NewMailAccount = typeof accounts.$inferInsert;

// ─── Thread Metadata (AI cache) ─────────────────────────────

export const threadMetadata = mailSchema.table(
	'thread_metadata',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		accountId: uuid('account_id')
			.notNull()
			.references(() => accounts.id),
		threadId: text('thread_id').notNull(),
		summary: text('summary'),
		category: text('category'),
		sentiment: text('sentiment'),
		linkedItems: jsonb('linked_items'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		accountThreadIdx: index('mail_thread_metadata_account_thread_idx').on(
			table.accountId,
			table.threadId
		),
	})
);

export type ThreadMetadata = typeof threadMetadata.$inferSelect;
export type NewThreadMetadata = typeof threadMetadata.$inferInsert;
