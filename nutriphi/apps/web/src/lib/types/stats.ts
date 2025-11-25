/**
 * Statistics Types for Nutriphi Web
 */

export type DateRange = 'week' | 'month' | 'year';

export interface CalorieDataPoint {
  date: string;
  calories: number;
  target?: number;
}

export interface MacroDistribution {
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklyData {
  week: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  mealCount: number;
}

export interface HealthTrendPoint {
  date: string;
  avgHealthScore: number;
  mealCount: number;
}

export interface StatsData {
  calorieData: CalorieDataPoint[];
  macroData: MacroDistribution;
  weeklyData: WeeklyData[];
  healthData: HealthTrendPoint[];
  totals: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    totalMeals: number;
    avgHealthScore: number;
  };
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateFrom: string;
  dateTo: string;
  includeMeals: boolean;
  includeStats: boolean;
  includeGoals: boolean;
}
