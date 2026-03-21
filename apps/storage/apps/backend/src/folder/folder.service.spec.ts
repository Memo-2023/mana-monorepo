import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import { FolderService } from './folder.service';
import { createMockDb, mockFolderFactory } from '../__tests__/utils/mock-factories';

describe('FolderService', () => {
	let service: FolderService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [FolderService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<FolderService>(FolderService);
	});

	describe('findAll', () => {
		it('should return root folders when no parentFolderId is provided', async () => {
			const rootFolders = mockFolderFactory.createMany(3);
			mockDb.where.mockResolvedValueOnce(rootFolders);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual(rootFolders);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
		});

		it('should return child folders when parentFolderId is provided', async () => {
			const parentId = 'parent-folder-id';
			const childFolders = mockFolderFactory.createMany(2, { parentFolderId: parentId });
			mockDb.where.mockResolvedValueOnce(childFolders);

			const result = await service.findAll('test-user-id', parentId);

			expect(result).toEqual(childFolders);
			expect(result.every((f) => f.parentFolderId === parentId)).toBe(true);
		});

		it('should return empty array when no folders exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return a folder by id', async () => {
			const folder = mockFolderFactory.create();
			mockDb.where.mockResolvedValueOnce([folder]);

			const result = await service.findOne('test-user-id', folder.id);

			expect(result).toEqual(folder);
		});

		it('should throw NotFoundException when folder does not exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findOne('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a root folder with correct path and depth', async () => {
			const created = mockFolderFactory.create({ name: 'Documents', path: '/Documents', depth: 0 });
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', { name: 'Documents' });

			expect(result.name).toBe('Documents');
			expect(result.path).toBe('/Documents');
			expect(result.depth).toBe(0);
		});

		it('should create a nested folder with correct path and depth', async () => {
			const parentFolder = mockFolderFactory.create({
				name: 'Documents',
				path: '/Documents',
				depth: 0,
			});
			// findOne for parent
			mockDb.where.mockResolvedValueOnce([parentFolder]);

			const childFolder = mockFolderFactory.create({
				name: 'Work',
				path: '/Documents/Work',
				depth: 1,
				parentFolderId: parentFolder.id,
			});
			mockDb.returning.mockResolvedValueOnce([childFolder]);

			const result = await service.create('test-user-id', {
				name: 'Work',
				parentFolderId: parentFolder.id,
			});

			expect(result.path).toBe('/Documents/Work');
			expect(result.depth).toBe(1);
			expect(result.parentFolderId).toBe(parentFolder.id);
		});

		it('should throw NotFoundException when parent folder does not exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.create('test-user-id', { name: 'Child', parentFolderId: 'nonexistent' })
			).rejects.toThrow(NotFoundException);
		});

		it('should set optional color and description', async () => {
			const created = mockFolderFactory.create({
				name: 'Projects',
				color: '#ff0000',
				description: 'My projects',
			});
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', {
				name: 'Projects',
				color: '#ff0000',
				description: 'My projects',
			});

			expect(result.color).toBe('#ff0000');
			expect(result.description).toBe('My projects');
		});
	});

	describe('update', () => {
		it('should update folder properties', async () => {
			const folder = mockFolderFactory.create();
			mockDb.where.mockResolvedValueOnce([folder]);

			const updated = { ...folder, name: 'Renamed Folder' };
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update('test-user-id', folder.id, { name: 'Renamed Folder' });

			expect(result.name).toBe('Renamed Folder');
		});

		it('should throw NotFoundException when updating nonexistent folder', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('test-user-id', 'nonexistent', { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('move', () => {
		it('should move folder to a new parent and update path/depth', async () => {
			const folder = mockFolderFactory.create({ name: 'Work', path: '/Work', depth: 0 });
			// findOne for the folder being moved
			mockDb.where.mockResolvedValueOnce([folder]);

			const newParent = mockFolderFactory.create({
				name: 'Documents',
				path: '/Documents',
				depth: 0,
			});
			// findOne for the new parent
			mockDb.where.mockResolvedValueOnce([newParent]);

			const movedFolder = {
				...folder,
				parentFolderId: newParent.id,
				path: '/Documents/Work',
				depth: 1,
			};
			mockDb.returning.mockResolvedValueOnce([movedFolder]);

			const result = await service.move('test-user-id', folder.id, {
				parentFolderId: newParent.id,
			});

			expect(result.path).toBe('/Documents/Work');
			expect(result.depth).toBe(1);
			expect(result.parentFolderId).toBe(newParent.id);
		});

		it('should move folder to root when parentFolderId is empty', async () => {
			const folder = mockFolderFactory.create({
				name: 'Work',
				path: '/Documents/Work',
				depth: 1,
				parentFolderId: 'some-parent',
			});
			mockDb.where.mockResolvedValueOnce([folder]);

			const movedFolder = { ...folder, parentFolderId: null, path: '/Work', depth: 0 };
			mockDb.returning.mockResolvedValueOnce([movedFolder]);

			const result = await service.move('test-user-id', folder.id, { parentFolderId: '' });

			expect(result.path).toBe('/Work');
			expect(result.depth).toBe(0);
			expect(result.parentFolderId).toBeNull();
		});
	});

	describe('delete', () => {
		it('should soft delete a folder', async () => {
			const folder = mockFolderFactory.create();
			mockDb.where.mockResolvedValueOnce([folder]);
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete('test-user-id', folder.id);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					isDeleted: true,
					deletedAt: expect.any(Date),
				})
			);
		});

		it('should throw NotFoundException when deleting nonexistent folder', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle isFavorite from false to true', async () => {
			const folder = mockFolderFactory.create({ isFavorite: false });
			mockDb.where.mockResolvedValueOnce([folder]);

			const toggled = { ...folder, isFavorite: true };
			mockDb.returning.mockResolvedValueOnce([toggled]);

			const result = await service.toggleFavorite('test-user-id', folder.id);

			expect(result.isFavorite).toBe(true);
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
		});

		it('should toggle isFavorite from true to false', async () => {
			const folder = mockFolderFactory.create({ isFavorite: true });
			mockDb.where.mockResolvedValueOnce([folder]);

			const toggled = { ...folder, isFavorite: false };
			mockDb.returning.mockResolvedValueOnce([toggled]);

			const result = await service.toggleFavorite('test-user-id', folder.id);

			expect(result.isFavorite).toBe(false);
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: false }));
		});
	});
});
