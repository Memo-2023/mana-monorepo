import { pgTable, uuid, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';

export const userSettings = pgTable(
	'user_settings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull().unique(),

		// Currency
		defaultCurrency: varchar('default_currency', { length: 3 }).default('EUR').notNull(),

		// Locale
		locale: varchar('locale', { length: 10 }).default('de-DE').notNull(),

		// Date format
		dateFormat: varchar('date_format', { length: 20 }).default('dd.MM.yyyy').notNull(),

		// Week start (0 = Sunday, 1 = Monday)
		weekStartsOn: integer('week_starts_on').default(1).notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('user_settings_user_idx').on(table.userId),
	})
);

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
