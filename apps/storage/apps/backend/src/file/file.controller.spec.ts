import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { mockFileFactory } from '../__tests__/utils/mock-factories';

describe('FileController', () => {
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

	describe('findAll', () => {
		it('should return files for user at root level', async () => {
			const files = mockFileFactory.createMany(3);
			fileService.findAll.mockResolvedValue(files);

			const result = await controller.findAll(mockUser);

			expect(fileService.findAll).toHaveBeenCalledWith('test-user-id', undefined);
			expect(result).toEqual(files);
		});

		it('should return files for user in specific folder', async () => {
			const folderId = 'folder-123';
			const files = mockFileFactory.createMany(2, { parentFolderId: folderId });
			fileService.findAll.mockResolvedValue(files);

			const result = await controller.findAll(mockUser, folderId);

			expect(fileService.findAll).toHaveBeenCalledWith('test-user-id', folderId);
			expect(result).toEqual(files);
		});
	});

	describe('findOne', () => {
		it('should return a single file by id', async () => {
			const file = mockFileFactory.create({ id: 'file-123' });
			fileService.findOne.mockResolvedValue(file);

			const result = await controller.findOne(mockUser, 'file-123');

			expect(fileService.findOne).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(result).toEqual(file);
		});
	});

	describe('getStats', () => {
		it('should return file stats for user', async () => {
			const stats = { totalFiles: 10, totalSize: 1024000, byType: {} };
			fileService.getStats.mockResolvedValue(stats as any);

			const result = await controller.getStats(mockUser);

			expect(fileService.getStats).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual(stats);
		});
	});

	describe('upload', () => {
		it('should upload a file and return the result', async () => {
			const mockFile = {
				originalname: 'test.pdf',
				mimetype: 'application/pdf',
				size: 1024,
				buffer: Buffer.from('test'),
			} as Express.Multer.File;
			const dto = { parentFolderId: 'folder-123' };
			const createdFile = mockFileFactory.create({ name: 'test.pdf' });
			fileService.upload.mockResolvedValue(createdFile);

			const result = await controller.upload(mockUser, mockFile, dto);

			expect(fileService.upload).toHaveBeenCalledWith('test-user-id', mockFile, dto);
			expect(result).toEqual(createdFile);
		});

		it('should throw BadRequestException when no file is provided', async () => {
			const dto = {};

			await expect(controller.upload(mockUser, undefined as any, dto)).rejects.toThrow(
				BadRequestException
			);
			await expect(controller.upload(mockUser, undefined as any, dto)).rejects.toThrow(
				'No file provided'
			);
			expect(fileService.upload).not.toHaveBeenCalled();
		});
	});

	describe('uploadMultiple', () => {
		it('should upload multiple files and return results', async () => {
			const mockFiles = [
				{
					originalname: 'file1.pdf',
					mimetype: 'application/pdf',
					size: 1024,
					buffer: Buffer.from('test1'),
				},
				{
					originalname: 'file2.png',
					mimetype: 'image/png',
					size: 2048,
					buffer: Buffer.from('test2'),
				},
			] as Express.Multer.File[];
			const dto = {};
			const created1 = mockFileFactory.create({ name: 'file1.pdf' });
			const created2 = mockFileFactory.create({ name: 'file2.png' });
			fileService.upload.mockResolvedValueOnce(created1).mockResolvedValueOnce(created2);

			const result = await controller.uploadMultiple(mockUser, mockFiles, dto);

			expect(fileService.upload).toHaveBeenCalledTimes(2);
			expect(fileService.upload).toHaveBeenCalledWith('test-user-id', mockFiles[0], dto);
			expect(fileService.upload).toHaveBeenCalledWith('test-user-id', mockFiles[1], dto);
			expect(result).toEqual([created1, created2]);
		});

		it('should throw BadRequestException when no files provided', async () => {
			await expect(controller.uploadMultiple(mockUser, [], {})).rejects.toThrow(
				BadRequestException
			);
			await expect(controller.uploadMultiple(mockUser, [], {})).rejects.toThrow(
				'No files provided'
			);
		});

		it('should throw BadRequestException when files is undefined', async () => {
			await expect(controller.uploadMultiple(mockUser, undefined as any, {})).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('update', () => {
		it('should update a file and return the result', async () => {
			const dto = { name: 'renamed-file.pdf' };
			const updatedFile = mockFileFactory.create({ name: 'renamed-file.pdf' });
			fileService.update.mockResolvedValue(updatedFile);

			const result = await controller.update(mockUser, 'file-123', dto);

			expect(fileService.update).toHaveBeenCalledWith('test-user-id', 'file-123', dto);
			expect(result).toEqual(updatedFile);
		});
	});

	describe('move', () => {
		it('should move a file to a new folder', async () => {
			const dto = { parentFolderId: 'new-folder-id' };
			const movedFile = mockFileFactory.create({ parentFolderId: 'new-folder-id' });
			fileService.move.mockResolvedValue(movedFile);

			const result = await controller.move(mockUser, 'file-123', dto);

			expect(fileService.move).toHaveBeenCalledWith('test-user-id', 'file-123', dto);
			expect(result).toEqual(movedFile);
		});
	});

	describe('delete', () => {
		it('should delete a file and return success', async () => {
			fileService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'file-123');

			expect(fileService.delete).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(result).toEqual({ success: true });
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle favorite status and return the file', async () => {
			const file = mockFileFactory.create({ isFavorite: true });
			fileService.toggleFavorite.mockResolvedValue(file);

			const result = await controller.toggleFavorite(mockUser, 'file-123');

			expect(fileService.toggleFavorite).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(result).toEqual(file);
		});
	});

	describe('download', () => {
		it('should set response headers and send buffer for file download', async () => {
			const file = mockFileFactory.create({
				name: 'test-file.pdf',
				mimeType: 'application/pdf',
			});
			const buffer = Buffer.from('file-content');
			fileService.download.mockResolvedValue({ buffer, file } as any);

			const mockRes = { set: jest.fn(), send: jest.fn(), json: jest.fn() } as any;

			await controller.download(mockUser, 'file-123', undefined as any, mockRes);

			expect(fileService.download).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(mockRes.set).toHaveBeenCalledWith({
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${encodeURIComponent('test-file.pdf')}"`,
				'Content-Length': buffer.length,
			});
			expect(mockRes.send).toHaveBeenCalledWith(buffer);
		});

		it('should return JSON with url when url=true query param is set', async () => {
			const downloadUrl = 'https://storage.example.com/presigned-url';
			fileService.getDownloadUrl.mockResolvedValue(downloadUrl);

			const mockRes = { set: jest.fn(), send: jest.fn(), json: jest.fn() } as any;

			await controller.download(mockUser, 'file-123', 'true', mockRes);

			expect(fileService.getDownloadUrl).toHaveBeenCalledWith('test-user-id', 'file-123');
			expect(mockRes.json).toHaveBeenCalledWith({ url: downloadUrl });
			expect(mockRes.send).not.toHaveBeenCalled();
		});
	});
});
