import { LocationController } from './location.controller';
import { createMockLocation, TEST_USER_ID, TEST_USER_EMAIL } from '../__tests__/mock-factories';

const mockUser = { userId: TEST_USER_ID, email: TEST_USER_EMAIL } as any;

describe('LocationController', () => {
	let controller: LocationController;
	let locationService: any;
	let lookupService: any;
	let reviewService: any;

	beforeEach(() => {
		locationService = {
			findAll: jest.fn(),
			findById: jest.fn(),
			findBySlug: jest.fn(),
			findByIdOrSlug: jest.fn(),
			search: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			restore: jest.fn(),
		};
		lookupService = {
			lookup: jest.fn(),
		};
		reviewService = {
			getStats: jest.fn().mockResolvedValue({ averageRating: 0, totalReviews: 0 }),
			getStatsForLocations: jest.fn().mockResolvedValue({}),
		};
		controller = new LocationController(locationService, lookupService, reviewService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return paginated locations', async () => {
			const locations = [createMockLocation(), createMockLocation({ id: 'loc-2' })];
			locationService.findAll.mockResolvedValue({
				items: locations,
				total: 2,
				page: 1,
				limit: 20,
				totalPages: 1,
			});

			const result = await controller.findAll();

			expect(result.locations).toEqual(locations);
			expect(result.pagination).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 });
		});

		it('should pass category and pagination params', async () => {
			locationService.findAll.mockResolvedValue({
				items: [],
				total: 0,
				page: 2,
				limit: 10,
				totalPages: 0,
			});

			await controller.findAll('museum', '2', '10');

			expect(locationService.findAll).toHaveBeenCalledWith('museum', 2, 10);
		});
	});

	describe('findById', () => {
		it('should use findByIdOrSlug', async () => {
			const location = createMockLocation();
			locationService.findByIdOrSlug.mockResolvedValue(location);

			const result = await controller.findById('konstanzer-muenster');

			expect(locationService.findByIdOrSlug).toHaveBeenCalledWith('konstanzer-muenster');
			expect(result).toEqual({ location });
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
		it('should create a location with createdBy', async () => {
			const location = createMockLocation({ id: 'new-loc', createdBy: TEST_USER_ID });
			locationService.create.mockResolvedValue(location);

			const result = await controller.create(mockUser, {
				name: 'Test',
				category: 'sight' as const,
				description: 'A test location',
			});

			expect(result).toEqual({ location });
			expect(locationService.create).toHaveBeenCalledWith({
				name: 'Test',
				category: 'sight',
				description: 'A test location',
				createdBy: TEST_USER_ID,
			});
		});
	});

	describe('update', () => {
		it('should pass userId to service', async () => {
			const location = createMockLocation({ name: 'Updated' });
			locationService.update.mockResolvedValue(location);

			await controller.update(mockUser, 'loc-1', { name: 'Updated' });

			expect(locationService.update).toHaveBeenCalledWith(
				'loc-1',
				{ name: 'Updated' },
				TEST_USER_ID
			);
		});
	});

	describe('delete', () => {
		it('should pass userId to service', async () => {
			locationService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'loc-1');

			expect(result).toEqual({ success: true });
			expect(locationService.delete).toHaveBeenCalledWith('loc-1', TEST_USER_ID);
		});
	});

	describe('restore', () => {
		it('should restore a soft-deleted location', async () => {
			const location = createMockLocation();
			locationService.restore.mockResolvedValue(location);

			const result = await controller.restore(mockUser, 'loc-1');

			expect(result).toEqual({ location });
			expect(locationService.restore).toHaveBeenCalledWith('loc-1', TEST_USER_ID);
		});
	});
});
