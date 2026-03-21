import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { DATABASE_CONNECTION } from '../db/database.module';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { StorageService } from '../storage/storage.service';
import { createMockDb, mockFileFactory } from '../__tests__/utils/mock-factories';
import { randomUUID } from 'crypto';

// FileVersion mock factory
const mockFileVersionFactory = {
	create: (overrides: Record<string, any> = {}) => ({
		id: randomUUID(),
		fileId: randomUUID(),
		versionNumber: 1,
		storagePath: 'users/test-user-id/versions/test-file.pdf',
		storageKey: `users/test-user-id/versions/${randomUUID()}-test-file.pdf`,
		size: 1024,
		checksum: null,
		comment: null,
		createdBy: 'test-user-id',
		createdAt: new Date(),
		...overrides,
	}),
};

describe('FileService - Versions', () => {
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

	describe('getVersions', () => {
		it('should return versions sorted by version number desc', async () => {
			const fileId = randomUUID();
			const file = mockFileFactory.create({ id: fileId, currentVersion: 3 });

			// findOne query
			mockDb.where.mockResolvedValueOnce([file]);

			const versions = [
				mockFileVersionFactory.create({ fileId, versionNumber: 3 }),
				mockFileVersionFactory.create({ fileId, versionNumber: 2 }),
				mockFileVersionFactory.create({ fileId, versionNumber: 1 }),
			];

			// getVersions query (select -> from -> where -> orderBy)
			mockDb.orderBy.mockResolvedValueOnce(versions);

			const result = await service.getVersions('test-user-id', fileId);

			expect(result).toEqual(versions);
			expect(result[0].versionNumber).toBe(3);
			expect(result[2].versionNumber).toBe(1);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent file', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.getVersions('test-user-id', 'nonexistent-id')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('uploadVersion', () => {
		it('should create new version and update file', async () => {
			const fileId = randomUUID();
			const file = mockFileFactory.create({ id: fileId, currentVersion: 2 });

			// findOne query
			mockDb.where.mockResolvedValueOnce([file]);

			const uploadResult = {
				storageKey: 'users/test-user-id/versions/new-file.pdf',
				storagePath: 'users/test-user-id/versions/new-file.pdf',
			};
			mockStorageService.uploadFile.mockResolvedValueOnce(uploadResult);

			const createdVersion = mockFileVersionFactory.create({
				fileId,
				versionNumber: 3,
				comment: 'Updated layout',
			});

			// insert().values().returning() for version record
			mockDb.returning.mockResolvedValueOnce([createdVersion]);

			// update().set().where() for file update
			mockDb.where.mockResolvedValueOnce(undefined);

			const multerFile = {
				buffer: Buffer.from('new version content'),
				originalname: 'updated-file.pdf',
				mimetype: 'application/pdf',
				size: 2048,
			} as Express.Multer.File;

			const result = await service.uploadVersion(
				'test-user-id',
				fileId,
				multerFile,
				'Updated layout'
			);

			expect(result).toEqual(createdVersion);
			expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
				'test-user-id',
				multerFile.buffer,
				'updated-file.pdf',
				'application/pdf',
				'versions'
			);
		});

		it('should increment version number', async () => {
			const fileId = randomUUID();
			const file = mockFileFactory.create({ id: fileId, currentVersion: 5 });

			// findOne query
			mockDb.where.mockResolvedValueOnce([file]);

			const uploadResult = {
				storageKey: 'users/test-user-id/versions/file.pdf',
				storagePath: 'users/test-user-id/versions/file.pdf',
			};
			mockStorageService.uploadFile.mockResolvedValueOnce(uploadResult);

			const createdVersion = mockFileVersionFactory.create({
				fileId,
				versionNumber: 6,
			});

			// insert().values().returning()
			mockDb.returning.mockResolvedValueOnce([createdVersion]);

			// update().set().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			const multerFile = {
				buffer: Buffer.from('content'),
				originalname: 'file.pdf',
				mimetype: 'application/pdf',
				size: 512,
			} as Express.Multer.File;

			const result = await service.uploadVersion('test-user-id', fileId, multerFile);

			expect(result.versionNumber).toBe(6);
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					currentVersion: 6,
				})
			);
		});
	});
});

describe('FileController - Versions', () => {
	let controller: FileController;
	let fileService: jest.Mocked<FileService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockFileService = {
			findAll: jest.fn(),
			findOne: jest.fn(),
			upload: jest.fn(),
			update: jest.fn(),
			move: jest.fn(),
			delete: jest.fn(),
			toggleFavorite: jest.fn(),
			download: jest.fn(),
			getDownloadUrl: jest.fn(),
			getStats: jest.fn(),
			getVersions: jest.fn(),
			uploadVersion: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [FileController],
			providers: [{ provide: FileService, useValue: mockFileService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<FileController>(FileController);
		fileService = module.get(FileService);
	});

	describe('getVersions', () => {
		it('should call service getVersions with correct params', async () => {
			const fileId = 'file-123';
			const versions = [
				mockFileVersionFactory.create({ fileId, versionNumber: 2 }),
				mockFileVersionFactory.create({ fileId, versionNumber: 1 }),
			];
			fileService.getVersions.mockResolvedValue(versions);

			const result = await controller.getVersions(mockUser, fileId);

			expect(fileService.getVersions).toHaveBeenCalledWith('test-user-id', fileId);
			expect(result).toEqual(versions);
		});
	});

	describe('uploadVersion', () => {
		it('should call service uploadVersion with file and comment', async () => {
			const fileId = 'file-123';
			const mockFile = {
				originalname: 'updated.pdf',
				mimetype: 'application/pdf',
				size: 2048,
				buffer: Buffer.from('updated content'),
			} as Express.Multer.File;
			const comment = 'Fixed typos';

			const createdVersion = mockFileVersionFactory.create({
				fileId,
				versionNumber: 2,
				comment,
			});
			fileService.uploadVersion.mockResolvedValue(createdVersion);

			const result = await controller.uploadVersion(mockUser, fileId, mockFile, comment);

			expect(fileService.uploadVersion).toHaveBeenCalledWith(
				'test-user-id',
				fileId,
				mockFile,
				comment
			);
			expect(result).toEqual(createdVersion);
		});

		it('should throw BadRequestException when no file is provided', async () => {
			await expect(
				controller.uploadVersion(mockUser, 'file-123', undefined as any)
			).rejects.toThrow(BadRequestException);
		});
	});
});
