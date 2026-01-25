import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/db';
import { meals, mealNutrition, type NewMeal, type NewMealNutrition } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

@Injectable()
export class MealService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async create(userId: string, data: NewMeal, nutrition: Omit<NewMealNutrition, 'mealId'>) {
		const [meal] = await this.db
			.insert(meals)
			.values({ ...data, userId })
			.returning();

		const [nutritionData] = await this.db
			.insert(mealNutrition)
			.values({ ...nutrition, mealId: meal.id })
			.returning();

		return { ...meal, nutrition: nutritionData };
	}

	async findByDate(userId: string, date: Date) {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const result = await this.db
			.select()
			.from(meals)
			.leftJoin(mealNutrition, eq(meals.id, mealNutrition.mealId))
			.where(and(eq(meals.userId, userId), gte(meals.date, startOfDay), lte(meals.date, endOfDay)))
			.orderBy(meals.date);

		return result.map((row) => ({
			...row.meals,
			nutrition: row.meal_nutrition,
		}));
	}

	async findByDateRange(userId: string, startDate: Date, endDate: Date) {
		const result = await this.db
			.select()
			.from(meals)
			.leftJoin(mealNutrition, eq(meals.id, mealNutrition.mealId))
			.where(and(eq(meals.userId, userId), gte(meals.date, startDate), lte(meals.date, endDate)))
			.orderBy(desc(meals.date));

		return result.map((row) => ({
			...row.meals,
			nutrition: row.meal_nutrition,
		}));
	}

	async findOne(userId: string, mealId: string) {
		const result = await this.db
			.select()
			.from(meals)
			.leftJoin(mealNutrition, eq(meals.id, mealNutrition.mealId))
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.limit(1);

		if (result.length === 0) return null;

		return {
			...result[0].meals,
			nutrition: result[0].meal_nutrition,
		};
	}

	async delete(userId: string, mealId: string) {
		const [deleted] = await this.db
			.delete(meals)
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.returning();

		return deleted;
	}

	async update(
		userId: string,
		mealId: string,
		data: Partial<NewMeal>,
		nutrition?: Partial<NewMealNutrition>
	) {
		const [meal] = await this.db
			.update(meals)
			.set(data)
			.where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
			.returning();

		if (nutrition) {
			await this.db.update(mealNutrition).set(nutrition).where(eq(mealNutrition.mealId, mealId));
		}

		return this.findOne(userId, mealId);
	}
}
