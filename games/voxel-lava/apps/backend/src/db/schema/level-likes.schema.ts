import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { levels } from './levels.schema';

export const levelLikes = pgTable(
  'level_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    levelId: uuid('level_id')
      .notNull()
      .references(() => levels.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uniqueLike: unique().on(table.levelId, table.userId),
  }),
);

export const levelLikesRelations = relations(levelLikes, ({ one }) => ({
  level: one(levels, {
    fields: [levelLikes.levelId],
    references: [levels.id],
  }),
}));

export type LevelLike = typeof levelLikes.$inferSelect;
export type NewLevelLike = typeof levelLikes.$inferInsert;
