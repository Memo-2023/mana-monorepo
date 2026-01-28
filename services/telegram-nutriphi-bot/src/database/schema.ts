import {
	pgTable,
	uuid,
	text,
	timestamp,
	bigint,
	integer,
	real,
	date,
	jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User goals - daily nutrition targets
export const userGoals = pgTable('user_goals', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull().unique(),
	dailyCalories: integer('daily_calories').default(2000).notNull(),
	dailyProtein: integer('daily_protein').default(50).notNull(),
	dailyCarbs: integer('daily_carbs').default(250).notNull(),
	dailyFat: integer('daily_fat').default(65).notNull(),
	dailyFiber: integer('daily_fiber').default(30).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Meals - tracked meals with nutrition data
export const meals = pgTable('meals', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
	date: date('date').notNull(),
	mealType: text('meal_type').notNull(), // breakfast, lunch, dinner, snack
	inputType: text('input_type').notNull(), // photo, text
	description: text('description'),
	calories: integer('calories').default(0).notNull(),
	protein: real('protein').default(0).notNull(),
	carbohydrates: real('carbohydrates').default(0).notNull(),
	fat: real('fat').default(0).notNull(),
	fiber: real('fiber').default(0).notNull(),
	sugar: real('sugar').default(0).notNull(),
	confidence: real('confidence').default(0).notNull(),
	rawResponse: jsonb('raw_response'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Favorite meals - saved for quick re-use
export const favoriteMeals = pgTable('favorite_meals', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
	name: text('name').notNull(),
	description: text('description'),
	nutrition: jsonb('nutrition').notNull(),
	usageCount: integer('usage_count').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userGoalsRelations = relations(userGoals, ({ many }) => ({
	meals: many(meals),
	favorites: many(favoriteMeals),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
	userGoals: one(userGoals, {
		fields: [meals.telegramUserId],
		references: [userGoals.telegramUserId],
	}),
}));

export const favoriteMealsRelations = relations(favoriteMeals, ({ one }) => ({
	userGoals: one(userGoals, {
		fields: [favoriteMeals.telegramUserId],
		references: [userGoals.telegramUserId],
	}),
}));

// Types
export type UserGoals = typeof userGoals.$inferSelect;
export type NewUserGoals = typeof userGoals.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type FavoriteMeal = typeof favoriteMeals.$inferSelect;
export type NewFavoriteMeal = typeof favoriteMeals.$inferInsert;

// Nutrition data structure for favorites
export interface NutritionData {
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
}
