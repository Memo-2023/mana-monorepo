import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { Meal, NewMeal, FavoriteMeal, NutritionData } from '../database/schema';
import { AnalysisResult } from '../analysis/gemini.service';
import { MealType, suggestMealType } from '../config/configuration';

@Injectable()
export class MealsService {
	private readonly logger = new Logger(MealsService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>
	) {}

	// Create a meal from analysis result
	async createFromAnalysis(
		telegramUserId: number,
		inputType: 'photo' | 'text',
		analysis: AnalysisResult,
		mealType?: MealType
	): Promise<Meal> {
		const today = new Date().toISOString().split('T')[0];

		const [meal] = await this.db
			.insert(schema.meals)
			.values({
				telegramUserId,
				date: today,
				mealType: mealType || suggestMealType(),
				inputType,
				description: analysis.description,
				calories: analysis.totalNutrition.calories,
				protein: analysis.totalNutrition.protein,
				carbohydrates: analysis.totalNutrition.carbohydrates,
				fat: analysis.totalNutrition.fat,
				fiber: analysis.totalNutrition.fiber,
				sugar: analysis.totalNutrition.sugar,
				confidence: analysis.confidence,
				rawResponse: analysis,
			})
			.returning();

		this.logger.log(`Created meal for user ${telegramUserId}: ${analysis.description}`);
		return meal;
	}

	// Create a meal from favorite
	async createFromFavorite(telegramUserId: number, favorite: FavoriteMeal): Promise<Meal> {
		const today = new Date().toISOString().split('T')[0];
		const nutrition = favorite.nutrition as NutritionData;

		const [meal] = await this.db
			.insert(schema.meals)
			.values({
				telegramUserId,
				date: today,
				mealType: suggestMealType(),
				inputType: 'text',
				description: favorite.name,
				calories: nutrition.calories,
				protein: nutrition.protein,
				carbohydrates: nutrition.carbohydrates,
				fat: nutrition.fat,
				fiber: nutrition.fiber,
				sugar: nutrition.sugar,
				confidence: 1.0, // From saved data, so high confidence
			})
			.returning();

		// Increment usage count
		await this.db
			.update(schema.favoriteMeals)
			.set({
				usageCount: sql`${schema.favoriteMeals.usageCount} + 1`,
			})
			.where(eq(schema.favoriteMeals.id, favorite.id));

		this.logger.log(`Created meal from favorite for user ${telegramUserId}: ${favorite.name}`);
		return meal;
	}

	// Get meals for a specific date
	async getMealsByDate(telegramUserId: number, date: string): Promise<Meal[]> {
		return this.db.query.meals.findMany({
			where: and(eq(schema.meals.telegramUserId, telegramUserId), eq(schema.meals.date, date)),
			orderBy: (meals, { asc }) => [asc(meals.createdAt)],
		});
	}

	// Get today's meals
	async getTodaysMeals(telegramUserId: number): Promise<Meal[]> {
		const today = new Date().toISOString().split('T')[0];
		return this.getMealsByDate(telegramUserId, today);
	}

	// Delete last meal
	async deleteLastMeal(telegramUserId: number): Promise<boolean> {
		const todaysMeals = await this.getTodaysMeals(telegramUserId);
		if (todaysMeals.length === 0) return false;

		const lastMeal = todaysMeals[todaysMeals.length - 1];
		await this.db.delete(schema.meals).where(eq(schema.meals.id, lastMeal.id));

		this.logger.log(`Deleted last meal for user ${telegramUserId}`);
		return true;
	}

	// Save meal as favorite
	async saveAsFavorite(telegramUserId: number, meal: Meal, name: string): Promise<FavoriteMeal> {
		const nutrition: NutritionData = {
			calories: meal.calories,
			protein: meal.protein,
			carbohydrates: meal.carbohydrates,
			fat: meal.fat,
			fiber: meal.fiber,
			sugar: meal.sugar,
		};

		const [favorite] = await this.db
			.insert(schema.favoriteMeals)
			.values({
				telegramUserId,
				name,
				description: meal.description,
				nutrition,
			})
			.returning();

		this.logger.log(`Saved favorite for user ${telegramUserId}: ${name}`);
		return favorite;
	}

	// Get all favorites
	async getFavorites(telegramUserId: number): Promise<FavoriteMeal[]> {
		return this.db.query.favoriteMeals.findMany({
			where: eq(schema.favoriteMeals.telegramUserId, telegramUserId),
			orderBy: (fav, { desc }) => [desc(fav.usageCount), desc(fav.createdAt)],
		});
	}

	// Get favorite by index (1-based for user display)
	async getFavoriteByIndex(telegramUserId: number, index: number): Promise<FavoriteMeal | null> {
		const favorites = await this.getFavorites(telegramUserId);
		if (index < 1 || index > favorites.length) return null;
		return favorites[index - 1];
	}

	// Delete favorite
	async deleteFavorite(favoriteId: string): Promise<boolean> {
		const result = await this.db
			.delete(schema.favoriteMeals)
			.where(eq(schema.favoriteMeals.id, favoriteId));
		return (result as unknown as { rowCount: number }).rowCount > 0;
	}
}
