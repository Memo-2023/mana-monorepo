import { LocationController } from './location.controller';
import { createMockLocation, TEST_USER_ID, TEST_USER_EMAIL } from '../__tests__/mock-factories';

const mockUser = { userId: TEST_USER_ID, email: TEST_USER_EMAIL } as any;

describe('LocationController', () => {
	let controller: LocationController;
	let locationService: any;
	let lookupService: any;

	beforeEach(() => {
		locationService = {
			findAll: jest.fn(),
			findById: jest.fn(),
			search: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		lookupService = {
			lookup: jest.fn(),
		};
		controller = new LocationController(locationService, lookupService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return all locations', async () => {
			const locations = [createMockLocation(), createMockLocation({ id: 'loc-2' })];
			locationService.findAll.mockResolvedValue(locations);

			const result = await controller.findAll();

			expect(result).toEqual({ locations });
		});

		it('should filter by category', async () => {
			const museums = [createMockLocation({ category: 'museum' })];
			locationService.findAll.mockResolvedValue(museums);

			const result = await controller.findAll('museum');

			expect(result).toEqual({ locations: museums });
			expect(locationService.findAll).toHaveBeenCalledWith('museum');
		});
	});

	describe('search', () => {
		it('should search locations', async () => {
			const locations = [createMockLocation()];
			locationService.search.mockResolvedValue(locations);

			const result = await controller.search('Münster');

			expect(result).toEqual({ locations });
		});

		it('should return empty for empty query', async () => {
			const result = await controller.search('');

			expect(result).toEqual({ locations: [] });
		});
	});

	describe('lookup', () => {
		it('should return lookup result', async () => {
			const lookupResult = {
				name: 'Konzil',
				description: 'Historic building',
				category: 'sight',
				sources: [{ url: 'https://example.com', title: 'Konzil' }],
			};
			lookupService.lookup.mockResolvedValue(lookupResult);

			const result = await controller.lookup('Konzil');

			expect(result).toEqual({ result: lookupResult });
		});

		it('should return null for empty query', async () => {
			const result = await controller.lookup('');

			expect(result).toEqual({ result: null });
		});
	});

	describe('create', () => {
		it('should create a location', async () => {
			const location = createMockLocation({ id: 'new-loc' });
			locationService.create.mockResolvedValue(location);

			const result = await controller.create(mockUser, {
				name: 'Test',
				category: 'sight' as const,
				description: 'A test location',
			});

			expect(result).toEqual({ location });
		});
	});

	describe('delete', () => {
		it('should delete a location', async () => {
			locationService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'loc-1');

			expect(result).toEqual({ success: true });
		});
	});
});
