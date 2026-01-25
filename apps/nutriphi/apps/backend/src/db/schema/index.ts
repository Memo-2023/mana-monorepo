import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	integer,
	real,
	boolean,
	jsonb,
} from 'drizzle-orm/pg-core';

// User Goals
export const userGoals = pgTable('user_goals', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	dailyCalories: integer('daily_calories').notNull().default(2000),
	dailyProtein: integer('daily_protein'), // grams
	dailyCarbs: integer('daily_carbs'), // grams
	dailyFat: integer('daily_fat'), // grams
	dailyFiber: integer('daily_fiber'), // grams
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Meals
export const meals = pgTable('meals', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	date: timestamp('date').notNull(),
	mealType: varchar('meal_type', { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
	inputType: varchar('input_type', { length: 20 }).notNull(), // photo, text
	description: text('description').notNull(), // AI-generated description
	portionSize: varchar('portion_size', { length: 50 }), // small, medium, large, or grams
	confidence: real('confidence').notNull().default(0), // 0-1
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Meal Nutrition (one-to-one with meals)
export const mealNutrition = pgTable('meal_nutrition', {
	id: uuid('id').primaryKey().defaultRandom(),
	mealId: uuid('meal_id')
		.notNull()
		.references(() => meals.id, { onDelete: 'cascade' }),
	// Macros
	calories: real('calories').notNull(),
	protein: real('protein').notNull(),
	carbohydrates: real('carbohydrates').notNull(),
	fat: real('fat').notNull(),
	fiber: real('fiber').notNull().default(0),
	sugar: real('sugar').notNull().default(0),
	saturatedFat: real('saturated_fat'),
	unsaturatedFat: real('unsaturated_fat'),
	// Vitamins (µg or mg as appropriate)
	vitaminA: real('vitamin_a'),
	vitaminB1: real('vitamin_b1'),
	vitaminB2: real('vitamin_b2'),
	vitaminB3: real('vitamin_b3'),
	vitaminB5: real('vitamin_b5'),
	vitaminB6: real('vitamin_b6'),
	vitaminB7: real('vitamin_b7'),
	vitaminB9: real('vitamin_b9'),
	vitaminB12: real('vitamin_b12'),
	vitaminC: real('vitamin_c'),
	vitaminD: real('vitamin_d'),
	vitaminE: real('vitamin_e'),
	vitaminK: real('vitamin_k'),
	// Minerals (mg)
	calcium: real('calcium'),
	iron: real('iron'),
	magnesium: real('magnesium'),
	phosphorus: real('phosphorus'),
	potassium: real('potassium'),
	sodium: real('sodium'),
	zinc: real('zinc'),
	copper: real('copper'),
	manganese: real('manganese'),
	selenium: real('selenium'),
	// Water
	water: real('water'),
});

// Favorite Meals
export const favoriteMeals = pgTable('favorite_meals', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description').notNull(),
	mealType: varchar('meal_type', { length: 20 }).notNull(),
	nutrition: jsonb('nutrition').notNull(), // MealNutrition object
	usageCount: integer('usage_count').notNull().default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recommendations
export const recommendations = pgTable('recommendations', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	date: timestamp('date').notNull(),
	type: varchar('type', { length: 20 }).notNull(), // hint, coaching
	priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high
	message: text('message').notNull(),
	nutrient: varchar('nutrient', { length: 50 }), // e.g., 'protein', 'vitaminC'
	actionable: text('actionable'), // e.g., "Add more leafy greens"
	dismissed: boolean('dismissed').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export types
export type UserGoals = typeof userGoals.$inferSelect;
export type NewUserGoals = typeof userGoals.$inferInsert;

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export type MealNutrition = typeof mealNutrition.$inferSelect;
export type NewMealNutrition = typeof mealNutrition.$inferInsert;

export type FavoriteMeal = typeof favoriteMeals.$inferSelect;
export type NewFavoriteMeal = typeof favoriteMeals.$inferInsert;

export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
