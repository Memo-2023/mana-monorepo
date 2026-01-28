import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('RecommendationsService', () => {
	let service: RecommendationsService;
	let mockDb: any;

	const mockRecommendation = {
		id: 'rec-1',
		userId: 'user-1',
		date: new Date(),
		type: 'hint',
		priority: 'medium',
		message: 'Deine Proteinaufnahme ist heute niedrig.',
		nutrient: 'protein',
		actionable: 'Füge mehr proteinreiche Lebensmittel hinzu',
		dismissed: false,
		createdAt: new Date(),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue([mockRecommendation]),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([mockRecommendation]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RecommendationsService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<RecommendationsService>(RecommendationsService);
	});

	describe('findByDate', () => {
		it('should return non-dismissed recommendations', async () => {
			const recommendations = [mockRecommendation, { ...mockRecommendation, id: 'rec-2' }];
			mockDb.limit.mockResolvedValueOnce(recommendations);

			const result = await service.findByDate('user-1', new Date());

			expect(mockDb.select).toHaveBeenCalled();
			expect(result).toHaveLength(2);
		});

		it('should limit to 10 results', async () => {
			await service.findByDate('user-1', new Date());

			expect(mockDb.limit).toHaveBeenCalledWith(10);
		});

		it('should return empty array when no recommendations', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.findByDate('user-1', new Date());

			expect(result).toEqual([]);
		});
	});

	describe('create', () => {
		it('should create a recommendation with dismissed=false', async () => {
			const newRec = {
				date: new Date(),
				type: 'hint' as const,
				priority: 'high' as const,
				message: 'Test message',
				nutrient: 'sugar',
				actionable: 'Do something',
			};

			await service.create('user-1', newRec);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({ dismissed: false, userId: 'user-1' })
			);
		});
	});

	describe('dismiss', () => {
		it('should mark recommendation as dismissed', async () => {
			const dismissedRec = { ...mockRecommendation, dismissed: true };
			mockDb.returning.mockResolvedValueOnce([dismissedRec]);

			const result = await service.dismiss('user-1', 'rec-1');

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith({ dismissed: true });
			expect(result?.dismissed).toBe(true);
		});

		it('should return undefined if not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.dismiss('user-1', 'rec-999');

			expect(result).toBeUndefined();
		});
	});

	describe('generateHints', () => {
		it('should generate low protein hint', async () => {
			const nutritionSummary = { protein: 20, fiber: 25, sugar: 30 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(1);
			expect(hints[0].nutrient).toBe('protein');
			expect(hints[0].priority).toBe('medium');
			expect(hints[0].message).toContain('Proteinaufnahme');
		});

		it('should generate low fiber hint', async () => {
			const nutritionSummary = { protein: 50, fiber: 5, sugar: 30 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(1);
			expect(hints[0].nutrient).toBe('fiber');
			expect(hints[0].priority).toBe('low');
			expect(hints[0].message).toContain('Ballaststoffe');
		});

		it('should generate high sugar hint', async () => {
			const nutritionSummary = { protein: 50, fiber: 25, sugar: 60 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(1);
			expect(hints[0].nutrient).toBe('sugar');
			expect(hints[0].priority).toBe('high');
			expect(hints[0].message).toContain('Zuckeraufnahme');
		});

		it('should generate multiple hints when applicable', async () => {
			const nutritionSummary = { protein: 15, fiber: 5, sugar: 70 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(3);
			expect(hints.map((h) => h.nutrient)).toContain('protein');
			expect(hints.map((h) => h.nutrient)).toContain('fiber');
			expect(hints.map((h) => h.nutrient)).toContain('sugar');
		});

		it('should not generate hints when nutrition is good', async () => {
			const nutritionSummary = { protein: 50, fiber: 30, sugar: 25 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(0);
		});

		it('should save hints to database', async () => {
			const nutritionSummary = { protein: 10, fiber: 25, sugar: 30 };

			await service.generateHints('user-1', nutritionSummary);

			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should handle missing nutrition values', async () => {
			const nutritionSummary = {};

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints).toHaveLength(0);
		});

		it('should include German actionable suggestions', async () => {
			const nutritionSummary = { protein: 10 };

			const hints = await service.generateHints('user-1', nutritionSummary);

			expect(hints[0].actionable).toContain('Hühnchen');
		});

		it('should check thresholds correctly - protein boundary', async () => {
			// Exactly at threshold (25) should NOT trigger
			const atThreshold = { protein: 25 };
			const hints1 = await service.generateHints('user-1', atThreshold);
			expect(hints1).toHaveLength(0);

			// Below threshold should trigger
			const belowThreshold = { protein: 24 };
			const hints2 = await service.generateHints('user-1', belowThreshold);
			expect(hints2).toHaveLength(1);
		});

		it('should check thresholds correctly - fiber boundary', async () => {
			const atThreshold = { fiber: 10 };
			const hints1 = await service.generateHints('user-1', atThreshold);
			expect(hints1).toHaveLength(0);

			const belowThreshold = { fiber: 9 };
			const hints2 = await service.generateHints('user-1', belowThreshold);
			expect(hints2).toHaveLength(1);
		});

		it('should check thresholds correctly - sugar boundary', async () => {
			const atThreshold = { sugar: 50 };
			const hints1 = await service.generateHints('user-1', atThreshold);
			expect(hints1).toHaveLength(0);

			const aboveThreshold = { sugar: 51 };
			const hints2 = await service.generateHints('user-1', aboveThreshold);
			expect(hints2).toHaveLength(1);
		});
	});
});
