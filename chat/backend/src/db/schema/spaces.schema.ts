import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined']);

export const spaces = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const spaceMembers = pgTable('space_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceId: uuid('space_id')
    .references(() => spaces.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id').notNull(),
  role: memberRoleEnum('role').default('member').notNull(),
  invitationStatus: invitationStatusEnum('invitation_status').default('pending').notNull(),
  invitedBy: uuid('invited_by'),
  invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
