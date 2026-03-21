import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import { TagService } from './tag.service';
import { createMockDb, mockTagFactory } from '../__tests__/utils/mock-factories';

describe('TagService', () => {
	let service: TagService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TagService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<TagService>(TagService);
	});

	describe('findAll', () => {
		it('should return all tags for user', async () => {
			const userTags = [
				mockTagFactory.create({ name: 'Work' }),
				mockTagFactory.create({ name: 'Personal' }),
				mockTagFactory.create({ name: 'Important' }),
			];
			mockDb.where.mockResolvedValueOnce(userTags);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual(userTags);
			expect(result).toHaveLength(3);
		});

		it('should return empty array when user has no tags', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual([]);
		});
	});

	describe('create', () => {
		it('should create a tag with name and default color', async () => {
			const tag = mockTagFactory.create({ name: 'Work' });
			mockDb.returning.mockResolvedValueOnce([tag]);

			const result = await service.create('test-user-id', 'Work');

			expect(result.name).toBe('Work');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should create a tag with custom color', async () => {
			const tag = mockTagFactory.create({ name: 'Urgent', color: '#ef4444' });
			mockDb.returning.mockResolvedValueOnce([tag]);

			const result = await service.create('test-user-id', 'Urgent', '#ef4444');

			expect(result.name).toBe('Urgent');
			expect(result.color).toBe('#ef4444');
		});
	});

	describe('update', () => {
		it('should update tag name', async () => {
			const updated = mockTagFactory.create({ name: 'Updated Tag' });
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update('test-user-id', updated.id, { name: 'Updated Tag' });

			expect(result.name).toBe('Updated Tag');
		});

		it('should update tag color', async () => {
			const updated = mockTagFactory.create({ color: '#22c55e' });
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update('test-user-id', updated.id, { color: '#22c55e' });

			expect(result.color).toBe('#22c55e');
		});

		it('should throw NotFoundException when tag does not exist', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(
				service.update('test-user-id', 'nonexistent', { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});

		it('should update both name and color', async () => {
			const updated = mockTagFactory.create({ name: 'New Name', color: '#a855f7' });
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update('test-user-id', updated.id, {
				name: 'New Name',
				color: '#a855f7',
			});

			expect(result.name).toBe('New Name');
			expect(result.color).toBe('#a855f7');
		});
	});

	describe('delete', () => {
		it('should delete a tag', async () => {
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete('test-user-id', 'tag-id');

			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('addTagToFile', () => {
		it('should add a tag to a file', async () => {
			mockDb.onConflictDoNothing.mockResolvedValueOnce(undefined);

			await service.addTagToFile('file-id', 'tag-id');

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith({ fileId: 'file-id', tagId: 'tag-id' });
			expect(mockDb.onConflictDoNothing).toHaveBeenCalled();
		});

		it('should not throw when tag is already on file (onConflictDoNothing)', async () => {
			mockDb.onConflictDoNothing.mockResolvedValueOnce(undefined);

			await expect(service.addTagToFile('file-id', 'tag-id')).resolves.not.toThrow();
		});
	});

	describe('removeTagFromFile', () => {
		it('should remove a tag from a file', async () => {
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.removeTagFromFile('file-id', 'tag-id');

			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('getFileTags', () => {
		it('should return tags for a file', async () => {
			const fileTags = [
				{ tag: mockTagFactory.create({ name: 'Work' }) },
				{ tag: mockTagFactory.create({ name: 'Important' }) },
			];
			mockDb.where.mockResolvedValueOnce(fileTags);

			const result = await service.getFileTags('file-id');

			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('Work');
			expect(result[1].name).toBe('Important');
		});

		it('should return empty array when file has no tags', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getFileTags('file-id');

			expect(result).toEqual([]);
		});
	});
});
