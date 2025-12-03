import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		externalAuthId: text('external_auth_id').unique(), // For Mana Core auth
		email: text('email').unique().notNull(),
		username: text('username').unique().notNull(),
		name: text('name'),
		avatarUrl: text('avatar_url'),
		bio: text('bio'),
		location: text('location'),
		website: text('website'),
		github: text('github'),
		twitter: text('twitter'),
		linkedin: text('linkedin'),
		instagram: text('instagram'),
		publicProfile: boolean('public_profile').default(false),
		showClickStats: boolean('show_click_stats').default(true),
		emailNotifications: boolean('email_notifications').default(true),
		defaultExpiry: integer('default_expiry'),
		profileBackground: text('profile_background'),
		verified: boolean('verified').default(false),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('users_email_idx').on(table.email),
		index('users_username_idx').on(table.username),
		index('users_external_auth_id_idx').on(table.externalAuthId),
	]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Relations will be defined in relations.ts to avoid circular imports
