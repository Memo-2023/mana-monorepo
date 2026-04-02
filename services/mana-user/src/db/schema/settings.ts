import { text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { usrSchema } from './schema';

export const userSettings = usrSchema.table('user_settings', {
	userId: text('user_id').primaryKey(),
	globalSettings: jsonb('global_settings')
		.default({
			nav: { desktopPosition: 'top', sidebarCollapsed: false },
			theme: { mode: 'system', colorScheme: 'ocean' },
			locale: 'de',
		})
		.notNull(),
	appOverrides: jsonb('app_overrides').default({}).notNull(),
	deviceSettings: jsonb('device_settings').default({}).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
