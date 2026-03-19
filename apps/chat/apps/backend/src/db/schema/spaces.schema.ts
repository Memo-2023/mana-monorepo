import {
	pgTable,
	uuid,
	text,
	timestamp,
	boolean,
	pgEnum,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', [
	'pending',
	'accepted',
	'declined',
]);

export const spaces = pgTable(
	'spaces',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		ownerId: text('owner_id').notNull(), // TEXT to support Better Auth nanoid format
		name: text('name').notNull(),
		description: text('description'),
		isArchived: boolean('is_archived').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('spaces_owner_id_idx').on(table.ownerId)]
);

export const spaceMembers = pgTable(
	'space_members',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		spaceId: uuid('space_id')
			.references(() => spaces.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id').notNull(), // TEXT to support Better Auth nanoid format
		role: memberRoleEnum('role').default('member').notNull(),
		invitationStatus: invitationStatusEnum('invitation_status').default('pending').notNull(),
		invitedBy: text('invited_by'), // TEXT to support Better Auth nanoid format
		invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
		joinedAt: timestamp('joined_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('space_members_user_id_idx').on(table.userId),
		index('space_members_space_id_idx').on(table.spaceId),
		uniqueIndex('space_members_space_id_user_id_idx').on(table.spaceId, table.userId),
	]
);

export const spacesRelations = relations(spaces, ({ many }) => ({
	members: many(spaceMembers),
}));

export const spaceMembersRelations = relations(spaceMembers, ({ one }) => ({
	space: one(spaces, {
		fields: [spaceMembers.spaceId],
		references: [spaces.id],
	}),
}));

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;
export type SpaceMember = typeof spaceMembers.$inferSelect;
export type NewSpaceMember = typeof spaceMembers.$inferInsert;
