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
import { relations } from 'drizzle-orm';

// ============================================
// Users Table
// ============================================
export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		externalAuthId: text('external_auth_id').unique(), // For external auth provider
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
// Accounts Table (Business/Team Accounts)
// ============================================
export const accounts = pgTable(
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
export const workspaces = pgTable(
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
export const links = pgTable(
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
		password: text('password'), // hashed
		maxClicks: integer('max_clicks'),
		expiresAt: timestamp('expires_at'),
		clickCount: integer('click_count').default(0),
		qrCodeUrl: text('qr_code_url'), // File Storage URL
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
// Clicks Table (Analytics)
// ============================================
export const clicks = pgTable(
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
// Tags Table
// ============================================
export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		color: text('color'),
		icon: text('icon'),
		isPublic: boolean('is_public').default(false),
		usageCount: integer('usage_count').default(0),
		userId: uuid('user_id').references(() => users.id),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('tags_user_id_idx').on(table.userId),
		slugIdx: index('tags_slug_idx').on(table.slug),
	})
);

// ============================================
// Link-Tags Junction Table
// ============================================
export const linkTags = pgTable(
	'link_tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		linkId: uuid('link_id')
			.references(() => links.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		linkIdIdx: index('link_tags_link_id_idx').on(table.linkId),
		tagIdIdx: index('link_tags_tag_id_idx').on(table.tagId),
		uniqueLinkTag: index('link_tags_unique_idx').on(table.linkId, table.tagId),
	})
);

// ============================================
// Notifications Table
// ============================================
export const notifications = pgTable(
	'notifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		type: text('type').notNull(),
		title: text('title').notNull(),
		message: text('message').notNull(),
		data: jsonb('data'),
		read: boolean('read').default(false),
		actionUrl: text('action_url'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('notifications_user_id_idx').on(table.userId),
		readIdx: index('notifications_read_idx').on(table.read),
	})
);

// ============================================
// Shared Access Table (Team Invitations)
// ============================================
export const sharedAccess = pgTable(
	'shared_access',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		owner: uuid('owner')
			.references(() => users.id)
			.notNull(),
		userId: uuid('user_id').references(() => users.id),
		permissions: jsonb('permissions'),
		invitationStatus: text('invitation_status', {
			enum: ['pending', 'accepted', 'declined'],
		}).default('pending'),
		acceptedAt: timestamp('accepted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		ownerIdx: index('shared_access_owner_idx').on(table.owner),
		userIdIdx: index('shared_access_user_id_idx').on(table.userId),
		statusIdx: index('shared_access_status_idx').on(table.invitationStatus),
	})
);

// ============================================
// Pending Invitations Table
// ============================================
export const pendingInvitations = pgTable(
	'pending_invitations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: text('email').notNull(),
		token: text('token').unique().notNull(),
		owner: uuid('owner')
			.references(() => users.id)
			.notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		acceptedAt: timestamp('accepted_at'),
		acceptedBy: uuid('accepted_by').references(() => users.id),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		emailIdx: index('pending_invitations_email_idx').on(table.email),
		tokenIdx: index('pending_invitations_token_idx').on(table.token),
		ownerIdx: index('pending_invitations_owner_idx').on(table.owner),
	})
);

// ============================================
// Feature Requests Table
// ============================================
export const featureRequests = pgTable(
	'feature_requests',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		userId: uuid('user_id')
			.references(() => users.id)
			.notNull(),
		status: text('status', {
			enum: ['pending', 'reviewing', 'planned', 'completed', 'rejected'],
		}).default('pending'),
		voteCount: integer('vote_count').default(0),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('feature_requests_user_id_idx').on(table.userId),
		statusIdx: index('feature_requests_status_idx').on(table.status),
		voteCountIdx: index('feature_requests_vote_count_idx').on(table.voteCount),
	})
);

// ============================================
// Feature Votes Table
// ============================================
export const featureVotes = pgTable(
	'feature_votes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		featureRequestId: uuid('feature_request_id')
			.references(() => featureRequests.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => ({
		featureRequestIdIdx: index('feature_votes_feature_request_id_idx').on(table.featureRequestId),
		userIdIdx: index('feature_votes_user_id_idx').on(table.userId),
		uniqueVote: index('feature_votes_unique_idx').on(table.featureRequestId, table.userId),
	})
);

// ============================================
// Folders Table (minimal usage, keep for future)
// ============================================
export const folders = pgTable(
	'folders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('folders_user_id_idx').on(table.userId),
	})
);

// ============================================
// Relations (for Drizzle Relational Queries)
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
	links: many(links),
	tags: many(tags),
	notifications: many(notifications),
	ownedAccounts: many(accounts),
	ownedWorkspaces: many(workspaces),
	featureRequests: many(featureRequests),
	featureVotes: many(featureVotes),
	folders: many(folders),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
	user: one(users, { fields: [links.userId], references: [users.id] }),
	account: one(accounts, { fields: [links.accountOwner], references: [accounts.id] }),
	workspace: one(workspaces, { fields: [links.workspaceId], references: [workspaces.id] }),
	clicks: many(clicks),
	linkTags: many(linkTags),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
	link: one(links, { fields: [clicks.linkId], references: [links.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	user: one(users, { fields: [tags.userId], references: [users.id] }),
	linkTags: many(linkTags),
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
	link: one(links, { fields: [linkTags.linkId], references: [links.id] }),
	tag: one(tags, { fields: [linkTags.tagId], references: [tags.id] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	owner: one(users, { fields: [accounts.owner], references: [users.id] }),
	links: many(links),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	owner: one(users, { fields: [workspaces.owner], references: [users.id] }),
	links: many(links),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const featureRequestsRelations = relations(featureRequests, ({ one, many }) => ({
	user: one(users, { fields: [featureRequests.userId], references: [users.id] }),
	votes: many(featureVotes),
}));

export const featureVotesRelations = relations(featureVotes, ({ one }) => ({
	featureRequest: one(featureRequests, {
		fields: [featureVotes.featureRequestId],
		references: [featureRequests.id],
	}),
	user: one(users, { fields: [featureVotes.userId], references: [users.id] }),
}));

export const foldersRelations = relations(folders, ({ one }) => ({
	user: one(users, { fields: [folders.userId], references: [users.id] }),
}));
