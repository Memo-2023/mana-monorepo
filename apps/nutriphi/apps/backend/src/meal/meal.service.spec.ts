import { Test, TestingModule } from '@nestjs/testing';
import { MealService } from './meal.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('MealService', () => {
	let service: MealService;
	let mockDb: any;

	const mockMeal = {
		id: 'meal-1',
		userId: 'user-1',
		date: new Date('2024-01-15T12:00:00Z'),
		mealType: 'lunch',
		inputType: 'photo',
		description: 'Spaghetti Bolognese',
		confidence: 0.95,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockNutrition = {
		id: 'nutrition-1',
		mealId: 'meal-1',
		calories: 650,
		protein: 25,
		carbohydrates: 80,
		fat: 20,
		fiber: 5,
		sugar: 8,
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			leftJoin: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue([{ meals: mockMeal, meal_nutrition: mockNutrition }]),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MealService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<MealService>(MealService);
	});

	describe('create', () => {
		it('should create a meal with nutrition data', async () => {
			mockDb.returning
				.mockResolvedValueOnce([mockMeal]) // First call for meal insert
				.mockResolvedValueOnce([mockNutrition]); // Second call for nutrition insert

			const mealData = {
				date: new Date(),
				mealType: 'lunch',
				inputType: 'photo',
				description: 'Spaghetti Bolognese',
				confidence: 0.95,
			};

			const nutritionData = {
				calories: 650,
				protein: 25,
				carbohydrates: 80,
				fat: 20,
			};

			const result = await service.create('user-1', mealData as any, nutritionData as any);

			expect(mockDb.insert).toHaveBeenCalledTimes(2);
			expect(result).toEqual({ ...mockMeal, nutrition: mockNutrition });
		});
	});

	describe('findByDate', () => {
		it('should return meals for a specific date', async () => {
			mockDb.orderBy.mockResolvedValueOnce([{ meals: mockMeal, meal_nutrition: mockNutrition }]);

			const result = await service.findByDate('user-1', new Date('2024-01-15'));

			expect(mockDb.select).toHaveBeenCalled();
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ ...mockMeal, nutrition: mockNutrition });
		});

		it('should return empty array when no meals found', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findByDate('user-1', new Date('2024-01-16'));

			expect(result).toEqual([]);
		});

		it('should handle meals without nutrition data', async () => {
			mockDb.orderBy.mockResolvedValueOnce([{ meals: mockMeal, meal_nutrition: null }]);

			const result = await service.findByDate('user-1', new Date('2024-01-15'));

			expect(result[0].nutrition).toBeNull();
		});
	});

	describe('findByDateRange', () => {
		it('should return meals within date range', async () => {
			const meal1 = { ...mockMeal, id: 'meal-1', date: new Date('2024-01-15') };
			const meal2 = { ...mockMeal, id: 'meal-2', date: new Date('2024-01-16') };

			mockDb.orderBy.mockResolvedValueOnce([
				{ meals: meal2, meal_nutrition: mockNutrition },
				{ meals: meal1, meal_nutrition: mockNutrition },
			]);

			const result = await service.findByDateRange(
				'user-1',
				new Date('2024-01-15'),
				new Date('2024-01-17')
			);

			expect(result).toHaveLength(2);
		});
	});

	describe('findOne', () => {
		it('should return a single meal with nutrition', async () => {
			const result = await service.findOne('user-1', 'meal-1');

			expect(result).toEqual({ ...mockMeal, nutrition: mockNutrition });
		});

		it('should return null if meal not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.findOne('user-1', 'meal-999');

			expect(result).toBeNull();
		});

		it('should return null if meal belongs to different user', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.findOne('user-2', 'meal-1');

			expect(result).toBeNull();
		});
	});

	describe('delete', () => {
		it('should delete meal and return deleted record', async () => {
			mockDb.returning.mockResolvedValueOnce([mockMeal]);

			const result = await service.delete('user-1', 'meal-1');

			expect(mockDb.delete).toHaveBeenCalled();
			expect(result).toEqual(mockMeal);
		});

		it('should return undefined if meal not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.delete('user-1', 'meal-999');

			expect(result).toBeUndefined();
		});

		it('should not delete meal of different user', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.delete('user-2', 'meal-1');

			expect(result).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should update meal data', async () => {
			const updatedMeal = { ...mockMeal, description: 'Updated description' };
			mockDb.returning.mockResolvedValueOnce([updatedMeal]);
			mockDb.limit.mockResolvedValueOnce([{ meals: updatedMeal, meal_nutrition: mockNutrition }]);

			const result = await service.update('user-1', 'meal-1', {
				description: 'Updated description',
			});

			expect(mockDb.update).toHaveBeenCalled();
			expect(result?.description).toBe('Updated description');
		});

		it('should update meal and nutrition data', async () => {
			const updatedMeal = { ...mockMeal, description: 'Updated' };
			const updatedNutrition = { ...mockNutrition, calories: 700 };
			mockDb.returning.mockResolvedValueOnce([updatedMeal]);
			mockDb.limit.mockResolvedValueOnce([
				{ meals: updatedMeal, meal_nutrition: updatedNutrition },
			]);

			const result = await service.update(
				'user-1',
				'meal-1',
				{ description: 'Updated' },
				{ calories: 700 }
			);

			expect(mockDb.update).toHaveBeenCalledTimes(2);
			expect(result?.nutrition?.calories).toBe(700);
		});
	});
});
