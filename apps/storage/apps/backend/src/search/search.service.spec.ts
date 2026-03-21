import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE_CONNECTION } from '../db/database.module';
import { SearchService } from './search.service';
import {
	createMockDb,
	mockFileFactory,
	mockFolderFactory,
} from '../__tests__/utils/mock-factories';

describe('SearchService', () => {
	let service: SearchService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [SearchService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<SearchService>(SearchService);
	});

	describe('search', () => {
		it('should return matching files and folders', async () => {
			const matchingFiles = mockFileFactory.createMany(2, { name: 'report.pdf' });
			const matchingFolders = mockFolderFactory.createMany(1, { name: 'Reports' });

			// First query: files search (select -> from -> where -> limit)
			mockDb.limit.mockResolvedValueOnce(matchingFiles);
			// Second query: folders search
			mockDb.limit.mockResolvedValueOnce(matchingFolders);

			const result = await service.search('test-user-id', 'report');

			expect(result.files).toEqual(matchingFiles);
			expect(result.folders).toEqual(matchingFolders);
		});

		it('should return empty results when nothing matches', async () => {
			mockDb.limit.mockResolvedValueOnce([]);
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.search('test-user-id', 'nonexistent-query');

			expect(result.files).toEqual([]);
			expect(result.folders).toEqual([]);
		});

		it('should search with partial matches', async () => {
			const files = mockFileFactory.createMany(1, { name: 'my-document.pdf' });
			mockDb.limit.mockResolvedValueOnce(files);
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.search('test-user-id', 'doc');

			expect(result.files).toHaveLength(1);
		});

		it('should limit results to 50', async () => {
			const manyFiles = mockFileFactory.createMany(50);
			mockDb.limit.mockResolvedValueOnce(manyFiles);
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.search('test-user-id', 'test');

			expect(result.files).toHaveLength(50);
			expect(mockDb.limit).toHaveBeenCalledWith(50);
		});
	});

	describe('getFavorites', () => {
		it('should return favorite files and folders', async () => {
			const favoriteFiles = mockFileFactory.createMany(2, { isFavorite: true });
			const favoriteFolders = mockFolderFactory.createMany(1, { isFavorite: true });

			// First where call: favorite files
			mockDb.where.mockResolvedValueOnce(favoriteFiles);
			// Second where call: favorite folders
			mockDb.where.mockResolvedValueOnce(favoriteFolders);

			const result = await service.getFavorites('test-user-id');

			expect(result.files).toEqual(favoriteFiles);
			expect(result.folders).toEqual(favoriteFolders);
			expect(result.files.every((f) => f.isFavorite)).toBe(true);
			expect(result.folders.every((f) => f.isFavorite)).toBe(true);
		});

		it('should return empty arrays when no favorites exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getFavorites('test-user-id');

			expect(result.files).toEqual([]);
			expect(result.folders).toEqual([]);
		});

		it('should only return non-deleted favorites', async () => {
			const favoriteFiles = mockFileFactory.createMany(3, {
				isFavorite: true,
				isDeleted: false,
			});
			mockDb.where.mockResolvedValueOnce(favoriteFiles);
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getFavorites('test-user-id');

			expect(result.files).toHaveLength(3);
			expect(result.files.every((f) => !f.isDeleted)).toBe(true);
		});
	});
});
