import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LocationService } from './location.service';
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

	describe('findAll', () => {
		it('should return paginated locations', async () => {
			const locations = [
				createMockLocation(),
				createMockLocation({ id: 'loc-2', name: 'Imperia' }),
			];
			// Without category: count calls from() which resolves, data calls offset()
			mockDb.from
				.mockResolvedValueOnce([{ count: 2 }]) // count query
				.mockReturnThis(); // data query chain continues
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
			mockDb.from.mockResolvedValueOnce([{ count: 50 }]).mockReturnThis();
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
		it('should create a new location', async () => {
			const newLocation = createMockLocation({ id: 'loc-new' });
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
		it('should delete a location owned by user', async () => {
			const existing = createMockLocation({ createdBy: 'user-1' });
			mockDb.where.mockResolvedValueOnce([existing]); // findById

			await expect(service.delete('loc-1', 'user-1')).resolves.not.toThrow();
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
});
