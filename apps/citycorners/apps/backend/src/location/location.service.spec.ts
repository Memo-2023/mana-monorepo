import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
		it('should return all locations', async () => {
			const locations = [
				createMockLocation(),
				createMockLocation({ id: 'loc-2', name: 'Imperia' }),
			];
			mockDb.where.mockResolvedValue(locations);
			// findAll without category calls db.select().from(locations) which resolves via the chain
			// Need to handle the case without category
			mockDb.from.mockResolvedValue(locations);

			const result = await service.findAll();

			expect(result).toEqual(locations);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should filter by category', async () => {
			const museums = [
				createMockLocation({ id: 'loc-3', category: 'museum', name: 'Rosgartenmuseum' }),
			];
			mockDb.where.mockResolvedValue(museums);

			const result = await service.findAll('museum');

			expect(result).toEqual(museums);
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
		it('should update a location', async () => {
			const updated = createMockLocation({ name: 'Updated Name' });
			mockDb.returning.mockResolvedValue([updated]);

			const result = await service.update('loc-1', { name: 'Updated Name' });

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.returning.mockResolvedValue([]);

			await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a location', async () => {
			mockDb.returning.mockResolvedValue([createMockLocation()]);

			await expect(service.delete('loc-1')).resolves.not.toThrow();
		});

		it('should throw NotFoundException if not found', async () => {
			mockDb.returning.mockResolvedValue([]);

			await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
		});
	});
});
