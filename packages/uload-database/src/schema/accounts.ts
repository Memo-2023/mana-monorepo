import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    owner: uuid('owner')
      .references(() => users.id)
      .notNull(),
    isActive: boolean('is_active').default(true),
    planType: text('plan_type', { enum: ['free', 'team', 'enterprise'] }).default(
      'free'
    ),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('accounts_owner_idx').on(table.owner)]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
