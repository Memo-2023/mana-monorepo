import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { mockShareFactory } from '../__tests__/utils/mock-factories';

describe('ShareController', () => {
	let controller: ShareController;
	let shareService: jest.Mocked<ShareService>;

	const mockUser = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };

	beforeEach(async () => {
		const mockShareService = {
			findAll: jest.fn(),
			findByToken: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ShareController],
			providers: [{ provide: ShareService, useValue: mockShareService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<ShareController>(ShareController);
		shareService = module.get(ShareService);
	});

	describe('findAll', () => {
		it('should return all shares for user', async () => {
			const shares = [
				mockShareFactory.create({ fileId: 'file-1' }),
				mockShareFactory.create({ folderId: 'folder-1', shareType: 'folder' as const }),
			];
			shareService.findAll.mockResolvedValue(shares as any);

			const result = await controller.findAll(mockUser);

			expect(shareService.findAll).toHaveBeenCalledWith('test-user-id');
			expect(result).toEqual(shares);
		});
	});

	describe('findByToken', () => {
		it('should return shared item by token (public, no auth required)', async () => {
			const share = mockShareFactory.create({ shareToken: 'abc123token' });
			shareService.findByToken.mockResolvedValue(share as any);

			const result = await controller.findByToken('abc123token');

			expect(shareService.findByToken).toHaveBeenCalledWith('abc123token');
			expect(result).toEqual(share);
		});
	});

	describe('create', () => {
		it('should create a file share with default settings', async () => {
			const dto = { fileId: 'file-123' };
			const created = mockShareFactory.create({ fileId: 'file-123' });
			shareService.create.mockResolvedValue(created as any);

			const result = await controller.create(mockUser, dto);

			expect(shareService.create).toHaveBeenCalledWith('test-user-id', {
				fileId: 'file-123',
				folderId: undefined,
				accessLevel: undefined,
				password: undefined,
				maxDownloads: undefined,
				expiresAt: undefined,
			});
			expect(result).toEqual(created);
		});

		it('should convert expiresInDays to a Date object', async () => {
			const dto = {
				fileId: 'file-123',
				accessLevel: 'download' as const,
				expiresInDays: 7,
			};
			const created = mockShareFactory.create({ fileId: 'file-123' });
			shareService.create.mockResolvedValue(created as any);

			const beforeCall = Date.now();
			await controller.create(mockUser, dto);
			const afterCall = Date.now();

			const callArgs = shareService.create.mock.calls[0];
			expect(callArgs[0]).toBe('test-user-id');
			const expiresAt = callArgs[1].expiresAt as Date;
			expect(expiresAt).toBeInstanceOf(Date);

			const expectedMin = beforeCall + 7 * 24 * 60 * 60 * 1000;
			const expectedMax = afterCall + 7 * 24 * 60 * 60 * 1000;
			expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
			expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
		});

		it('should create a share with password and max downloads', async () => {
			const dto = {
				fileId: 'file-123',
				password: 'secret123',
				maxDownloads: 5,
			};
			const created = mockShareFactory.create({
				fileId: 'file-123',
				password: 'secret123',
				maxDownloads: 5,
			});
			shareService.create.mockResolvedValue(created as any);

			const result = await controller.create(mockUser, dto);

			expect(shareService.create).toHaveBeenCalledWith('test-user-id', {
				fileId: 'file-123',
				folderId: undefined,
				accessLevel: undefined,
				password: 'secret123',
				maxDownloads: 5,
				expiresAt: undefined,
			});
			expect(result).toEqual(created);
		});

		it('should create a folder share', async () => {
			const dto = { folderId: 'folder-123', accessLevel: 'view' as const };
			const created = mockShareFactory.create({
				folderId: 'folder-123',
				shareType: 'folder' as const,
			});
			shareService.create.mockResolvedValue(created as any);

			const result = await controller.create(mockUser, dto);

			expect(shareService.create).toHaveBeenCalledWith('test-user-id', {
				fileId: undefined,
				folderId: 'folder-123',
				accessLevel: 'view',
				password: undefined,
				maxDownloads: undefined,
				expiresAt: undefined,
			});
			expect(result).toEqual(created);
		});
	});

	describe('delete', () => {
		it('should delete a share and return success', async () => {
			shareService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'share-123');

			expect(shareService.delete).toHaveBeenCalledWith('test-user-id', 'share-123');
			expect(result).toEqual({ success: true });
		});
	});
});
