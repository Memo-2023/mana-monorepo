import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { items } from './items.schema';

export const itemDocuments = pgTable('item_documents', {
	id: uuid('id').defaultRandom().primaryKey(),
	itemId: uuid('item_id')
		.notNull()
		.references(() => items.id, { onDelete: 'cascade' }),
	storageKey: varchar('storage_key', { length: 500 }).notNull(),
	documentType: varchar('document_type', { length: 20 }).default('other').notNull(),
	filename: varchar('filename', { length: 255 }).notNull(),
	mimeType: varchar('mime_type', { length: 100 }),
	fileSize: integer('file_size'),
	uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const itemDocumentsRelations = relations(itemDocuments, ({ one }) => ({
	item: one(items, {
		fields: [itemDocuments.itemId],
		references: [items.id],
	}),
}));

export type ItemDocument = typeof itemDocuments.$inferSelect;
export type NewItemDocument = typeof itemDocuments.$inferInsert;
