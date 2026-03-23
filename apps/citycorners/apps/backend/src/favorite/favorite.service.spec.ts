import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockDb, createMockFavorite, TEST_USER_ID } from '../__tests__/mock-factories';

describe('FavoriteService', () => {
	let service: FavoriteService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [FavoriteService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<FavoriteService>(FavoriteService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findByUserId', () => {
		it('should return user favorites', async () => {
			const favorites = [
				createMockFavorite(),
				createMockFavorite({ id: 'fav-2', locationId: 'loc-2' }),
			];
			mockDb.where.mockResolvedValue(favorites);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(favorites);
			expect(result).toHaveLength(2);
		});

		it('should return empty array if no favorites', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('add', () => {
		it('should add a location to favorites', async () => {
			const favorite = createMockFavorite();
			// First call: check existence -> empty
			mockDb.where.mockResolvedValueOnce([]);
			// Second call: insert + returning
			mockDb.returning.mockResolvedValue([favorite]);

			const result = await service.add(TEST_USER_ID, 'loc-1');

			expect(result).toEqual(favorite);
		});

		it('should throw ConflictException if already favorited', async () => {
			mockDb.where.mockResolvedValue([createMockFavorite()]);

			await expect(service.add(TEST_USER_ID, 'loc-1')).rejects.toThrow(ConflictException);
		});
	});

	describe('remove', () => {
		it('should remove a favorite', async () => {
			mockDb.where.mockResolvedValue(undefined);

			await expect(service.remove(TEST_USER_ID, 'loc-1')).resolves.not.toThrow();
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('isFavorite', () => {
		it('should return true if favorited', async () => {
			mockDb.where.mockResolvedValue([createMockFavorite()]);

			const result = await service.isFavorite(TEST_USER_ID, 'loc-1');

			expect(result).toBe(true);
		});

		it('should return false if not favorited', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.isFavorite(TEST_USER_ID, 'loc-2');

			expect(result).toBe(false);
		});
	});
});
