import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { items } from './items.schema';

export const locations = pgTable('locations', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	parentLocationId: uuid('parent_location_id'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locationsRelations = relations(locations, ({ one, many }) => ({
	parent: one(locations, {
		fields: [locations.parentLocationId],
		references: [locations.id],
		relationName: 'locationHierarchy',
	}),
	children: many(locations, { relationName: 'locationHierarchy' }),
	items: many(items),
}));

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
