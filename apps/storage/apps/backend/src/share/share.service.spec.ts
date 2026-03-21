import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import { ShareService } from './share.service';
import { createMockDb, mockShareFactory } from '../__tests__/utils/mock-factories';

describe('ShareService', () => {
	let service: ShareService;
	let mockDb: ReturnType<typeof createMockDb>;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [ShareService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<ShareService>(ShareService);
	});

	describe('findAll', () => {
		it('should return active shares for user', async () => {
			const shares = [
				mockShareFactory.create({ isActive: true }),
				mockShareFactory.create({ isActive: true }),
			];
			mockDb.where.mockResolvedValueOnce(shares);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual(shares);
			expect(result).toHaveLength(2);
		});

		it('should return empty array when user has no shares', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll('test-user-id');

			expect(result).toEqual([]);
		});
	});

	describe('findByToken', () => {
		it('should return share by token', async () => {
			const share = mockShareFactory.create();
			mockDb.where.mockResolvedValueOnce([share]);

			const result = await service.findByToken(share.shareToken);

			expect(result).toEqual(share);
		});

		it('should throw NotFoundException when share does not exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByToken('invalid-token')).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when share has expired', async () => {
			const expiredShare = mockShareFactory.create({
				expiresAt: new Date(Date.now() - 86400000), // expired yesterday
			});
			mockDb.where.mockResolvedValueOnce([expiredShare]);

			await expect(service.findByToken(expiredShare.shareToken)).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when download limit is reached', async () => {
			const maxedShare = mockShareFactory.create({
				maxDownloads: 5,
				downloadCount: 5,
			});
			mockDb.where.mockResolvedValueOnce([maxedShare]);

			await expect(service.findByToken(maxedShare.shareToken)).rejects.toThrow(NotFoundException);
		});

		it('should return share when download count is below limit', async () => {
			const share = mockShareFactory.create({
				maxDownloads: 10,
				downloadCount: 3,
			});
			mockDb.where.mockResolvedValueOnce([share]);

			const result = await service.findByToken(share.shareToken);

			expect(result).toEqual(share);
		});

		it('should return share when it has no expiration', async () => {
			const share = mockShareFactory.create({ expiresAt: null });
			mockDb.where.mockResolvedValueOnce([share]);

			const result = await service.findByToken(share.shareToken);

			expect(result).toEqual(share);
		});
	});

	describe('create', () => {
		it('should create a file share with random token', async () => {
			const fileId = 'file-123';
			const created = mockShareFactory.create({ fileId, shareType: 'file' });
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', { fileId });

			expect(result.fileId).toBe(fileId);
			expect(result.shareType).toBe('file');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should create a folder share', async () => {
			const folderId = 'folder-123';
			const created = mockShareFactory.create({ folderId, shareType: 'folder' });
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', { folderId });

			expect(result.folderId).toBe(folderId);
			expect(result.shareType).toBe('folder');
		});

		it('should create a share with access level and password', async () => {
			const created = mockShareFactory.create({
				fileId: 'file-123',
				accessLevel: 'download',
				password: 'hashed-password',
			});
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', {
				fileId: 'file-123',
				accessLevel: 'download',
				password: 'hashed-password',
			});

			expect(result.accessLevel).toBe('download');
			expect(result.password).toBe('hashed-password');
		});

		it('should create a share with maxDownloads and expiresAt', async () => {
			const expiresAt = new Date(Date.now() + 86400000);
			const created = mockShareFactory.create({
				fileId: 'file-123',
				maxDownloads: 100,
				expiresAt,
			});
			mockDb.returning.mockResolvedValueOnce([created]);

			const result = await service.create('test-user-id', {
				fileId: 'file-123',
				maxDownloads: 100,
				expiresAt,
			});

			expect(result.maxDownloads).toBe(100);
			expect(result.expiresAt).toEqual(expiresAt);
		});
	});

	describe('delete', () => {
		it('should deactivate the share', async () => {
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete('test-user-id', 'share-id');

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith({ isActive: false });
		});
	});

	describe('incrementDownloadCount', () => {
		it('should increment download count and update lastAccessedAt', async () => {
			const share = mockShareFactory.create({ downloadCount: 3 });
			mockDb.where.mockResolvedValueOnce([share]);
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.incrementDownloadCount(share.id);

			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					downloadCount: 4,
					lastAccessedAt: expect.any(Date),
				})
			);
		});

		it('should do nothing when share does not exist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await service.incrementDownloadCount('nonexistent');

			// update should not be called (only select was called)
			expect(mockDb.update).not.toHaveBeenCalled();
		});
	});
});
