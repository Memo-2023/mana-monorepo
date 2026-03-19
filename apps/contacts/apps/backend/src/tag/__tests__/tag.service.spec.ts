import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagService } from '../tag.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('TagService', () => {
	let service: TagService;
	let mockDb: any;

	const mockTag = {
		id: 'tag-1',
		userId: 'user-1',
		name: 'Familie',
		color: '#ec4899',
		createdAt: new Date('2025-01-01'),
	};

	const mockTag2 = {
		id: 'tag-2',
		userId: 'user-1',
		name: 'Freunde',
		color: '#22c55e',
		createdAt: new Date('2025-01-01'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TagService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<TagService>(TagService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should return existing tags when user has tags', async () => {
			mockDb.where.mockResolvedValue([mockTag, mockTag2]);

			const result = await service.findByUserId('user-1');

			expect(result).toEqual([mockTag, mockTag2]);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should create default tags when user has no tags', async () => {
			const defaultTags = [
				{ id: 'tag-a', userId: 'user-1', name: 'Familie', color: '#ec4899' },
				{ id: 'tag-b', userId: 'user-1', name: 'Freunde', color: '#22c55e' },
				{ id: 'tag-c', userId: 'user-1', name: 'Arbeit', color: '#3b82f6' },
				{ id: 'tag-d', userId: 'user-1', name: 'Wichtig', color: '#ef4444' },
			];
			// First call: findByUserId returns empty
			mockDb.where.mockResolvedValue([]);
			// Second call: createDefaultTags inserts and returns
			mockDb.returning.mockResolvedValue(defaultTags);

			const result = await service.findByUserId('user-1');

			expect(result).toEqual(defaultTags);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return a tag when found', async () => {
			mockDb.where.mockResolvedValue([mockTag]);

			const result = await service.findById('tag-1', 'user-1');

			expect(result).toEqual(mockTag);
		});

		it('should return null when tag is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findById('nonexistent', 'user-1');

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should insert and return a new tag', async () => {
			mockDb.returning.mockResolvedValue([mockTag]);

			const newTag = {
				userId: 'user-1',
				name: 'Familie',
				color: '#ec4899',
			};

			const result = await service.create(newTag as any);

			expect(result).toEqual(mockTag);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(newTag);
		});
	});

	describe('update', () => {
		it('should update and return the tag', async () => {
			const updatedTag = { ...mockTag, name: 'Updated Name' };
			mockDb.returning.mockResolvedValue([updatedTag]);

			const result = await service.update('tag-1', 'user-1', { name: 'Updated Name' });

			expect(result).toEqual(updatedTag);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when tag is not found', async () => {
			mockDb.returning.mockResolvedValue([]);

			await expect(service.update('nonexistent', 'user-1', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a tag successfully', async () => {
			mockDb.where.mockResolvedValue(undefined);

			await expect(service.delete('tag-1', 'user-1')).resolves.toBeUndefined();
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('addTagToContact', () => {
		it('should add a tag to a contact', async () => {
			mockDb.values.mockReturnValue({ onConflictDoNothing: mockDb.onConflictDoNothing });

			await expect(service.addTagToContact('contact-1', 'tag-1')).resolves.toBeUndefined();
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('removeTagFromContact', () => {
		it('should remove a tag from a contact', async () => {
			mockDb.where.mockResolvedValue(undefined);

			await expect(service.removeTagFromContact('contact-1', 'tag-1')).resolves.toBeUndefined();
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('getTagsForContact', () => {
		it('should return tag IDs for a contact', async () => {
			mockDb.where.mockResolvedValue([{ tagId: 'tag-1' }, { tagId: 'tag-2' }]);

			const result = await service.getTagsForContact('contact-1');

			expect(result).toEqual(['tag-1', 'tag-2']);
		});

		it('should return empty array when contact has no tags', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.getTagsForContact('contact-1');

			expect(result).toEqual([]);
		});
	});
});
