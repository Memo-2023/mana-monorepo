import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SpaceService } from './space.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockSpace, TEST_USER_ID } from '../__tests__/utils/mock-factories';
import { createMockDb } from '../__tests__/utils/mock-db';

describe('SpaceService', () => {
	let service: SpaceService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SpaceService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<SpaceService>(SpaceService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('should return all spaces for a user', async () => {
			const spaces = [createMockSpace({ name: 'Space 1' }), createMockSpace({ name: 'Space 2' })];
			mockDb.orderBy.mockResolvedValueOnce(spaces);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(spaces);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
		});

		it('should return empty array when user has no spaces', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return space when found', async () => {
			const space = createMockSpace();
			mockDb.where.mockResolvedValueOnce([space]);

			const result = await service.findById(space.id, TEST_USER_ID);

			expect(result).toEqual(space);
		});

		it('should return null when space not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return space when found', async () => {
			const space = createMockSpace();
			mockDb.where.mockResolvedValueOnce([space]);

			const result = await service.findByIdOrThrow(space.id, TEST_USER_ID);

			expect(result).toEqual(space);
		});

		it('should throw NotFoundException when space not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a new space', async () => {
			const newSpace = createMockSpace({ name: 'New Space' });
			mockDb.returning.mockResolvedValueOnce([newSpace]);

			const result = await service.create(TEST_USER_ID, {
				name: 'New Space',
				description: 'Test description',
			});

			expect(result).toEqual(newSpace);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should create space with default pinned=true', async () => {
			const newSpace = createMockSpace({ pinned: true });
			mockDb.returning.mockResolvedValueOnce([newSpace]);

			const result = await service.create(TEST_USER_ID, { name: 'Pinned Space' });

			expect(result.pinned).toBe(true);
		});

		it('should create space with pinned=false', async () => {
			const newSpace = createMockSpace({ pinned: false });
			mockDb.returning.mockResolvedValueOnce([newSpace]);

			const result = await service.create(TEST_USER_ID, {
				name: 'Unpinned',
				pinned: false,
			});

			expect(result.pinned).toBe(false);
		});

		it('should create space with prefix', async () => {
			const newSpace = createMockSpace({ prefix: 'P' });
			mockDb.returning.mockResolvedValueOnce([newSpace]);

			const result = await service.create(TEST_USER_ID, {
				name: 'Project',
				prefix: 'P',
			});

			expect(result.prefix).toBe('P');
		});
	});

	describe('update', () => {
		it('should update space', async () => {
			const space = createMockSpace();
			const updated = { ...space, name: 'Updated Name' };
			mockDb.where.mockResolvedValueOnce([space]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update(space.id, TEST_USER_ID, { name: 'Updated Name' });

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NotFoundException when updating non-existent space', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.update('non-existent', TEST_USER_ID, { name: 'New' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete space', async () => {
			const space = createMockSpace();
			mockDb.where.mockResolvedValueOnce([space]); // findByIdOrThrow

			await service.delete(space.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deleting non-existent space', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent', TEST_USER_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe('incrementDocCounter', () => {
		it('should increment text doc counter', async () => {
			const space = createMockSpace({ prefix: 'A', textDocCounter: 3 });
			mockDb.where.mockResolvedValueOnce([space]);

			const result = await service.incrementDocCounter(space.id, 'text');

			expect(result.counter).toBe(4);
			expect(result.prefix).toBe('A');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should increment context doc counter', async () => {
			const space = createMockSpace({ prefix: 'B', contextDocCounter: 1 });
			mockDb.where.mockResolvedValueOnce([space]);

			const result = await service.incrementDocCounter(space.id, 'context');

			expect(result.counter).toBe(2);
			expect(result.prefix).toBe('B');
		});

		it('should increment prompt doc counter', async () => {
			const space = createMockSpace({ prefix: 'C', promptDocCounter: 0 });
			mockDb.where.mockResolvedValueOnce([space]);

			const result = await service.incrementDocCounter(space.id, 'prompt');

			expect(result.counter).toBe(1);
		});

		it('should return 0 and null prefix when space not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.incrementDocCounter('non-existent', 'text');

			expect(result.counter).toBe(0);
			expect(result.prefix).toBeNull();
		});
	});
});
