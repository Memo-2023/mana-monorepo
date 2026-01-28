import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { Meal, UserGoals } from '../database/schema';

export interface DailySummary {
	date: string;
	meals: Meal[];
	totals: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber: number;
		sugar: number;
	};
	goals: UserGoals | null;
	progress: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber: number;
	};
}

export interface WeeklySummary {
	startDate: string;
	endDate: string;
	days: {
		date: string;
		calories: number;
		mealsCount: number;
	}[];
	averages: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
	};
	totalMeals: number;
}

@Injectable()
export class StatsService {
	private readonly logger = new Logger(StatsService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>
	) {}

	// Get daily summary for a user
	async getDailySummary(telegramUserId: number, date?: string): Promise<DailySummary> {
		const targetDate = date || new Date().toISOString().split('T')[0];

		// Get meals for the day
		const meals = await this.db.query.meals.findMany({
			where: and(
				eq(schema.meals.telegramUserId, telegramUserId),
				eq(schema.meals.date, targetDate)
			),
			orderBy: (meals, { asc }) => [asc(meals.createdAt)],
		});

		// Get user goals
		const goals = await this.db.query.userGoals.findFirst({
			where: eq(schema.userGoals.telegramUserId, telegramUserId),
		});

		// Calculate totals
		const totals = meals.reduce(
			(acc, meal) => ({
				calories: acc.calories + meal.calories,
				protein: acc.protein + meal.protein,
				carbohydrates: acc.carbohydrates + meal.carbohydrates,
				fat: acc.fat + meal.fat,
				fiber: acc.fiber + meal.fiber,
				sugar: acc.sugar + meal.sugar,
			}),
			{ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
		);

		// Calculate progress (percentage of goals)
		const progress = {
			calories: goals ? (totals.calories / goals.dailyCalories) * 100 : 0,
			protein: goals ? (totals.protein / goals.dailyProtein) * 100 : 0,
			carbohydrates: goals ? (totals.carbohydrates / goals.dailyCarbs) * 100 : 0,
			fat: goals ? (totals.fat / goals.dailyFat) * 100 : 0,
			fiber: goals ? (totals.fiber / goals.dailyFiber) * 100 : 0,
		};

		return {
			date: targetDate,
			meals,
			totals,
			goals: goals || null,
			progress,
		};
	}

	// Get weekly summary
	async getWeeklySummary(telegramUserId: number): Promise<WeeklySummary> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 6);

		const startStr = startDate.toISOString().split('T')[0];
		const endStr = endDate.toISOString().split('T')[0];

		// Get all meals for the week
		const meals = await this.db.query.meals.findMany({
			where: and(
				eq(schema.meals.telegramUserId, telegramUserId),
				gte(schema.meals.date, startStr),
				lte(schema.meals.date, endStr)
			),
		});

		// Group by date
		const byDate = new Map<
			string,
			{ calories: number; protein: number; carbohydrates: number; fat: number; count: number }
		>();

		// Initialize all 7 days
		for (let i = 0; i < 7; i++) {
			const d = new Date(startDate);
			d.setDate(d.getDate() + i);
			const dateStr = d.toISOString().split('T')[0];
			byDate.set(dateStr, { calories: 0, protein: 0, carbohydrates: 0, fat: 0, count: 0 });
		}

		// Sum up meals
		for (const meal of meals) {
			const existing = byDate.get(meal.date) || {
				calories: 0,
				protein: 0,
				carbohydrates: 0,
				fat: 0,
				count: 0,
			};
			byDate.set(meal.date, {
				calories: existing.calories + meal.calories,
				protein: existing.protein + meal.protein,
				carbohydrates: existing.carbohydrates + meal.carbohydrates,
				fat: existing.fat + meal.fat,
				count: existing.count + 1,
			});
		}

		// Convert to array
		const days = Array.from(byDate.entries()).map(([date, data]) => ({
			date,
			calories: Math.round(data.calories),
			mealsCount: data.count,
		}));

		// Calculate averages (only for days with meals)
		const daysWithMeals = Array.from(byDate.values()).filter((d) => d.count > 0);
		const numDays = daysWithMeals.length || 1;

		const averages = {
			calories: Math.round(daysWithMeals.reduce((sum, d) => sum + d.calories, 0) / numDays),
			protein: Math.round(daysWithMeals.reduce((sum, d) => sum + d.protein, 0) / numDays),
			carbohydrates: Math.round(
				daysWithMeals.reduce((sum, d) => sum + d.carbohydrates, 0) / numDays
			),
			fat: Math.round(daysWithMeals.reduce((sum, d) => sum + d.fat, 0) / numDays),
		};

		return {
			startDate: startStr,
			endDate: endStr,
			days,
			averages,
			totalMeals: meals.length,
		};
	}

	// Get progress bar for display
	static formatProgressBar(percentage: number, length = 10): string {
		const capped = Math.min(percentage, 100);
		const filled = Math.round((capped / 100) * length);
		const empty = length - filled;
		const bar = '█'.repeat(filled) + '░'.repeat(empty);

		// Add indicator if over goal
		const indicator = percentage > 100 ? ' ⚠️' : '';
		return `${bar} ${Math.round(percentage)}%${indicator}`;
	}
}
