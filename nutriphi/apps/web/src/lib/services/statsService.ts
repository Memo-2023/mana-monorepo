/**
 * Stats Service for Nutriphi Web
 * Calculates and aggregates nutrition statistics
 */

import { env } from '$lib/config/env';
import { tokenManager } from './tokenManager';
import type { DateRange, StatsData, CalorieDataPoint, MacroDistribution, WeeklyData, HealthTrendPoint } from '$lib/types/stats';
import type { Meal } from '$lib/types/meal';

const API_BASE = env.backend.url;

class StatsService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await tokenManager.getValidToken();

    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get stats from backend (if available) or calculate locally
   */
  async getStats(userId: string, range: DateRange): Promise<StatsData> {
    try {
      // Try to get from backend first
      return await this.request<StatsData>(`/stats/${userId}?range=${range}`);
    } catch {
      // If backend doesn't have stats endpoint, return empty data
      return this.getEmptyStats();
    }
  }

  /**
   * Calculate stats from meals data locally
   */
  calculateStats(meals: Meal[], range: DateRange): StatsData {
    const now = new Date();
    const rangeStart = this.getRangeStartDate(now, range);

    // Filter meals by date range
    const filteredMeals = meals.filter((meal) => new Date(meal.timestamp) >= rangeStart);

    if (filteredMeals.length === 0) {
      return this.getEmptyStats();
    }

    return {
      calorieData: this.calculateCalorieData(filteredMeals, range),
      macroData: this.calculateMacroDistribution(filteredMeals),
      weeklyData: this.calculateWeeklyData(filteredMeals),
      healthData: this.calculateHealthTrend(filteredMeals),
      totals: this.calculateTotals(filteredMeals)
    };
  }

  private getRangeStartDate(now: Date, range: DateRange): Date {
    const start = new Date(now);
    switch (range) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private calculateCalorieData(meals: Meal[], range: DateRange): CalorieDataPoint[] {
    const dailyCalories = new Map<string, number>();

    meals.forEach((meal) => {
      const date = meal.timestamp.split('T')[0];
      const current = dailyCalories.get(date) || 0;
      dailyCalories.set(date, current + (meal.total_calories || 0));
    });

    return Array.from(dailyCalories.entries())
      .map(([date, calories]) => ({ date, calories }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateMacroDistribution(meals: Meal[]): MacroDistribution {
    const totals = meals.reduce(
      (acc, meal) => ({
        protein: acc.protein + (meal.total_protein || 0),
        carbs: acc.carbs + (meal.total_carbs || 0),
        fat: acc.fat + (meal.total_fat || 0)
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );

    const total = totals.protein + totals.carbs + totals.fat;
    if (total === 0) return { protein: 33, carbs: 34, fat: 33 };

    return {
      protein: Math.round((totals.protein / total) * 100),
      carbs: Math.round((totals.carbs / total) * 100),
      fat: Math.round((totals.fat / total) * 100)
    };
  }

  private calculateWeeklyData(meals: Meal[]): WeeklyData[] {
    const weeklyMeals = new Map<string, Meal[]>();

    meals.forEach((meal) => {
      const date = new Date(meal.timestamp);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weeklyMeals.get(weekKey) || [];
      weeklyMeals.set(weekKey, [...existing, meal]);
    });

    return Array.from(weeklyMeals.entries())
      .map(([week, weekMeals]) => {
        const days = new Set(weekMeals.map((m) => m.timestamp.split('T')[0])).size;
        return {
          week,
          avgCalories: Math.round(
            weekMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0) / days
          ),
          avgProtein: Math.round(
            weekMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0) / days
          ),
          avgCarbs: Math.round(
            weekMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0) / days
          ),
          avgFat: Math.round(weekMeals.reduce((sum, m) => sum + (m.total_fat || 0), 0) / days),
          mealCount: weekMeals.length
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private calculateHealthTrend(meals: Meal[]): HealthTrendPoint[] {
    const dailyHealth = new Map<string, { scores: number[]; count: number }>();

    meals.forEach((meal) => {
      if (meal.health_score === undefined) return;
      const date = meal.timestamp.split('T')[0];
      const existing = dailyHealth.get(date) || { scores: [], count: 0 };
      dailyHealth.set(date, {
        scores: [...existing.scores, meal.health_score],
        count: existing.count + 1
      });
    });

    return Array.from(dailyHealth.entries())
      .map(([date, data]) => ({
        date,
        avgHealthScore:
          Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10,
        mealCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTotals(meals: Meal[]): StatsData['totals'] {
    const days = new Set(meals.map((m) => m.timestamp.split('T')[0])).size || 1;
    const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
    const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);
    const healthScores = meals.filter((m) => m.health_score !== undefined).map((m) => m.health_score!);

    return {
      avgCalories: Math.round(totalCalories / days),
      avgProtein: Math.round(totalProtein / days),
      avgCarbs: Math.round(totalCarbs / days),
      avgFat: Math.round(totalFat / days),
      totalMeals: meals.length,
      avgHealthScore:
        healthScores.length > 0
          ? Math.round((healthScores.reduce((a, b) => a + b, 0) / healthScores.length) * 10) / 10
          : 0
    };
  }

  private getEmptyStats(): StatsData {
    return {
      calorieData: [],
      macroData: { protein: 33, carbs: 34, fat: 33 },
      weeklyData: [],
      healthData: [],
      totals: {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        totalMeals: 0,
        avgHealthScore: 0
      }
    };
  }
}

export const statsService = new StatsService();
