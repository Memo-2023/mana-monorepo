import { calculateProgress, sumNutrition } from './nutrition.utils';
import { DEFAULT_DAILY_VALUES } from '../types/nutrition.types';

describe('nutrition.utils', () => {
	describe('calculateProgress', () => {
		it('should calculate progress with default values when no goals provided', () => {
			const nutrition = {
				calories: 1000,
				protein: 25,
				carbohydrates: 138,
				fat: 39,
			};

			const progress = calculateProgress(nutrition);

			expect(progress.calories.current).toBe(1000);
			expect(progress.calories.target).toBe(DEFAULT_DAILY_VALUES.calories);
			expect(progress.calories.percentage).toBe(50);

			expect(progress.protein!.current).toBe(25);
			expect(progress.protein!.target).toBe(DEFAULT_DAILY_VALUES.protein);
			expect(progress.protein!.percentage).toBe(50);
		});

		it('should use custom goals when provided', () => {
			const nutrition = { calories: 1500, protein: 75, carbohydrates: 150, fat: 50 };
			const goals = {
				id: '1',
				userId: 'user1',
				dailyCalories: 3000,
				dailyProtein: 150,
				dailyCarbs: 300,
				dailyFat: 100,
				dailyFiber: 30,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const progress = calculateProgress(nutrition, goals);

			expect(progress.calories.target).toBe(3000);
			expect(progress.calories.percentage).toBe(50);
			expect(progress.protein!.target).toBe(150);
			expect(progress.protein!.percentage).toBe(50);
		});

		it('should cap percentage at 100%', () => {
			const nutrition = { calories: 3000, protein: 200, carbohydrates: 500, fat: 200 };

			const progress = calculateProgress(nutrition);

			expect(progress.calories.percentage).toBe(100);
			expect(progress.protein!.percentage).toBe(100);
		});

		it('should handle zero values', () => {
			const nutrition = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };

			const progress = calculateProgress(nutrition);

			expect(progress.calories.current).toBe(0);
			expect(progress.calories.percentage).toBe(0);
		});

		it('should handle missing nutrition values', () => {
			const progress = calculateProgress({});

			expect(progress.calories.current).toBe(0);
			expect(progress.protein!.current).toBe(0);
			expect(progress.carbs!.current).toBe(0);
			expect(progress.fat!.current).toBe(0);
		});

		it('should round percentages', () => {
			const nutrition = { calories: 333, protein: 17, carbohydrates: 91, fat: 26 };

			const progress = calculateProgress(nutrition);

			expect(progress.calories.percentage).toBe(17); // 333/2000 = 16.65 -> 17
			expect(progress.protein!.percentage).toBe(34); // 17/50 = 34
		});
	});

	describe('sumNutrition', () => {
		it('should sum nutrition from multiple meals', () => {
			const meals = [
				{
					nutrition: {
						calories: 500,
						protein: 20,
						carbohydrates: 60,
						fat: 15,
						fiber: 5,
						sugar: 10,
					},
				},
				{
					nutrition: { calories: 300, protein: 15, carbohydrates: 40, fat: 10, fiber: 3, sugar: 5 },
				},
				{
					nutrition: { calories: 200, protein: 10, carbohydrates: 25, fat: 8, fiber: 2, sugar: 3 },
				},
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(1000);
			expect(sum.protein).toBe(45);
			expect(sum.carbohydrates).toBe(125);
			expect(sum.fat).toBe(33);
			expect(sum.fiber).toBe(10);
			expect(sum.sugar).toBe(18);
		});

		it('should handle empty meals array', () => {
			const sum = sumNutrition([]);

			expect(sum.calories).toBe(0);
			expect(sum.protein).toBe(0);
			expect(sum.carbohydrates).toBe(0);
			expect(sum.fat).toBe(0);
		});

		it('should handle meals with null nutrition', () => {
			const meals = [
				{ nutrition: { calories: 500, protein: 20, carbohydrates: 60, fat: 15 } },
				{ nutrition: null },
				{ nutrition: { calories: 300, protein: 15, carbohydrates: 40, fat: 10 } },
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(800);
			expect(sum.protein).toBe(35);
		});

		it('should handle meals with undefined nutrition', () => {
			const meals = [
				{ nutrition: { calories: 500, protein: 20, carbohydrates: 60, fat: 15 } },
				{},
				{ nutrition: { calories: 300, protein: 15, carbohydrates: 40, fat: 10 } },
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(800);
		});

		it('should handle partial nutrition data', () => {
			const meals = [
				{ nutrition: { calories: 500 } },
				{ nutrition: { protein: 20 } },
				{ nutrition: { fat: 10, fiber: 5 } },
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(500);
			expect(sum.protein).toBe(20);
			expect(sum.fat).toBe(10);
			expect(sum.fiber).toBe(5);
			expect(sum.carbohydrates).toBe(0);
		});

		it('should ignore non-numeric values', () => {
			const meals = [
				{ nutrition: { calories: 500, protein: 'invalid' as any } },
				{ nutrition: { calories: 300, protein: 15 } },
			];

			const sum = sumNutrition(meals);

			expect(sum.calories).toBe(800);
			expect(sum.protein).toBe(15);
		});
	});
});
