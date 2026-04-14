import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	calculateProgress,
	sumNutrition,
	formatNutrient,
	getProgressColor,
	detectDeficiencies,
	suggestMealType,
	formatDateForDisplay,
	isToday,
} from './index';

describe('Shared Utils', () => {
	describe('calculateProgress', () => {
		it('should calculate progress with default values', () => {
			const nutrition = { calories: 1000, protein: 25, carbohydrates: 137, fat: 39 };
			const progress = calculateProgress(nutrition);

			expect(progress.calories.current).toBe(1000);
			expect(progress.calories.target).toBe(2000);
			expect(progress.calories.percentage).toBe(50);
		});

		it('should use custom goals', () => {
			const nutrition = { calories: 1500, protein: 75 };
			const goals = {
				dailyCalories: 3000,
				dailyProtein: 150,
				dailyCarbs: 300,
				dailyFat: 100,
			} as any;

			const progress = calculateProgress(nutrition, goals);

			expect(progress.calories.target).toBe(3000);
			expect(progress.calories.percentage).toBe(50);
		});

		it('should cap percentage at 100', () => {
			const nutrition = { calories: 3000 };
			const progress = calculateProgress(nutrition);

			expect(progress.calories.percentage).toBe(100);
		});

		it('should handle missing values', () => {
			const progress = calculateProgress({});

			expect(progress.calories.current).toBe(0);
			expect(progress.calories.percentage).toBe(0);
		});
	});

	describe('sumNutrition', () => {
		it('should sum multiple meals', () => {
			const meals = [
				{ nutrition: { calories: 500, protein: 20, carbohydrates: 60, fat: 15 } },
				{ nutrition: { calories: 300, protein: 15, carbohydrates: 40, fat: 10 } },
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(800);
			expect(sum.protein).toBe(35);
			expect(sum.carbohydrates).toBe(100);
			expect(sum.fat).toBe(25);
		});

		it('should handle null nutrition', () => {
			const meals = [{ nutrition: { calories: 500 } }, { nutrition: null }];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(500);
		});

		it('should handle empty array', () => {
			const sum = sumNutrition([]);

			expect(sum.calories).toBe(0);
		});
	});

	describe('formatNutrient', () => {
		it('should format calories', () => {
			expect(formatNutrient('calories', 1234.5)).toBe('1235 kcal');
		});

		it('should format protein', () => {
			expect(formatNutrient('protein', 25.5)).toBe('25.5 g');
		});

		it('should return dash for undefined', () => {
			expect(formatNutrient('calories', undefined)).toBe('-');
		});
	});

	describe('getProgressColor', () => {
		it('should return red for low percentage', () => {
			expect(getProgressColor(30)).toBe('#EF4444');
		});

		it('should return orange for medium percentage', () => {
			expect(getProgressColor(60)).toBe('#F59E0B');
		});

		it('should return green for high percentage', () => {
			expect(getProgressColor(90)).toBe('#22C55E');
		});

		it('should return red for over 100%', () => {
			expect(getProgressColor(120)).toBe('#EF4444');
		});
	});

	describe('detectDeficiencies', () => {
		it('should detect low protein', () => {
			const nutrition = { protein: 10 }; // 20% of 50g target
			const deficiencies = detectDeficiencies(nutrition);

			expect(deficiencies).toContainEqual(expect.objectContaining({ nutrient: 'protein' }));
		});

		it('should not detect deficiency when above threshold', () => {
			const nutrition = { protein: 30 }; // 60% of target
			const deficiencies = detectDeficiencies(nutrition);

			expect(deficiencies.find((d) => d.nutrient === 'protein')).toBeUndefined();
		});
	});

	describe('suggestMealType', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should suggest breakfast in the morning', () => {
			vi.setSystemTime(new Date('2024-01-15T08:00:00'));
			expect(suggestMealType()).toBe('breakfast');
		});

		it('should suggest lunch at noon', () => {
			vi.setSystemTime(new Date('2024-01-15T12:00:00'));
			expect(suggestMealType()).toBe('lunch');
		});

		it('should suggest dinner in the evening', () => {
			vi.setSystemTime(new Date('2024-01-15T19:00:00'));
			expect(suggestMealType()).toBe('dinner');
		});

		it('should suggest snack at other times', () => {
			vi.setSystemTime(new Date('2024-01-15T15:00:00'));
			expect(suggestMealType()).toBe('snack');
		});
	});

	describe('formatDateForDisplay', () => {
		it('should format date in German', () => {
			const date = new Date('2024-01-15');
			const formatted = formatDateForDisplay(date, 'de-DE');

			expect(formatted).toContain('15');
			expect(formatted).toContain('Januar');
		});
	});

	describe('isToday', () => {
		it('should return true for today', () => {
			expect(isToday(new Date())).toBe(true);
		});

		it('should return false for yesterday', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(isToday(yesterday)).toBe(false);
		});

		it('should return false for same day different year', () => {
			const lastYear = new Date();
			lastYear.setFullYear(lastYear.getFullYear() - 1);
			expect(isToday(lastYear)).toBe(false);
		});
	});
});
