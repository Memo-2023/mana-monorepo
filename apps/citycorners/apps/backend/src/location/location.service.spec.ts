import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LocationService, generateSlug } from './location.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockDb, createMockLocation } from '../__tests__/mock-factories';

describe('LocationService', () => {
	let service: LocationService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [LocationService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<LocationService>(LocationService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('generateSlug', () => {
		it('should convert name to slug', () => {
			expect(generateSlug('Konstanzer Münster')).toBe('konstanzer-muenster');
		});

		it('should replace umlauts', () => {
			expect(generateSlug('Über den Flüssen')).toBe('ueber-den-fluessen');
		});

		it('should replace ß with ss', () => {
			expect(generateSlug('Große Straße')).toBe('grosse-strasse');
		});

		it('should deduplicate hyphens', () => {
			expect(generateSlug('Name -- with --- hyphens')).toBe('name-with-hyphens');
		});

		it('should trim leading/trailing hyphens', () => {
			expect(generateSlug('  Hello World  ')).toBe('hello-world');
		});
	});

	describe('findAll', () => {
		it('should return paginated locations', async () => {
			const locations = [
				createMockLocation(),
				createMockLocation({ id: 'loc-2', name: 'Imperia' }),
			];
			// Without category: count query calls where() (for notDeleted filter), data calls offset()
			mockDb.where.mockResolvedValueOnce([{ count: 2 }]); // count query
			mockDb.offset.mockResolvedValue(locations);

			const result = await service.findAll();

			expect(result.items).toEqual(locations);
			expect(result.total).toBe(2);
			expect(result.page).toBe(1);
			expect(result.limit).toBe(20);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should filter by category', async () => {
			const museums = [
				createMockLocation({ id: 'loc-3', category: 'museum', name: 'Rosgartenmuseum' }),
			];
			// With category: count calls where(), data calls offset()
			mockDb.where.mockResolvedValueOnce([{ count: 1 }]); // count query
			mockDb.offset.mockResolvedValue(museums);

			const result = await service.findAll('museum');

			expect(result.items).toEqual(museums);
			expect(result.total).toBe(1);
		});

		it('should respect page and limit', async () => {
			mockDb.where.mockResolvedValueOnce([{ count: 50 }]);
			mockDb.offset.mockResolvedValue([]);

			const result = await service.findAll(undefined, 3, 10);

			expect(result.page).toBe(3);
			expect(result.limit).toBe(10);
			expect(result.totalPages).toBe(5);
		});
	});

	describe('findById', () => {
		it('should return a location by id', async () => {
			const location = createMockLocation();
			mockDb.where.mockResolvedValue([location]);

			const result = await service.findById('loc-1');

			expect(result).toEqual(location);
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
		});
	});

	describe('findBySlug', () => {
		it('should return a location by slug', async () => {
			const location = createMockLocation();
			mockDb.where.mockResolvedValue([location]);

			const result = await service.findBySlug('konstanzer-muenster');

			expect(result).toEqual(location);
		});

		it('should throw NotFoundException if slug not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
		});
	});

	describe('findByIdOrSlug', () => {
		it('should call findById for UUID', async () => {
			const location = createMockLocation();
			mockDb.where.mockResolvedValue([location]);

			const result = await service.findByIdOrSlug('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

			expect(result).toEqual(location);
		});

		it('should call findBySlug for non-UUID', async () => {
			const location = createMockLocation();
			mockDb.where.mockResolvedValue([location]);

			const result = await service.findByIdOrSlug('konstanzer-muenster');

			expect(result).toEqual(location);
		});
	});

	describe('search', () => {
		it('should search locations by query', async () => {
			const locations = [createMockLocation()];
			mockDb.where.mockResolvedValue(locations);

			const result = await service.search('Münster');

			expect(result).toEqual(locations);
		});

		it('should return empty array for no matches', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.search('nonexistent');

			expect(result).toEqual([]);
		});
	});

	describe('create', () => {
		it('should create a new location with auto-generated slug', async () => {
			const newLocation = createMockLocation({ id: 'loc-new' });
			// generateUniqueSlug: check existing slug
			mockDb.where.mockResolvedValueOnce([]); // no existing slug
			mockDb.returning.mockResolvedValue([newLocation]);

			const result = await service.create({
				name: 'Test Location',
				category: 'sight',
				description: 'A test location',
			});

			expect(result).toEqual(newLocation);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a location owned by user', async () => {
			const existing = createMockLocation({ createdBy: 'user-1' });
			mockDb.where.mockResolvedValueOnce([existing]); // findById
			const updated = createMockLocation({ name: 'Updated Name', createdBy: 'user-1' });
			mockDb.returning.mockResolvedValue([updated]);

			const result = await service.update('loc-1', { name: 'Updated Name' }, 'user-1');

			expect(result.name).toBe('Updated Name');
		});

		it('should throw ForbiddenException if not owner', async () => {
			const existing = createMockLocation({ createdBy: 'other-user' });
			mockDb.where.mockResolvedValueOnce([existing]); // findById

			await expect(service.update('loc-1', { name: 'Hacked' }, 'attacker-user')).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should allow update of unowned locations', async () => {
			const existing = createMockLocation({ createdBy: null as any });
			mockDb.where.mockResolvedValueOnce([existing]); // findById
			const updated = createMockLocation({ name: 'Updated' });
			mockDb.returning.mockResolvedValue([updated]);

			const result = await service.update('loc-1', { name: 'Updated' }, 'any-user');

			expect(result.name).toBe('Updated');
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should soft delete a location owned by user', async () => {
			const existing = createMockLocation({ createdBy: 'user-1' });
			mockDb.where
				.mockResolvedValueOnce([existing]) // findById
				.mockReturnThis(); // update where

			await expect(service.delete('loc-1', 'user-1')).resolves.not.toThrow();
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw ForbiddenException if not owner', async () => {
			const existing = createMockLocation({ createdBy: 'other-user' });
			mockDb.where.mockResolvedValueOnce([existing]); // findById

			await expect(service.delete('loc-1', 'attacker-user')).rejects.toThrow(ForbiddenException);
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
		});
	});

	describe('restore', () => {
		it('should restore a soft-deleted location', async () => {
			const deleted = createMockLocation({
				createdBy: 'user-1',
				deletedAt: new Date(),
			});
			mockDb.where.mockResolvedValueOnce([deleted]); // find
			const restored = createMockLocation({ createdBy: 'user-1', deletedAt: null });
			mockDb.returning.mockResolvedValue([restored]);

			const result = await service.restore('loc-1', 'user-1');

			expect(result.deletedAt).toBeNull();
		});

		it('should throw ForbiddenException if not owner', async () => {
			const deleted = createMockLocation({
				createdBy: 'other-user',
				deletedAt: new Date(),
			});
			mockDb.where.mockResolvedValueOnce([deleted]);

			await expect(service.restore('loc-1', 'attacker-user')).rejects.toThrow(ForbiddenException);
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.restore('nonexistent')).rejects.toThrow(NotFoundException);
		});
	});
});
