import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockDeviceToken, TEST_USER_ID } from '../__tests__/utils/mock-factories';

describe('NotificationService', () => {
	let service: NotificationService;
	let mockDb: any;
	let mockPushService: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		mockPushService = {
			sendToToken: jest.fn().mockResolvedValue(true),
			sendToTokens: jest.fn().mockResolvedValue(new Map()),
			isValidToken: jest.fn().mockReturnValue(true),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotificationService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: PushService,
					useValue: mockPushService,
				},
			],
		}).compile();

		service = module.get<NotificationService>(NotificationService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('registerToken', () => {
		it('should create a new device token when it does not exist', async () => {
			const newToken = createMockDeviceToken({ pushToken: 'ExponentPushToken[new-token]' });
			// Check for existing token - not found
			mockDb.where.mockResolvedValueOnce([]);
			// Insert returning
			mockDb.returning.mockResolvedValueOnce([newToken]);

			const result = await service.registerToken(TEST_USER_ID, {
				pushToken: 'ExponentPushToken[new-token]',
				platform: 'ios',
				deviceName: 'Test iPhone',
			});

			expect(result).toEqual(newToken);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should update existing token when it already exists', async () => {
			const existingToken = createMockDeviceToken({
				pushToken: 'ExponentPushToken[existing-token]',
			});
			const updatedToken = { ...existingToken, userId: TEST_USER_ID, isActive: true };

			// Check for existing token - found
			mockDb.where.mockResolvedValueOnce([existingToken]);
			// Update returning
			mockDb.returning.mockResolvedValueOnce([updatedToken]);

			const result = await service.registerToken(TEST_USER_ID, {
				pushToken: 'ExponentPushToken[existing-token]',
				platform: 'ios',
				deviceName: 'Test iPhone',
			});

			expect(result).toEqual(updatedToken);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
			// Should not have called insert
			expect(mockDb.insert).not.toHaveBeenCalled();
		});
	});

	describe('removeToken', () => {
		it('should delete a device token', async () => {
			await service.removeToken('ExponentPushToken[test-token]');

			expect(mockDb.delete).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('deactivateToken', () => {
		it('should set token isActive to false', async () => {
			await service.deactivateToken('ExponentPushToken[test-token]');

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
		});
	});

	describe('getActiveTokensForUser', () => {
		it('should return all active tokens for a user', async () => {
			const tokens = [
				createMockDeviceToken({ isActive: true }),
				createMockDeviceToken({ isActive: true }),
			];
			mockDb.where.mockResolvedValueOnce(tokens);

			const result = await service.getActiveTokensForUser(TEST_USER_ID);

			expect(result).toEqual(tokens);
			expect(result).toHaveLength(2);
		});

		it('should return empty array when user has no active tokens', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getActiveTokensForUser(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('sendToUser', () => {
		it('should return false when user has no active tokens', async () => {
			// getActiveTokensForUser returns empty
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.sendToUser(TEST_USER_ID, {
				title: 'Test',
				body: 'Test notification',
			});

			expect(result).toBe(false);
			expect(mockPushService.sendToTokens).not.toHaveBeenCalled();
		});

		it('should send notification to all active tokens', async () => {
			const token1 = createMockDeviceToken({ pushToken: 'token-1' });
			const token2 = createMockDeviceToken({ pushToken: 'token-2' });

			// getActiveTokensForUser returns tokens
			mockDb.where.mockResolvedValueOnce([token1, token2]);

			const resultMap = new Map<string, boolean>();
			resultMap.set('token-1', true);
			resultMap.set('token-2', true);
			mockPushService.sendToTokens!.mockResolvedValueOnce(resultMap);

			const result = await service.sendToUser(TEST_USER_ID, {
				title: 'Test',
				body: 'Test notification',
			});

			expect(result).toBe(true);
			expect(mockPushService.sendToTokens).toHaveBeenCalledWith(['token-1', 'token-2'], {
				title: 'Test',
				body: 'Test notification',
			});
		});

		it('should deactivate tokens that failed', async () => {
			const token1 = createMockDeviceToken({ pushToken: 'token-1' });
			const token2 = createMockDeviceToken({ pushToken: 'token-2' });

			// getActiveTokensForUser returns tokens
			mockDb.where.mockResolvedValueOnce([token1, token2]);

			const resultMap = new Map<string, boolean>();
			resultMap.set('token-1', true);
			resultMap.set('token-2', false); // This token failed
			mockPushService.sendToTokens!.mockResolvedValueOnce(resultMap);

			const result = await service.sendToUser(TEST_USER_ID, {
				title: 'Test',
				body: 'Test notification',
			});

			expect(result).toBe(true);
			// Should deactivate the failed token
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
		});

		it('should return false when all tokens fail', async () => {
			const token1 = createMockDeviceToken({ pushToken: 'token-1' });

			mockDb.where.mockResolvedValueOnce([token1]);

			const resultMap = new Map<string, boolean>();
			resultMap.set('token-1', false);
			mockPushService.sendToTokens!.mockResolvedValueOnce(resultMap);

			const result = await service.sendToUser(TEST_USER_ID, {
				title: 'Test',
				body: 'Test notification',
			});

			expect(result).toBe(false);
		});
	});

	describe('getTokenCount', () => {
		it('should return count of active tokens', async () => {
			const tokens = [
				createMockDeviceToken({ isActive: true }),
				createMockDeviceToken({ isActive: true }),
				createMockDeviceToken({ isActive: true }),
			];
			mockDb.where.mockResolvedValueOnce(tokens);

			const result = await service.getTokenCount(TEST_USER_ID);

			expect(result).toBe(3);
		});

		it('should return 0 when user has no active tokens', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getTokenCount(TEST_USER_ID);

			expect(result).toBe(0);
		});
	});
});
