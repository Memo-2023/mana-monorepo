import { Injectable } from '@nestjs/common';
import { MealService } from '../meal/meal.service';
import { GoalsService } from '../goals/goals.service';
import { calculateProgress, sumNutrition } from '../utils/nutrition.utils';
import type { DailySummary, WeeklyStats, DailyStats } from '../types/nutrition.types';

@Injectable()
export class StatsService {
	constructor(
		private mealService: MealService,
		private goalsService: GoalsService
	) {}

	async getDailySummary(userId: string, date: Date): Promise<DailySummary> {
		const meals = await this.mealService.findByDate(userId, date);
		const goals = await this.goalsService.getGoals(userId);

		const totalNutrition = sumNutrition(meals);
		const progress = calculateProgress(totalNutrition, goals || undefined);

		return {
			date,
			meals: meals as any,
			totalNutrition: totalNutrition as any,
			goals: goals || undefined,
			progress,
		};
	}

	async getWeeklyStats(userId: string, endDate: Date = new Date()): Promise<WeeklyStats> {
		const startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - 6);
		startDate.setHours(0, 0, 0, 0);

		const endOfDay = new Date(endDate);
		endOfDay.setHours(23, 59, 59, 999);

		const meals = await this.mealService.findByDateRange(userId, startDate, endOfDay);
		const goals = await this.goalsService.getGoals(userId);

		// Group meals by date
		const mealsByDate = new Map<string, typeof meals>();
		for (const meal of meals) {
			const dateKey = new Date(meal.date).toISOString().split('T')[0];
			if (!mealsByDate.has(dateKey)) {
				mealsByDate.set(dateKey, []);
			}
			mealsByDate.get(dateKey)!.push(meal);
		}

		// Calculate daily stats
		const days: DailyStats[] = [];
		let totalCalories = 0;
		let totalProtein = 0;
		let totalCarbs = 0;
		let totalFat = 0;
		let daysWithData = 0;

		for (let i = 0; i < 7; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const dateKey = date.toISOString().split('T')[0];
			const dayMeals = mealsByDate.get(dateKey) || [];

			const nutrition = sumNutrition(dayMeals);
			const dayCalories = nutrition.calories || 0;
			const dayProtein = nutrition.protein || 0;
			const dayCarbs = nutrition.carbohydrates || 0;
			const dayFat = nutrition.fat || 0;

			if (dayMeals.length > 0) {
				daysWithData++;
				totalCalories += dayCalories;
				totalProtein += dayProtein;
				totalCarbs += dayCarbs;
				totalFat += dayFat;
			}

			const goalsMet = goals
				? dayCalories >= goals.dailyCalories * 0.9 && dayCalories <= goals.dailyCalories * 1.1
				: false;

			days.push({
				date,
				totalCalories: dayCalories,
				totalProtein: dayProtein,
				totalCarbs: dayCarbs,
				totalFat: dayFat,
				mealCount: dayMeals.length,
				goalsMet,
			});
		}

		// Calculate averages
		const divisor = daysWithData || 1;
		const averages = {
			calories: Math.round(totalCalories / divisor),
			protein: Math.round(totalProtein / divisor),
			carbs: Math.round(totalCarbs / divisor),
			fat: Math.round(totalFat / divisor),
		};

		// Calculate trends (comparing last 3 days to first 3 days)
		const firstHalf = days.slice(0, 3);
		const secondHalf = days.slice(4);

		const firstCalories = firstHalf.reduce((sum, d) => sum + d.totalCalories, 0) / 3;
		const secondCalories = secondHalf.reduce((sum, d) => sum + d.totalCalories, 0) / 3;
		const firstProtein = firstHalf.reduce((sum, d) => sum + d.totalProtein, 0) / 3;
		const secondProtein = secondHalf.reduce((sum, d) => sum + d.totalProtein, 0) / 3;

		const getTrend = (first: number, second: number): 'up' | 'down' | 'stable' => {
			const diff = second - first;
			const threshold = first * 0.1;
			if (diff > threshold) return 'up';
			if (diff < -threshold) return 'down';
			return 'stable';
		};

		return {
			startDate,
			endDate: endOfDay,
			days,
			averages,
			trends: {
				caloriesTrend: getTrend(firstCalories, secondCalories),
				proteinTrend: getTrend(firstProtein, secondProtein),
			},
		};
	}
}
