import { pgTable, uuid, timestamp, varchar, primaryKey, index } from 'drizzle-orm/pg-core';
import { contacts } from './contacts.schema';

export const contactTags = pgTable(
	'contact_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: varchar('user_id', { length: 255 }).notNull(),
		name: varchar('name', { length: 50 }).notNull(),
		color: varchar('color', { length: 20 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('contact_tags_user_idx').on(table.userId),
	})
);

export const contactToTags = pgTable(
	'contact_to_tags',
	{
		contactId: uuid('contact_id')
			.references(() => contacts.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => contactTags.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.contactId, table.tagId] }),
		contactIdx: index('contact_to_tags_contact_idx').on(table.contactId),
		tagIdx: index('contact_to_tags_tag_idx').on(table.tagId),
	})
);

export type ContactTag = typeof contactTags.$inferSelect;
export type NewContactTag = typeof contactTags.$inferInsert;
export type ContactToTag = typeof contactToTags.$inferSelect;
export type NewContactToTag = typeof contactToTags.$inferInsert;
