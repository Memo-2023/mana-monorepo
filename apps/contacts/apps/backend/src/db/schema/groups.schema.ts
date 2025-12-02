import { pgTable, uuid, timestamp, varchar, text, primaryKey } from 'drizzle-orm/pg-core';
import { contacts } from './contacts.schema';

export const contactGroups = pgTable('contact_groups', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	color: varchar('color', { length: 20 }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contactToGroups = pgTable(
	'contact_to_groups',
	{
		contactId: uuid('contact_id')
			.references(() => contacts.id, { onDelete: 'cascade' })
			.notNull(),
		groupId: uuid('group_id')
			.references(() => contactGroups.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.contactId, table.groupId] }),
	})
);

export type ContactGroup = typeof contactGroups.$inferSelect;
export type NewContactGroup = typeof contactGroups.$inferInsert;
export type ContactToGroup = typeof contactToGroups.$inferSelect;
export type NewContactToGroup = typeof contactToGroups.$inferInsert;
