import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventTagService } from './event-tag.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { TEST_USER_ID } from '../__tests__/utils/mock-factories';
import { v4 as uuidv4 } from 'uuid';

function createMockEventTag(overrides: Record<string, unknown> = {}) {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		name: 'Test Tag',
		color: '#3B82F6',
		groupId: null,
		sortOrder: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('EventTagService', () => {
	let service: EventTagService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			innerJoin: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventTagService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<EventTagService>(EventTagService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should return all tags for a user', async () => {
			const tags = [createMockEventTag({ name: 'Work' }), createMockEventTag({ name: 'Personal' })];
			mockDb.where.mockResolvedValueOnce(tags);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(tags);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should create default tags when user has no tags', async () => {
			const defaultTags = [
				createMockEventTag({ name: 'Arbeit', color: '#3b82f6' }),
				createMockEventTag({ name: 'Persönlich', color: '#22c55e' }),
				createMockEventTag({ name: 'Familie', color: '#ec4899' }),
				createMockEventTag({ name: 'Wichtig', color: '#ef4444' }),
			];
			// First call returns empty (no tags yet)
			mockDb.where.mockResolvedValueOnce([]);
			// createDefaultTags calls insert().values().returning()
			mockDb.returning.mockResolvedValueOnce(defaultTags);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(defaultTags);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return tag when found', async () => {
			const tag = createMockEventTag();
			mockDb.where.mockResolvedValueOnce([tag]);

			const result = await service.findById(tag.id, TEST_USER_ID);

			expect(result).toEqual(tag);
		});

		it('should return null when tag not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should create a new tag', async () => {
			const newTag = createMockEventTag({ name: 'New Tag', color: '#FF0000' });
			mockDb.returning.mockResolvedValueOnce([newTag]);

			const result = await service.create({
				userId: TEST_USER_ID,
				name: 'New Tag',
				color: '#FF0000',
			});

			expect(result).toEqual(newTag);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a tag', async () => {
			const updatedTag = createMockEventTag({ name: 'Updated Tag' });
			mockDb.returning.mockResolvedValueOnce([updatedTag]);

			const result = await service.update(updatedTag.id, TEST_USER_ID, {
				name: 'Updated Tag',
			});

			expect(result.name).toBe('Updated Tag');
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when tag not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete a tag', async () => {
			const tag = createMockEventTag();

			await service.delete(tag.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getTagsForEvent', () => {
		it('should return tags for an event', async () => {
			const tag1 = createMockEventTag({ name: 'Tag 1' });
			const tag2 = createMockEventTag({ name: 'Tag 2' });
			mockDb.where.mockResolvedValueOnce([{ tag: tag1 }, { tag: tag2 }]);

			const result = await service.getTagsForEvent('event-id');

			expect(result).toEqual([tag1, tag2]);
		});

		it('should return empty array when event has no tags', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getTagsForEvent('event-id');

			expect(result).toEqual([]);
		});
	});

	describe('getTagsForEvents', () => {
		it('should return empty map for empty eventIds', async () => {
			const result = await service.getTagsForEvents([]);

			expect(result).toEqual(new Map());
			expect(mockDb.select).not.toHaveBeenCalled();
		});

		it('should return tags grouped by event id', async () => {
			const tag1 = createMockEventTag({ name: 'Tag 1' });
			const tag2 = createMockEventTag({ name: 'Tag 2' });
			mockDb.where.mockResolvedValueOnce([
				{ eventId: 'event-1', tag: tag1 },
				{ eventId: 'event-1', tag: tag2 },
				{ eventId: 'event-2', tag: tag1 },
			]);

			const result = await service.getTagsForEvents(['event-1', 'event-2']);

			expect(result.get('event-1')).toEqual([tag1, tag2]);
			expect(result.get('event-2')).toEqual([tag1]);
		});
	});

	describe('getTagIdsForEvent', () => {
		it('should return tag ids for an event', async () => {
			const tagId1 = uuidv4();
			const tagId2 = uuidv4();
			mockDb.where.mockResolvedValueOnce([{ tagId: tagId1 }, { tagId: tagId2 }]);

			const result = await service.getTagIdsForEvent('event-id');

			expect(result).toEqual([tagId1, tagId2]);
		});
	});

	describe('setEventTags', () => {
		it('should remove existing tags and add new ones', async () => {
			const tagId1 = uuidv4();
			const tagId2 = uuidv4();

			await service.setEventTags('event-id', [tagId1, tagId2]);

			// Should delete existing tags first
			expect(mockDb.delete).toHaveBeenCalled();
			// Should insert new tags
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should only remove tags when tagIds is empty', async () => {
			await service.setEventTags('event-id', []);

			expect(mockDb.delete).toHaveBeenCalled();
			// insert should not be called for empty tagIds
			expect(mockDb.insert).not.toHaveBeenCalled();
		});
	});

	describe('addTagToEvent', () => {
		it('should add a tag to an event', async () => {
			await service.addTagToEvent('event-id', 'tag-id');

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith({ eventId: 'event-id', tagId: 'tag-id' });
		});
	});

	describe('removeTagFromEvent', () => {
		it('should remove a tag from an event', async () => {
			await service.removeTagFromEvent('event-id', 'tag-id');

			expect(mockDb.delete).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getTagsByIds', () => {
		it('should return empty array for empty ids', async () => {
			const result = await service.getTagsByIds([], TEST_USER_ID);

			expect(result).toEqual([]);
			expect(mockDb.select).not.toHaveBeenCalled();
		});

		it('should return tags matching ids', async () => {
			const tag1 = createMockEventTag({ name: 'Tag 1' });
			const tag2 = createMockEventTag({ name: 'Tag 2' });
			mockDb.where.mockResolvedValueOnce([tag1, tag2]);

			const result = await service.getTagsByIds([tag1.id, tag2.id], TEST_USER_ID);

			expect(result).toEqual([tag1, tag2]);
		});
	});

	describe('findByGroupId', () => {
		it('should return tags for a specific group', async () => {
			const groupId = uuidv4();
			const tags = [
				createMockEventTag({ name: 'Tag 1', groupId }),
				createMockEventTag({ name: 'Tag 2', groupId }),
			];
			mockDb.orderBy.mockResolvedValueOnce(tags);

			const result = await service.findByGroupId(groupId, TEST_USER_ID);

			expect(result).toEqual(tags);
		});

		it('should return ungrouped tags when groupId is null', async () => {
			const tags = [createMockEventTag({ name: 'Ungrouped', groupId: null })];
			mockDb.orderBy.mockResolvedValueOnce(tags);

			const result = await service.findByGroupId(null, TEST_USER_ID);

			expect(result).toEqual(tags);
		});
	});

	describe('updateTagGroup', () => {
		it('should update the group of a tag', async () => {
			const groupId = uuidv4();
			const updatedTag = createMockEventTag({ groupId });
			mockDb.returning.mockResolvedValueOnce([updatedTag]);

			const result = await service.updateTagGroup(updatedTag.id, TEST_USER_ID, groupId);

			expect(result.groupId).toBe(groupId);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when tag not found', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(service.updateTagGroup('non-existent-id', TEST_USER_ID, null)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
