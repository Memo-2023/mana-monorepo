import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';
import { mockFileFactory, mockFolderFactory } from '../__tests__/utils/mock-factories';

describe('TrashController', () => {
	let controller: TrashController;
	let trashService: jest.Mocked<TrashService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockTrashService = {
			findAll: jest.fn(),
			restoreFile: jest.fn(),
			restoreFolder: jest.fn(),
			permanentlyDeleteFile: jest.fn(),
			permanentlyDeleteFolder: jest.fn(),
			emptyTrash: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [TrashController],
			providers: [{ provide: TrashService, useValue: mockTrashService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<TrashController>(TrashController);
		trashService = module.get(TrashService);
	});

	describe('findAll', () => {
		it('should return all trashed items for user', async () => {
			const trashedItems = {
				files: mockFileFactory.createMany(2, { isDeleted: true }),
				folders: mockFolderFactory.createMany(1, { isDeleted: true }),
			};
			trashService.findAll.mockResolvedValue(trashedItems as any);

			const result = await controller.findAll(mockUser);

			expect(trashService.findAll).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual(trashedItems);
		});
	});

	describe('restore', () => {
		it('should call restoreFile when type is file', async () => {
			const restoredFile = mockFileFactory.create({ isDeleted: false });
			trashService.restoreFile.mockResolvedValue(restoredFile as any);

			const result = await controller.restore(mockUser, 'file-123', 'file');

			expect(trashService.restoreFile).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(trashService.restoreFolder).not.toHaveBeenCalled();
			expect(result).toEqual(restoredFile);
		});

		it('should call restoreFolder when type is folder', async () => {
			const restoredFolder = mockFolderFactory.create({ isDeleted: false });
			trashService.restoreFolder.mockResolvedValue(restoredFolder as any);

			const result = await controller.restore(mockUser, 'folder-123', 'folder');

			expect(trashService.restoreFolder).toHaveBeenCalledWith('test-user-id', 'folder-123');
			expect(trashService.restoreFile).not.toHaveBeenCalled();
			expect(result).toEqual(restoredFolder);
		});
	});

	describe('permanentlyDelete', () => {
		it('should permanently delete a file and return success', async () => {
			trashService.permanentlyDeleteFile.mockResolvedValue(undefined);

			const result = await controller.permanentlyDelete(mockUser, 'file-123', 'file');

			expect(trashService.permanentlyDeleteFile).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(trashService.permanentlyDeleteFolder).not.toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it('should permanently delete a folder and return success', async () => {
			trashService.permanentlyDeleteFolder.mockResolvedValue(undefined);

			const result = await controller.permanentlyDelete(mockUser, 'folder-123', 'folder');

			expect(trashService.permanentlyDeleteFolder).toHaveBeenCalledWith(
				'test-user-id',
				'folder-123'
			);
			expect(trashService.permanentlyDeleteFile).not.toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});
	});

	describe('emptyTrash', () => {
		it('should empty all trash and return success', async () => {
			trashService.emptyTrash.mockResolvedValue(undefined);

			const result = await controller.emptyTrash(mockUser);

			expect(trashService.emptyTrash).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual({ success: true });
		});
	});
});
