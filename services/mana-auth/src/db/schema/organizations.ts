import { pgSchema, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { authSchema, users } from './auth';

/**
 * Better Auth Organization Tables
 * These tables follow Better Auth's organization plugin schema requirements
 * @see https://www.better-auth.com/docs/plugins/organization
 *
 * Note: Better Auth uses TEXT for IDs (nanoid/ULID), but we use UUID for users.
 * The foreign key constraints will be added via raw SQL migration to handle the type difference.
 */

// Organizations table
export const organizations = authSchema.table(
	'organizations',
	{
		id: text('id').primaryKey(), // Better Auth uses TEXT IDs (ULIDs/nanoids)
		name: text('name').notNull(),
		slug: text('slug').unique(),
		logo: text('logo'),
		metadata: jsonb('metadata'), // Additional organization data
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		slugIdx: index('organizations_slug_idx').on(table.slug),
	})
);

// Members table (links users to organizations with roles)
export const members = authSchema.table(
	'members',
	{
		id: text('id').primaryKey(), // Better Auth uses TEXT IDs
		organizationId: text('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id').notNull(), // References auth.users.id (UUID cast to TEXT)
		role: text('role').notNull(), // 'owner', 'admin', 'member', or custom roles
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		organizationIdIdx: index('members_organization_id_idx').on(table.organizationId),
		userIdIdx: index('members_user_id_idx').on(table.userId),
		organizationUserIdx: index('members_organization_user_idx').on(
			table.organizationId,
			table.userId
		),
	})
);

// Invitations table (for inviting users to organizations)
export const invitations = authSchema.table(
	'invitations',
	{
		id: text('id').primaryKey(), // Better Auth uses TEXT IDs
		organizationId: text('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		email: text('email').notNull(),
		role: text('role').notNull(), // Role they'll have when they accept
		status: text('status').notNull(), // 'pending', 'accepted', 'rejected', 'canceled'
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		inviterId: text('inviter_id'), // References auth.users.id (UUID cast to TEXT)
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		organizationIdIdx: index('invitations_organization_id_idx').on(table.organizationId),
		emailIdx: index('invitations_email_idx').on(table.email),
		statusIdx: index('invitations_status_idx').on(table.status),
	})
);
