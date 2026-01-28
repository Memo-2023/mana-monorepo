import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { MealService } from '../meal/meal.service';
import { GoalsService } from '../goals/goals.service';

describe('StatsService', () => {
	let service: StatsService;
	let mockMealService: jest.Mocked<MealService>;
	let mockGoalsService: jest.Mocked<GoalsService>;

	const mockGoals = {
		id: 'goal-1',
		userId: 'user-1',
		dailyCalories: 2000,
		dailyProtein: 50,
		dailyCarbs: 275,
		dailyFat: 78,
		dailyFiber: 28,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const createMeal = (
		date: Date,
		calories: number,
		protein: number,
		carbs: number,
		fat: number
	) => ({
		id: `meal-${Date.now()}-${Math.random()}`,
		userId: 'user-1',
		date,
		mealType: 'lunch',
		inputType: 'text',
		description: 'Test meal',
		confidence: 0.9,
		createdAt: new Date(),
		updatedAt: new Date(),
		nutrition: { calories, protein, carbohydrates: carbs, fat, fiber: 5, sugar: 10 },
	});

	beforeEach(async () => {
		mockMealService = {
			findByDate: jest.fn(),
			findByDateRange: jest.fn(),
		} as any;

		mockGoalsService = {
			getGoals: jest.fn(),
		} as any;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StatsService,
				{ provide: MealService, useValue: mockMealService },
				{ provide: GoalsService, useValue: mockGoalsService },
			],
		}).compile();

		service = module.get<StatsService>(StatsService);
	});

	describe('getDailySummary', () => {
		it('should return daily summary with meals and progress', async () => {
			const meals = [
				createMeal(new Date(), 500, 20, 60, 15),
				createMeal(new Date(), 700, 30, 80, 25),
			];
			mockMealService.findByDate.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getDailySummary('user-1', new Date());

			expect(result.meals).toHaveLength(2);
			expect(result.totalNutrition.calories).toBe(1200);
			expect(result.totalNutrition.protein).toBe(50);
			expect(result.progress.calories.percentage).toBe(60); // 1200/2000 = 60%
			expect(result.progress.protein!.percentage).toBe(100); // 50/50 = 100%
		});

		it('should use default values when no goals set', async () => {
			const meals = [createMeal(new Date(), 1000, 25, 140, 40)];
			mockMealService.findByDate.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(null as any);

			const result = await service.getDailySummary('user-1', new Date());

			expect(result.goals).toBeUndefined();
			expect(result.progress.calories.target).toBe(2000); // default
		});

		it('should handle days with no meals', async () => {
			mockMealService.findByDate.mockResolvedValue([]);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getDailySummary('user-1', new Date());

			expect(result.meals).toHaveLength(0);
			expect(result.totalNutrition.calories).toBe(0);
			expect(result.progress.calories.percentage).toBe(0);
		});
	});

	describe('getWeeklyStats', () => {
		it('should return weekly stats with daily breakdown', async () => {
			const today = new Date();
			const meals = [
				createMeal(today, 1800, 45, 220, 70),
				createMeal(new Date(today.getTime() - 86400000), 2000, 50, 250, 75),
			];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			expect(result.days).toHaveLength(7);
			expect(result.averages).toBeDefined();
			expect(result.trends).toBeDefined();
		});

		it('should calculate averages correctly', async () => {
			const today = new Date('2024-01-15');
			const day1 = new Date('2024-01-09'); // 6 days ago
			const day2 = new Date('2024-01-10'); // 5 days ago

			const meals = [createMeal(day1, 2000, 50, 250, 80), createMeal(day2, 1800, 45, 220, 70)];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			// Average should be based on days with data (2 days)
			expect(result.averages.calories).toBe(1900); // (2000+1800)/2
			expect(result.averages.protein).toBe(48); // (50+45)/2 rounded
		});

		it('should detect upward trend', async () => {
			const today = new Date('2024-01-15');
			const meals = [
				// First half (days 0-2) - low calories
				createMeal(new Date('2024-01-09'), 1000, 25, 120, 30),
				createMeal(new Date('2024-01-10'), 1100, 28, 130, 35),
				createMeal(new Date('2024-01-11'), 1050, 26, 125, 32),
				// Second half (days 4-6) - high calories (>10% increase)
				createMeal(new Date('2024-01-13'), 1500, 40, 180, 50),
				createMeal(new Date('2024-01-14'), 1600, 42, 190, 52),
				createMeal(new Date('2024-01-15'), 1550, 41, 185, 51),
			];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			expect(result.trends.caloriesTrend).toBe('up');
		});

		it('should detect downward trend', async () => {
			const today = new Date('2024-01-15');
			const meals = [
				// First half - high calories
				createMeal(new Date('2024-01-09'), 2000, 50, 250, 80),
				createMeal(new Date('2024-01-10'), 2100, 52, 260, 82),
				createMeal(new Date('2024-01-11'), 1950, 49, 240, 78),
				// Second half - low calories (>10% decrease)
				createMeal(new Date('2024-01-13'), 1500, 38, 180, 48),
				createMeal(new Date('2024-01-14'), 1400, 35, 170, 45),
				createMeal(new Date('2024-01-15'), 1450, 36, 175, 46),
			];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			expect(result.trends.caloriesTrend).toBe('down');
		});

		it('should detect stable trend', async () => {
			const today = new Date('2024-01-15');
			const meals = [
				createMeal(new Date('2024-01-09'), 2000, 50, 250, 80),
				createMeal(new Date('2024-01-10'), 2050, 51, 255, 81),
				createMeal(new Date('2024-01-11'), 1980, 49, 245, 79),
				createMeal(new Date('2024-01-13'), 2020, 50, 252, 80),
				createMeal(new Date('2024-01-14'), 2000, 50, 250, 80),
				createMeal(new Date('2024-01-15'), 2010, 50, 251, 80),
			];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			expect(result.trends.caloriesTrend).toBe('stable');
		});

		it('should mark goalsMet correctly when within 10% of target', async () => {
			// goalsMet = dayCalories >= goals.dailyCalories * 0.9 && dayCalories <= goals.dailyCalories * 1.1
			// With dailyCalories = 2000, range is 1800-2200
			// 1900 is within this range, so goalsMet should be true
			const today = new Date();
			today.setHours(23, 59, 59, 0);

			// Create a meal that is definitely within the week range
			const startDate = new Date(today);
			startDate.setDate(startDate.getDate() - 6);
			startDate.setHours(0, 0, 0, 0);

			// Use the third day of the week for the meal
			const mealDate = new Date(startDate);
			mealDate.setDate(mealDate.getDate() + 2);
			mealDate.setHours(12, 0, 0, 0);

			const meals = [createMeal(mealDate, 1900, 50, 250, 80)];
			mockMealService.findByDateRange.mockResolvedValue(meals as any);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', today);

			// The day with 1900 calories should have goalsMet = true
			const dayWithMeals = result.days.find((d) => d.totalCalories > 0);
			expect(dayWithMeals).toBeDefined();
			expect(dayWithMeals!.totalCalories).toBe(1900);
			expect(dayWithMeals!.goalsMet).toBe(true);
		});

		it('should handle empty week', async () => {
			mockMealService.findByDateRange.mockResolvedValue([]);
			mockGoalsService.getGoals.mockResolvedValue(mockGoals);

			const result = await service.getWeeklyStats('user-1', new Date());

			expect(result.days).toHaveLength(7);
			expect(result.averages.calories).toBe(0);
			result.days.forEach((day) => {
				expect(day.mealCount).toBe(0);
				expect(day.goalsMet).toBe(false);
			});
		});
	});
});
