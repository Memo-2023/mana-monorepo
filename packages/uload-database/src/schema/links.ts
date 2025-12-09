import {
	pgTable,
	uuid,
	text,
	boolean,
	integer,
	timestamp,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { accounts } from './accounts.js';
import { workspaces } from './workspaces.js';

export const links = pgTable(
	'links',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		shortCode: text('short_code').unique().notNull(),
		customCode: text('custom_code'),
		originalUrl: text('original_url').notNull(),
		title: text('title'),
		description: text('description'),
		userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
		isActive: boolean('is_active').default(true),
		password: text('password'), // hashed
		maxClicks: integer('max_clicks'),
		expiresAt: timestamp('expires_at'),
		clickCount: integer('click_count').default(0),
		qrCodeUrl: text('qr_code_url'),
		tags: jsonb('tags').$type<string[]>(),
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		accountOwner: uuid('account_owner').references(() => accounts.id),
		workspaceId: uuid('workspace_id').references(() => workspaces.id),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('links_user_id_idx').on(table.userId),
		index('links_short_code_idx').on(table.shortCode),
		index('links_workspace_id_idx').on(table.workspaceId),
		index('links_account_owner_idx').on(table.accountOwner),
		index('links_is_active_idx').on(table.isActive),
	]
);

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
