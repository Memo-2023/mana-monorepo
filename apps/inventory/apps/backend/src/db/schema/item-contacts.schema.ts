import { pgTable, uuid, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { items } from './items.schema';

export const itemContacts = pgTable(
	'item_contacts',
	{
		itemId: uuid('item_id')
			.notNull()
			.references(() => items.id, { onDelete: 'cascade' }),
		contactId: uuid('contact_id').notNull(),
		relationshipType: varchar('relationship_type', { length: 20 }).default('seller').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.itemId, table.contactId] }),
	})
);

export const itemContactsRelations = relations(itemContacts, ({ one }) => ({
	item: one(items, {
		fields: [itemContacts.itemId],
		references: [items.id],
	}),
}));

export type ItemContact = typeof itemContacts.$inferSelect;
export type NewItemContact = typeof itemContacts.$inferInsert;
