import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { items } from './items.schema';

export const itemPhotos = pgTable('item_photos', {
	id: uuid('id').defaultRandom().primaryKey(),
	itemId: uuid('item_id')
		.notNull()
		.references(() => items.id, { onDelete: 'cascade' }),
	storageKey: varchar('storage_key', { length: 500 }).notNull(),
	isPrimary: boolean('is_primary').default(false).notNull(),
	caption: text('caption'),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const itemPhotosRelations = relations(itemPhotos, ({ one }) => ({
	item: one(items, {
		fields: [itemPhotos.itemId],
		references: [items.id],
	}),
}));

export type ItemPhoto = typeof itemPhotos.$inferSelect;
export type NewItemPhoto = typeof itemPhotos.$inferInsert;
