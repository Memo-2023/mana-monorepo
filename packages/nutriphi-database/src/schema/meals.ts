import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Meals table - stores all meal entries with nutrition data
 */
export const meals = pgTable(
  'meals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    foodName: text('food_name').notNull(),
    imageUrl: text('image_url'),
    storagePath: text('storage_path'), // R2 path for deletion
    calories: real('calories').default(0),
    protein: real('protein').default(0),
    carbohydrates: real('carbohydrates').default(0),
    fat: real('fat').default(0),
    fiber: real('fiber').default(0),
    sugar: real('sugar').default(0),
    sodium: real('sodium').default(0),
    servingSize: text('serving_size'),
    mealType: text('meal_type'), // breakfast | lunch | dinner | snack
    analysisStatus: text('analysis_status').default('pending'), // pending | completed | failed | manual
    healthScore: integer('health_score'), // 1-10
    healthCategory: text('health_category'), // very_healthy | healthy | moderate | unhealthy
    notes: text('notes'),
    userRating: integer('user_rating'), // 1-5
    foodItems: jsonb('food_items').$type<FoodItem[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('meals_user_id_idx').on(table.userId),
    index('meals_created_at_idx').on(table.createdAt),
    index('meals_user_created_idx').on(table.userId, table.createdAt),
  ]
);

/**
 * Food item type for meal ingredients
 */
export interface FoodItem {
  id: string;
  name: string;
  category: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'fat' | 'processed' | 'beverage';
  portionSize: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  confidence?: number;
}

// Type exports
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
