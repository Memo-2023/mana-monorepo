import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { mockFolderFactory } from '../__tests__/utils/mock-factories';

describe('FolderController', () => {
	let controller: FolderController;
	let folderService: jest.Mocked<FolderService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockFolderService = {
			findAll: jest.fn(),
			findOne: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			move: jest.fn(),
			delete: jest.fn(),
			toggleFavorite: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [FolderController],
			providers: [{ provide: FolderService, useValue: mockFolderService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<FolderController>(FolderController);
		folderService = module.get(FolderService);
	});

	describe('findAll', () => {
		it('should return root folders when no parentFolderId given', async () => {
			const folders = mockFolderFactory.createMany(3);
			folderService.findAll.mockResolvedValue(folders);

			const result = await controller.findAll(mockUser);

			expect(folderService.findAll).toHaveBeenCalledWith('test-user-id', undefined);
			expect(result).toEqual(folders);
		});

		it('should return child folders when parentFolderId is given', async () => {
			const parentId = 'parent-folder-id';
			const folders = mockFolderFactory.createMany(2, { parentFolderId: parentId });
			folderService.findAll.mockResolvedValue(folders);

			const result = await controller.findAll(mockUser, parentId);

			expect(folderService.findAll).toHaveBeenCalledWith('test-user-id', parentId);
			expect(result).toEqual(folders);
		});
	});

	describe('findOne', () => {
		it('should return a single folder by id', async () => {
			const folder = mockFolderFactory.create({ id: 'folder-123' });
			folderService.findOne.mockResolvedValue(folder);

			const result = await controller.findOne(mockUser, 'folder-123');

			expect(folderService.findOne).toHaveBeenCalledWith('test-user-id', 'folder-123');
			expect(result).toEqual(folder);
		});
	});

	describe('create', () => {
		it('should create a folder and return it', async () => {
			const dto = { name: 'New Folder', parentFolderId: 'parent-id', color: '#ff0000' };
			const created = mockFolderFactory.create({
				name: 'New Folder',
				parentFolderId: 'parent-id',
				color: '#ff0000',
			});
			folderService.create.mockResolvedValue(created);

			const result = await controller.create(mockUser, dto);

			expect(folderService.create).toHaveBeenCalledWith('test-user-id', dto);
			expect(result).toEqual(created);
		});

		it('should create a root folder without parentFolderId', async () => {
			const dto = { name: 'Root Folder' };
			const created = mockFolderFactory.create({ name: 'Root Folder' });
			folderService.create.mockResolvedValue(created);

			const result = await controller.create(mockUser, dto);

			expect(folderService.create).toHaveBeenCalledWith('test-user-id', dto);
			expect(result).toEqual(created);
		});
	});

	describe('update', () => {
		it('should update a folder and return the result', async () => {
			const dto = { name: 'Renamed Folder', color: '#00ff00' };
			const updated = mockFolderFactory.create({
				name: 'Renamed Folder',
				color: '#00ff00',
			});
			folderService.update.mockResolvedValue(updated);

			const result = await controller.update(mockUser, 'folder-123', dto);

			expect(folderService.update).toHaveBeenCalledWith('test-user-id', 'folder-123', dto);
			expect(result).toEqual(updated);
		});
	});

	describe('move', () => {
		it('should move a folder to a new parent', async () => {
			const dto = { parentFolderId: 'new-parent-id' };
			const moved = mockFolderFactory.create({ parentFolderId: 'new-parent-id' });
			folderService.move.mockResolvedValue(moved);

			const result = await controller.move(mockUser, 'folder-123', dto);

			expect(folderService.move).toHaveBeenCalledWith('test-user-id', 'folder-123', dto);
			expect(result).toEqual(moved);
		});
	});

	describe('delete', () => {
		it('should delete a folder and return success', async () => {
			folderService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'folder-123');

			expect(folderService.delete).toHaveBeenCalledWith('test-user-id', 'folder-123');
			expect(result).toEqual({ success: true });
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle favorite and return the folder', async () => {
			const folder = mockFolderFactory.create({ isFavorite: true });
			folderService.toggleFavorite.mockResolvedValue(folder);

			const result = await controller.toggleFavorite(mockUser, 'folder-123');

			expect(folderService.toggleFavorite).toHaveBeenCalledWith('test-user-id', 'folder-123');
			expect(result).toEqual(folder);
		});
	});
});
