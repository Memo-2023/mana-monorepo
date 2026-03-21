import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import { TrashService } from './trash.service';
import { StorageService } from '../storage/storage.service';
import {
	createMockDb,
	mockFileFactory,
	mockFolderFactory,
} from '../__tests__/utils/mock-factories';

describe('TrashService', () => {
	let service: TrashService;
	let mockDb: ReturnType<typeof createMockDb>;
	let mockStorageService: Record<string, jest.Mock>;

	beforeEach(async () => {
		mockDb = createMockDb();
		mockStorageService = {
			uploadFile: jest.fn(),
			downloadFile: jest.fn(),
			deleteFile: jest.fn(),
			deleteFiles: jest.fn(),
			getDownloadUrl: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TrashService,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: StorageService, useValue: mockStorageService },
			],
		}).compile();

		service = module.get<TrashService>(TrashService);
	});

	describe('findAll', () => {
		it('should return trashed files and folders', async () => {
			const trashedFiles = mockFileFactory.createMany(2, { isDeleted: true });
			const trashedFolders = mockFolderFactory.createMany(1, { isDeleted: true });

			// First where call: trashed files
			mockDb.where.mockResolvedValueOnce(trashedFiles);
			// Second where call: trashed folders
			mockDb.where.mockResolvedValueOnce(trashedFolders);

			const result = await service.findAll('test-user-id');

			expect(result.files).toEqual(trashedFiles);
			expect(result.folders).toEqual(trashedFolders);
			expect(result.files).toHaveLength(2);
			expect(result.folders).toHaveLength(1);
		});

		it('should return empty arrays when trash is empty', async () => {
			mockDb.where.mockResolvedValueOnce([]);
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll('test-user-id');

			expect(result.files).toEqual([]);
			expect(result.folders).toEqual([]);
		});
	});

	describe('restoreFile', () => {
		it('should restore a trashed file', async () => {
			const file = mockFileFactory.create({ isDeleted: false, deletedAt: null });
			mockDb.returning.mockResolvedValueOnce([file]);

			const result = await service.restoreFile('test-user-id', file.id);

			expect(result).toEqual(file);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					isDeleted: false,
					deletedAt: null,
				})
			);
		});

		it('should throw NotFoundException when file is not in trash', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(service.restoreFile('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('restoreFolder', () => {
		it('should restore a trashed folder', async () => {
			const folder = mockFolderFactory.create({ isDeleted: false, deletedAt: null });
			mockDb.returning.mockResolvedValueOnce([folder]);

			const result = await service.restoreFolder('test-user-id', folder.id);

			expect(result).toEqual(folder);
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					isDeleted: false,
					deletedAt: null,
				})
			);
		});

		it('should throw NotFoundException when folder is not in trash', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			await expect(service.restoreFolder('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('permanentlyDeleteFile', () => {
		it('should delete file from S3 and database', async () => {
			const file = mockFileFactory.create({ isDeleted: true });
			// select query to find the file
			mockDb.where.mockResolvedValueOnce([file]);
			// deleteFile from S3
			mockStorageService.deleteFile.mockResolvedValueOnce(undefined);
			// delete from DB
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.permanentlyDeleteFile('test-user-id', file.id);

			expect(mockStorageService.deleteFile).toHaveBeenCalledWith(file.storageKey);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when file is not in trash', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.permanentlyDeleteFile('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('permanentlyDeleteFolder', () => {
		it('should delete folder from database', async () => {
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.permanentlyDeleteFolder('test-user-id', 'folder-id');

			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('emptyTrash', () => {
		it('should delete all trashed files from S3 and database', async () => {
			const trashedFiles = mockFileFactory.createMany(3, { isDeleted: true });
			// select trashed files
			mockDb.where.mockResolvedValueOnce(trashedFiles);
			// deleteFile calls for each file
			mockStorageService.deleteFile.mockResolvedValue(undefined);
			// delete files from DB
			mockDb.where.mockResolvedValueOnce(undefined);
			// delete folders from DB
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.emptyTrash('test-user-id');

			expect(mockStorageService.deleteFile).toHaveBeenCalledTimes(3);
			for (const file of trashedFiles) {
				expect(mockStorageService.deleteFile).toHaveBeenCalledWith(file.storageKey);
			}
		});

		it('should handle empty trash gracefully', async () => {
			mockDb.where.mockResolvedValueOnce([]);
			mockDb.where.mockResolvedValueOnce(undefined);
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.emptyTrash('test-user-id');

			expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
		});
	});
});
