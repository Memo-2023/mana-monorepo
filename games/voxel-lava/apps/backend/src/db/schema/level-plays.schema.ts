import {
  pgTable,
  uuid,
  timestamp,
  real,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { levels } from './levels.schema';

export const levelPlays = pgTable('level_plays', {
  id: uuid('id').primaryKey().defaultRandom(),
  levelId: uuid('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  completionTime: real('completion_time'),
  attempts: integer('attempts').default(1),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const levelPlaysRelations = relations(levelPlays, ({ one }) => ({
  level: one(levels, {
    fields: [levelPlays.levelId],
    references: [levels.id],
  }),
}));

export type LevelPlay = typeof levelPlays.$inferSelect;
export type NewLevelPlay = typeof levelPlays.$inferInsert;
