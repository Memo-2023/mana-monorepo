import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('GoalsService', () => {
	let service: GoalsService;
	let mockDb: any;

	const mockGoals = {
		id: 'goal-1',
		userId: 'user-1',
		dailyCalories: 2000,
		dailyProtein: 50,
		dailyCarbs: 275,
		dailyFat: 78,
		dailyFiber: 28,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue([mockGoals]),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([mockGoals]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GoalsService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<GoalsService>(GoalsService);
	});

	describe('getGoals', () => {
		it('should return goals for a user', async () => {
			const result = await service.getGoals('user-1');

			expect(mockDb.select).toHaveBeenCalled();
			expect(result).toEqual(mockGoals);
		});

		it('should return null if no goals found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getGoals('user-2');

			expect(result).toBeNull();
		});
	});

	describe('createOrUpdate', () => {
		const newGoalsData = {
			dailyCalories: 2500,
			dailyProtein: 100,
			dailyCarbs: 300,
			dailyFat: 80,
			dailyFiber: 30,
		};

		it('should create new goals if none exist', async () => {
			mockDb.limit.mockResolvedValueOnce([]); // getGoals returns null

			const result = await service.createOrUpdate('user-1', newGoalsData);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(result).toEqual(mockGoals);
		});

		it('should update existing goals', async () => {
			const updatedGoals = { ...mockGoals, ...newGoalsData };
			mockDb.returning.mockResolvedValueOnce([updatedGoals]);

			const result = await service.createOrUpdate('user-1', newGoalsData);

			expect(mockDb.update).toHaveBeenCalled();
			expect(result).toEqual(updatedGoals);
		});
	});

	describe('delete', () => {
		it('should delete goals and return deleted record', async () => {
			mockDb.returning.mockResolvedValueOnce([mockGoals]);

			const result = await service.delete('user-1');

			expect(mockDb.delete).toHaveBeenCalled();
			expect(result).toEqual(mockGoals);
		});

		it('should return undefined if no goals to delete', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.delete('user-2');

			expect(result).toBeUndefined();
		});
	});
});
