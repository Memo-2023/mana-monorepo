import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userTierEnum = pgEnum('user_tier', ['free', 'premium', 'enterprise']);
export const readingSpeedEnum = pgEnum('reading_speed', ['slow', 'normal', 'fast']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),

  // Preferences
  tier: userTierEnum('tier').default('free').notNull(),
  readingSpeed: readingSpeedEnum('reading_speed').default('normal').notNull(),
  preferredCategories: text('preferred_categories').array(),
  blockedSources: text('blocked_sources').array(),

  // Settings
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  notificationSettings: text('notification_settings'), // JSON string

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
