import { pgTable, uuid, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { emailAccounts } from './email-accounts.schema';
import { emails } from './emails.schema';

export const labels = pgTable('labels', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	accountId: uuid('account_id').references(() => emailAccounts.id, { onDelete: 'cascade' }),

	name: varchar('name', { length: 100 }).notNull(),
	color: varchar('color', { length: 7 }).notNull(),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailLabels = pgTable(
	'email_labels',
	{
		emailId: uuid('email_id')
			.references(() => emails.id, { onDelete: 'cascade' })
			.notNull(),
		labelId: uuid('label_id')
			.references(() => labels.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.emailId, table.labelId] })]
);

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
