import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventTagGroupService } from './event-tag-group.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { TEST_USER_ID } from '../__tests__/utils/mock-factories';
import { v4 as uuidv4 } from 'uuid';

function createMockEventTagGroup(overrides: Record<string, unknown> = {}) {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		name: 'Test Group',
		color: '#3B82F6',
		sortOrder: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('EventTagGroupService', () => {
	let service: EventTagGroupService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventTagGroupService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<EventTagGroupService>(EventTagGroupService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should return all groups for a user ordered by sortOrder', async () => {
			const groups = [
				createMockEventTagGroup({ name: 'Group 1', sortOrder: 0 }),
				createMockEventTagGroup({ name: 'Group 2', sortOrder: 1 }),
			];
			mockDb.orderBy.mockResolvedValueOnce(groups);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(groups);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it('should create default groups when user has no groups', async () => {
			const defaultGroups = [
				createMockEventTagGroup({ name: 'Personen', color: '#ec4899', sortOrder: 0 }),
				createMockEventTagGroup({ name: 'Orte', color: '#14b8a6', sortOrder: 1 }),
				createMockEventTagGroup({ name: 'Allgemein', color: '#3b82f6', sortOrder: 2 }),
			];
			// First call returns empty (no groups yet)
			mockDb.orderBy.mockResolvedValueOnce([]);
			// createDefaultGroups calls insert().values().returning()
			mockDb.returning.mockResolvedValueOnce(defaultGroups);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(defaultGroups);
			expect(result).toHaveLength(3);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return group when found', async () => {
			const group = createMockEventTagGroup();
			mockDb.where.mockResolvedValueOnce([group]);

			const result = await service.findById(group.id, TEST_USER_ID);

			expect(result).toEqual(group);
		});

		it('should return null when group not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should create a new group with correct sortOrder', async () => {
			const existingGroups = [
				createMockEventTagGroup({ sortOrder: 0 }),
				createMockEventTagGroup({ sortOrder: 1 }),
			];
			const newGroup = createMockEventTagGroup({ name: 'New Group', sortOrder: 2 });

			// First call: get existing groups to determine sortOrder
			mockDb.where.mockResolvedValueOnce(existingGroups);
			// Second call: insert returning
			mockDb.returning.mockResolvedValueOnce([newGroup]);

			const result = await service.create({
				userId: TEST_USER_ID,
				name: 'New Group',
				color: '#FF0000',
			});

			expect(result).toEqual(newGroup);
			expect(result.sortOrder).toBe(2);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should start with sortOrder 0 when no groups exist', async () => {
			const newGroup = createMockEventTagGroup({ name: 'First Group', sortOrder: 0 });

			// No existing groups
			mockDb.where.mockResolvedValueOnce([]);
			mockDb.returning.mockResolvedValueOnce([newGroup]);

			const result = await service.create({
				userId: TEST_USER_ID,
				name: 'First Group',
				color: '#FF0000',
			});

			expect(result).toEqual(newGroup);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a group', async () => {
			const updatedGroup = createMockEventTagGroup({ name: 'Updated Group' });
			mockDb.returning.mockResolvedValueOnce([updatedGroup]);

			const result = await service.update(updatedGroup.id, TEST_USER_ID, {
				name: 'Updated Group',
			});

			expect(result.name).toBe('Updated Group');
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when group not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should unassign tags and delete the group', async () => {
			const groupId = uuidv4();

			await service.delete(groupId, TEST_USER_ID);

			// Should update tags to unassign from group first
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith({ groupId: null });
			// Should then delete the group
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('getTagCountByGroup', () => {
		it('should return count of tags in a group', async () => {
			const groupId = uuidv4();
			const tags = [
				{ id: uuidv4(), groupId },
				{ id: uuidv4(), groupId },
				{ id: uuidv4(), groupId },
			];
			mockDb.where.mockResolvedValueOnce(tags);

			const result = await service.getTagCountByGroup(groupId);

			expect(result).toBe(3);
		});

		it('should return 0 when group has no tags', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getTagCountByGroup(uuidv4());

			expect(result).toBe(0);
		});
	});

	describe('getTagCountsForUser', () => {
		it('should return tag counts grouped by groupId', async () => {
			const groupId1 = uuidv4();
			const groupId2 = uuidv4();
			const tags = [
				{ id: uuidv4(), groupId: groupId1 },
				{ id: uuidv4(), groupId: groupId1 },
				{ id: uuidv4(), groupId: groupId2 },
				{ id: uuidv4(), groupId: null },
			];
			mockDb.where.mockResolvedValueOnce(tags);

			const result = await service.getTagCountsForUser(TEST_USER_ID);

			expect(result.get(groupId1)).toBe(2);
			expect(result.get(groupId2)).toBe(1);
			expect(result.get(null)).toBe(1);
		});

		it('should return empty map when user has no tags', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getTagCountsForUser(TEST_USER_ID);

			expect(result.size).toBe(0);
		});
	});

	describe('reorder', () => {
		it('should update sortOrder for each group and return updated list', async () => {
			const groupId1 = uuidv4();
			const groupId2 = uuidv4();
			const groupId3 = uuidv4();

			const reorderedGroups = [
				createMockEventTagGroup({ id: groupId2, sortOrder: 0 }),
				createMockEventTagGroup({ id: groupId3, sortOrder: 1 }),
				createMockEventTagGroup({ id: groupId1, sortOrder: 2 }),
			];

			// The reorder method calls findByUserId at the end, which calls orderBy
			mockDb.orderBy.mockResolvedValueOnce(reorderedGroups);

			const result = await service.reorder(TEST_USER_ID, [groupId2, groupId3, groupId1]);

			expect(result).toEqual(reorderedGroups);
			// Should have called update for each group
			expect(mockDb.update).toHaveBeenCalledTimes(3);
			expect(mockDb.set).toHaveBeenCalledTimes(3);
		});

		it('should handle empty groupIds array', async () => {
			const groups = [createMockEventTagGroup()];
			// findByUserId is called at the end
			mockDb.orderBy.mockResolvedValueOnce(groups);

			const result = await service.reorder(TEST_USER_ID, []);

			expect(result).toEqual(groups);
			// No update calls for empty array
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});
});
