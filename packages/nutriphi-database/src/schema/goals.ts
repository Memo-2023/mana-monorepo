import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Nutrition goals table - stores user's daily nutrition targets
 */
export const nutritionGoals = pgTable('nutrition_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  caloriesTarget: integer('calories_target').notNull(),
  proteinTarget: integer('protein_target').notNull(),
  carbsTarget: integer('carbs_target').notNull(),
  fatTarget: integer('fat_target').notNull(),
  fiberTarget: integer('fiber_target'),
  sugarLimit: integer('sugar_limit'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert;
