import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import { FileService } from './file.service';
import { StorageService } from '../storage/storage.service';
import { createMockDb, mockFileFactory } from '../__tests__/utils/mock-factories';

describe('FileService', () => {
	let service: FileService;
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
				FileService,
				{ provide: DATABASE_CONNECTION, useValue: mockDb },
				{ provide: StorageService, useValue: mockStorageService },
			],
		}).compile();

		service = module.get<FileService>(FileService);
	});

	describe('findAll', () => {
		it('should return root files when no parentFolderId is provided', async () => {
			const rootFiles = mockFileFactory.createMany(3);
			mockDb.where.mockResolvedValueOnce(rootFiles);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual(rootFiles);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return files in a specific folder', async () => {
			const folderId = 'folder-123';
			const folderFiles = mockFileFactory.createMany(2, { parentFolderId: folderId });
			mockDb.where.mockResolvedValueOnce(folderFiles);

			const result = await service.findAll('test-user-id', folderId);

			expect(result).toEqual(folderFiles);
			expect(result.every((f) => f.parentFolderId === folderId)).toBe(true);
		});

		it('should return empty array when no files exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return a file by id', async () => {
			const file = mockFileFactory.create();
			mockDb.where.mockResolvedValueOnce([file]);

			const result = await service.findOne('test-user-id', file.id);

			expect(result).toEqual(file);
		});

		it('should throw NotFoundException when file does not exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findOne('test-user-id', 'nonexistent-id')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('upload', () => {
		it('should upload file to S3 and create DB record', async () => {
			const multerFile = {
				buffer: Buffer.from('test content'),
				originalname: 'document.pdf',
				mimetype: 'application/pdf',
				size: 12,
			} as Express.Multer.File;

			const uploadResult = {
				storageKey: 'users/test-user-id/abc-document.pdf',
				storagePath: 'users/test-user-id/abc-document.pdf',
			};
			mockStorageService.uploadFile.mockResolvedValueOnce(uploadResult);

			const createdFile = mockFileFactory.create({
				name: 'document.pdf',
				originalName: 'document.pdf',
				storageKey: uploadResult.storageKey,
				storagePath: uploadResult.storagePath,
			});
			// insert().values().returning() for file record
			mockDb.returning.mockResolvedValueOnce([createdFile]);
			// insert().values() for version record (no returning) - default chain return is fine

			const result = await service.upload('test-user-id', multerFile, {});

			expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
				'test-user-id',
				multerFile.buffer,
				'document.pdf',
				'application/pdf'
			);
			expect(result).toEqual(createdFile);
		});

		it('should throw BadRequestException when no file is provided', async () => {
			await expect(service.upload('test-user-id', undefined as any, {})).rejects.toThrow(
				BadRequestException
			);
		});

		it('should set parentFolderId when provided in dto', async () => {
			const multerFile = {
				buffer: Buffer.from('test'),
				originalname: 'file.txt',
				mimetype: 'text/plain',
				size: 4,
			} as Express.Multer.File;

			const uploadResult = {
				storageKey: 'users/test-user-id/abc-file.txt',
				storagePath: 'users/test-user-id/abc-file.txt',
			};
			mockStorageService.uploadFile.mockResolvedValueOnce(uploadResult);

			const createdFile = mockFileFactory.create({ parentFolderId: 'folder-123' });
			// insert().values().returning() for file record
			mockDb.returning.mockResolvedValueOnce([createdFile]);
			// insert().values() for version record (no returning) - default chain return is fine

			const result = await service.upload('test-user-id', multerFile, {
				parentFolderId: 'folder-123',
			});

			expect(result.parentFolderId).toBe('folder-123');
		});
	});

	describe('update', () => {
		it('should update file name', async () => {
			const file = mockFileFactory.create();
			// findOne query
			mockDb.where.mockResolvedValueOnce([file]);

			const updatedFile = { ...file, name: 'renamed-file.pdf' };
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedFile]);

			const result = await service.update('test-user-id', file.id, { name: 'renamed-file.pdf' });

			expect(result.name).toBe('renamed-file.pdf');
		});

		it('should throw NotFoundException when updating nonexistent file', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('test-user-id', 'nonexistent', { name: 'new-name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('move', () => {
		it('should move file to a different folder', async () => {
			const file = mockFileFactory.create();
			mockDb.where.mockResolvedValueOnce([file]);

			const movedFile = { ...file, parentFolderId: 'new-folder-id' };
			mockDb.returning.mockResolvedValueOnce([movedFile]);

			const result = await service.move('test-user-id', file.id, {
				parentFolderId: 'new-folder-id',
			});

			expect(result.parentFolderId).toBe('new-folder-id');
		});

		it('should move file to root when parentFolderId is empty', async () => {
			const file = mockFileFactory.create({ parentFolderId: 'some-folder' });
			mockDb.where.mockResolvedValueOnce([file]);

			const movedFile = { ...file, parentFolderId: null };
			mockDb.returning.mockResolvedValueOnce([movedFile]);

			const result = await service.move('test-user-id', file.id, { parentFolderId: '' });

			expect(result.parentFolderId).toBeNull();
		});
	});

	describe('delete', () => {
		it('should soft delete a file', async () => {
			const file = mockFileFactory.create();
			// findOne query
			mockDb.where.mockResolvedValueOnce([file]);
			// update query (no returning)
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete('test-user-id', file.id);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					isDeleted: true,
					deletedAt: expect.any(Date),
				})
			);
		});

		it('should throw NotFoundException when deleting nonexistent file', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle isFavorite from false to true', async () => {
			const file = mockFileFactory.create({ isFavorite: false });
			mockDb.where.mockResolvedValueOnce([file]);

			const toggledFile = { ...file, isFavorite: true };
			mockDb.returning.mockResolvedValueOnce([toggledFile]);

			const result = await service.toggleFavorite('test-user-id', file.id);

			expect(result.isFavorite).toBe(true);
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: true }));
		});

		it('should toggle isFavorite from true to false', async () => {
			const file = mockFileFactory.create({ isFavorite: true });
			mockDb.where.mockResolvedValueOnce([file]);

			const toggledFile = { ...file, isFavorite: false };
			mockDb.returning.mockResolvedValueOnce([toggledFile]);

			const result = await service.toggleFavorite('test-user-id', file.id);

			expect(result.isFavorite).toBe(false);
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isFavorite: false }));
		});
	});

	describe('download', () => {
		it('should download file from S3', async () => {
			const file = mockFileFactory.create();
			mockDb.where.mockResolvedValueOnce([file]);

			const fileBuffer = Buffer.from('file content');
			mockStorageService.downloadFile.mockResolvedValueOnce(fileBuffer);

			const result = await service.download('test-user-id', file.id);

			expect(result.buffer).toEqual(fileBuffer);
			expect(result.file).toEqual(file);
			expect(mockStorageService.downloadFile).toHaveBeenCalledWith(file.storageKey);
		});

		it('should throw NotFoundException when downloading nonexistent file', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.download('test-user-id', 'nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getDownloadUrl', () => {
		it('should return presigned download URL', async () => {
			const file = mockFileFactory.create();
			mockDb.where.mockResolvedValueOnce([file]);

			const url = 'https://s3.example.com/presigned-url';
			mockStorageService.getDownloadUrl.mockResolvedValueOnce(url);

			const result = await service.getDownloadUrl('test-user-id', file.id);

			expect(result).toBe(url);
			expect(mockStorageService.getDownloadUrl).toHaveBeenCalledWith(file.storageKey);
		});
	});
});
