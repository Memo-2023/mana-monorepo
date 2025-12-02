import { pgTable, uuid, timestamp, varchar, text, boolean, date, jsonb } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// Basic Info
	firstName: varchar('first_name', { length: 100 }),
	lastName: varchar('last_name', { length: 100 }),
	displayName: varchar('display_name', { length: 200 }),
	nickname: varchar('nickname', { length: 100 }),

	// Contact Details
	email: varchar('email', { length: 255 }),
	phone: varchar('phone', { length: 50 }),
	mobile: varchar('mobile', { length: 50 }),

	// Address
	street: varchar('street', { length: 255 }),
	city: varchar('city', { length: 100 }),
	postalCode: varchar('postal_code', { length: 20 }),
	country: varchar('country', { length: 100 }),

	// Organization
	company: varchar('company', { length: 200 }),
	jobTitle: varchar('job_title', { length: 200 }),
	department: varchar('department', { length: 200 }),

	// Additional
	website: varchar('website', { length: 500 }),
	birthday: date('birthday'),
	notes: text('notes'),
	photoUrl: varchar('photo_url', { length: 500 }),

	// Flags
	isFavorite: boolean('is_favorite').default(false),
	isArchived: boolean('is_archived').default(false),

	// Manacore Integration
	organizationId: uuid('organization_id'),
	teamId: uuid('team_id'),
	visibility: varchar('visibility', { length: 20 }).default('private'),
	createdBy: varchar('created_by', { length: 255 }).notNull(),
	sharedWith: jsonb('shared_with').$type<string[]>().default([]),

	// Metadata
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
