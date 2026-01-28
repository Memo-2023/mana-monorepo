import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { DATABASE_CONNECTION } from '../db/database.module';

describe('FavoritesService', () => {
	let service: FavoritesService;
	let mockDb: any;

	const mockFavorite = {
		id: 'fav-1',
		userId: 'user-1',
		name: 'Lieblings-Spaghetti',
		nutrition: { calories: 650, protein: 25, carbohydrates: 80, fat: 20 },
		usageCount: 5,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockResolvedValue([mockFavorite]),
			limit: jest.fn().mockResolvedValue([mockFavorite]),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([mockFavorite]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FavoritesService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<FavoritesService>(FavoritesService);
	});

	describe('findAll', () => {
		it('should return all favorites ordered by usage count', async () => {
			const favorites = [
				{ ...mockFavorite, id: 'fav-1', usageCount: 10 },
				{ ...mockFavorite, id: 'fav-2', usageCount: 5 },
			];
			mockDb.orderBy.mockResolvedValueOnce(favorites);

			const result = await service.findAll('user-1');

			expect(mockDb.select).toHaveBeenCalled();
			expect(result).toHaveLength(2);
			expect(result[0].usageCount).toBeGreaterThan(result[1].usageCount);
		});

		it('should return empty array when no favorites', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findAll('user-1');

			expect(result).toEqual([]);
		});
	});

	describe('create', () => {
		it('should create a favorite with usageCount 0', async () => {
			const newFavorite = { ...mockFavorite, usageCount: 0 };
			mockDb.returning.mockResolvedValueOnce([newFavorite]);

			const result = await service.create('user-1', {
				name: 'Lieblings-Spaghetti',
				description: 'Leckere Spaghetti mit Bolognese',
				mealType: 'lunch',
				nutrition: { calories: 650, protein: 25, carbohydrates: 80, fat: 20 },
			});

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({ usageCount: 0, userId: 'user-1' })
			);
			expect(result.usageCount).toBe(0);
		});
	});

	describe('incrementUsage', () => {
		it('should increment usage count', async () => {
			const updatedFavorite = { ...mockFavorite, usageCount: 6 };
			mockDb.returning.mockResolvedValueOnce([updatedFavorite]);

			const result = await service.incrementUsage('user-1', 'fav-1');

			expect(mockDb.update).toHaveBeenCalled();
			expect(result?.usageCount).toBe(6);
		});

		it('should return null if favorite not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.incrementUsage('user-1', 'fav-999');

			expect(result).toBeNull();
		});

		it('should not increment for wrong user', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.incrementUsage('user-2', 'fav-1');

			expect(result).toBeNull();
		});
	});

	describe('delete', () => {
		it('should delete favorite and return deleted record', async () => {
			mockDb.returning.mockResolvedValueOnce([mockFavorite]);

			const result = await service.delete('user-1', 'fav-1');

			expect(mockDb.delete).toHaveBeenCalled();
			expect(result).toEqual(mockFavorite);
		});

		it('should return undefined if not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.delete('user-1', 'fav-999');

			expect(result).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should update favorite fields', async () => {
			const updatedFavorite = { ...mockFavorite, name: 'Neue Spaghetti' };
			mockDb.returning.mockResolvedValueOnce([updatedFavorite]);

			const result = await service.update('user-1', 'fav-1', { name: 'Neue Spaghetti' });

			expect(mockDb.update).toHaveBeenCalled();
			expect(result?.name).toBe('Neue Spaghetti');
		});

		it('should set updatedAt timestamp', async () => {
			const before = new Date();
			mockDb.returning.mockResolvedValueOnce([{ ...mockFavorite, updatedAt: new Date() }]);

			await service.update('user-1', 'fav-1', { name: 'Updated' });

			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({ updatedAt: expect.any(Date) })
			);
		});

		it('should return undefined if not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.update('user-1', 'fav-999', { name: 'Updated' });

			expect(result).toBeUndefined();
		});
	});
});
