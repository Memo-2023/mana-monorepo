import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { mockFileFactory, mockFolderFactory } from '../__tests__/utils/mock-factories';

describe('SearchController', () => {
	let controller: SearchController;
	let searchService: jest.Mocked<SearchService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockSearchService = {
			search: jest.fn(),
			getFavorites: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SearchController],
			providers: [{ provide: SearchService, useValue: mockSearchService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<SearchController>(SearchController);
		searchService = module.get(SearchService);
	});

	describe('search', () => {
		it('should search and return matching files and folders', async () => {
			const searchResults = {
				files: mockFileFactory.createMany(2, { name: 'report.pdf' }),
				folders: mockFolderFactory.createMany(1, { name: 'Reports' }),
			};
			searchService.search.mockResolvedValue(searchResults as any);

			const result = await controller.search(mockUser, 'report');

			expect(searchService.search).toHaveBeenCalledWith('test-user-id', 'report');
			expect(result).toEqual(searchResults);
		});

		it('should return empty arrays when query is empty', async () => {
			const result = await controller.search(mockUser, '');

			expect(searchService.search).not.toHaveBeenCalled();
			expect(result).toEqual({ files: [], folders: [] });
		});

		it('should return empty arrays when query is undefined', async () => {
			const result = await controller.search(mockUser, undefined as any);

			expect(searchService.search).not.toHaveBeenCalled();
			expect(result).toEqual({ files: [], folders: [] });
		});

		it('should return empty arrays when query is only whitespace', async () => {
			const result = await controller.search(mockUser, '   ');

			expect(searchService.search).not.toHaveBeenCalled();
			expect(result).toEqual({ files: [], folders: [] });
		});

		it('should trim the query before passing to service', async () => {
			const searchResults = { files: [], folders: [] };
			searchService.search.mockResolvedValue(searchResults as any);

			await controller.search(mockUser, '  report  ');

			expect(searchService.search).toHaveBeenCalledWith('test-user-id', 'report');
		});
	});

	describe('getFavorites', () => {
		it('should return favorite files and folders', async () => {
			const favorites = {
				files: mockFileFactory.createMany(2, { isFavorite: true }),
				folders: mockFolderFactory.createMany(1, { isFavorite: true }),
			};
			searchService.getFavorites.mockResolvedValue(favorites as any);

			const result = await controller.getFavorites(mockUser);

			expect(searchService.getFavorites).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual(favorites);
		});
	});
});
