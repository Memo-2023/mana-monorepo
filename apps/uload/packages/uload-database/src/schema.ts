import {
	pgSchema,
	uuid,
	text,
	boolean,
	integer,
	timestamp,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const uloadSchema = pgSchema('uload');

// ============================================
// Users Table
// ============================================
export const users = uloadSchema.table(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		externalAuthId: text('external_auth_id').unique(),
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
	(table) => ({
		emailIdx: index('users_email_idx').on(table.email),
		usernameIdx: index('users_username_idx').on(table.username),
		externalAuthIdIdx: index('users_external_auth_id_idx').on(table.externalAuthId),
	})
);

// ============================================
// Accounts Table
// ============================================
export const accounts = uloadSchema.table(
	'accounts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		owner: uuid('owner')
			.references(() => users.id)
			.notNull(),
		isActive: boolean('is_active').default(true),
		planType: text('plan_type', { enum: ['free', 'team', 'enterprise'] }).default('free'),
		settings: jsonb('settings'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		ownerIdx: index('accounts_owner_idx').on(table.owner),
	})
);

// ============================================
// Workspaces Table
// ============================================
export const workspaces = uloadSchema.table(
	'workspaces',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		slug: text('slug').unique().notNull(),
		type: text('type', { enum: ['personal', 'team'] }).notNull(),
		owner: uuid('owner')
			.references(() => users.id)
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		slugIdx: index('workspaces_slug_idx').on(table.slug),
		ownerIdx: index('workspaces_owner_idx').on(table.owner),
	})
);

// ============================================
// Links Table
// ============================================
export const links = uloadSchema.table(
	'links',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		shortCode: text('short_code').unique().notNull(),
		customCode: text('custom_code'),
		originalUrl: text('original_url').notNull(),
		title: text('title'),
		description: text('description'),
		userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
		isActive: boolean('is_active').default(true),
		password: text('password'),
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
	(table) => ({
		userIdIdx: index('links_user_id_idx').on(table.userId),
		shortCodeIdx: index('links_short_code_idx').on(table.shortCode),
		workspaceIdIdx: index('links_workspace_id_idx').on(table.workspaceId),
		accountOwnerIdx: index('links_account_owner_idx').on(table.accountOwner),
		isActiveIdx: index('links_is_active_idx').on(table.isActive),
	})
);

// ============================================
// Clicks Table
// ============================================
export const clicks = uloadSchema.table(
	'clicks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		linkId: uuid('link_id')
			.references(() => links.id, { onDelete: 'cascade' })
			.notNull(),
		ipHash: text('ip_hash'),
		userAgent: text('user_agent'),
		referer: text('referer'),
		browser: text('browser'),
		deviceType: text('device_type'),
		os: text('os'),
		country: text('country'),
		city: text('city'),
		clickedAt: timestamp('clicked_at').defaultNow().notNull(),
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		linkIdIdx: index('clicks_link_id_idx').on(table.linkId),
		clickedAtIdx: index('clicks_clicked_at_idx').on(table.clickedAt),
		countryIdx: index('clicks_country_idx').on(table.country),
	})
);

// ============================================
// Relations
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
	links: many(links),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
	user: one(users, { fields: [links.userId], references: [users.id] }),
	account: one(accounts, { fields: [links.accountOwner], references: [accounts.id] }),
	workspace: one(workspaces, { fields: [links.workspaceId], references: [workspaces.id] }),
	clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
	link: one(links, { fields: [clicks.linkId], references: [links.id] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	owner: one(users, { fields: [accounts.owner], references: [users.id] }),
	links: many(links),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	owner: one(users, { fields: [workspaces.owner], references: [users.id] }),
	links: many(links),
}));
