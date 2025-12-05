import {
	pgTable,
	uuid,
	varchar,
	text,
	boolean,
	timestamp,
	decimal,
	date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories.schema';
import { locations } from './locations.schema';
import { itemPhotos } from './item-photos.schema';
import { itemDocuments } from './item-documents.schema';
import { itemContacts } from './item-contacts.schema';

export const items = pgTable('items', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	sku: varchar('sku', { length: 100 }),
	categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
	locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
	purchaseDate: date('purchase_date'),
	purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
	currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
	currentValue: decimal('current_value', { precision: 12, scale: 2 }),
	condition: varchar('condition', { length: 20 }).default('good').notNull(),
	warrantyExpires: date('warranty_expires'),
	warrantyNotes: text('warranty_notes'),
	notes: text('notes'),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).default('1').notNull(),
	isFavorite: boolean('is_favorite').default(false).notNull(),
	isArchived: boolean('is_archived').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
	category: one(categories, {
		fields: [items.categoryId],
		references: [categories.id],
	}),
	location: one(locations, {
		fields: [items.locationId],
		references: [locations.id],
	}),
	photos: many(itemPhotos),
	documents: many(itemDocuments),
	contacts: many(itemContacts),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
