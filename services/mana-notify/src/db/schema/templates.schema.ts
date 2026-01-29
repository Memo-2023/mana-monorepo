import {
	pgSchema,
	uuid,
	text,
	varchar,
	boolean,
	timestamp,
	index,
	jsonb,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { notifySchema, channelEnum } from './notifications.schema';

export const templates = notifySchema.table(
	'templates',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Identification
		slug: varchar('slug', { length: 100 }).notNull(), // e.g. "auth-password-reset"
		appId: varchar('app_id', { length: 50 }), // NULL = system template

		// Channel & Content
		channel: channelEnum('channel').notNull(),
		subject: varchar('subject', { length: 500 }), // Handlebars template
		bodyTemplate: text('body_template').notNull(), // Handlebars template

		// Localization
		locale: varchar('locale', { length: 10 }).notNull().default('de-DE'),

		// Settings
		isActive: boolean('is_active').notNull().default(true),
		isSystem: boolean('is_system').notNull().default(false), // System templates cannot be deleted

		// Metadata
		variables: jsonb('variables').$type<Record<string, string>>(), // Expected variables with descriptions

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		slugLocaleIdx: uniqueIndex('templates_slug_locale_idx').on(table.slug, table.locale),
		appIdIdx: index('templates_app_id_idx').on(table.appId),
		channelIdx: index('templates_channel_idx').on(table.channel),
	})
);

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
