import {
	pgTable,
	uuid,
	text,
	timestamp,
	doublePrecision,
	jsonb,
	pgEnum,
} from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('location_category', ['sight', 'restaurant', 'shop', 'museum']);

export const locations = pgTable('locations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	category: categoryEnum('category').notNull(),
	description: text('description').notNull(),
	address: text('address'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	imageUrl: text('image_url'),
	timeline: jsonb('timeline').$type<TimelineEntry[]>().default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export interface TimelineEntry {
	year: string;
	event: string;
}

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
