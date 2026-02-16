/**
 * CreditsController Unit Tests
 *
 * Tests all credits controller endpoints:
 *
 * B2C (Personal) Endpoints:
 * - GET /credits/balance - Get user balance
 * - POST /credits/use - Use credits
 * - GET /credits/transactions - Get transaction history
 * - GET /credits/purchases - Get purchase history
 * - GET /credits/packages - Get available packages
 *
 * B2B (Organization) Endpoints:
 * - POST /credits/organization/allocate - Allocate credits to employee
 * - GET /credits/organization/:orgId/balance - Get org balance
 * - GET /credits/organization/:orgId/employee/:empId/balance - Get employee balance
 * - POST /credits/organization/:orgId/use - Use credits with org tracking
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { type CurrentUserData } from '../common/decorators/current-user.decorator';
import {
	mockBalanceFactory,
	mockTransactionFactory,
	mockPackageFactory,
	mockPurchaseFactory,
	mockOrganizationBalanceFactory,
	mockDtoFactory,
} from '../__tests__/utils/mock-factories';
import { nanoid } from 'nanoid';

describe('CreditsController', () => {
	let controller: CreditsController;
	let creditsService: jest.Mocked<CreditsService>;

	// Common test user data
	const mockUser: CurrentUserData = {
		userId: 'user-123',
		email: 'user@example.com',
		role: 'user',
	};

	const mockOrgOwner: CurrentUserData = {
		userId: 'owner-456',
		email: 'owner@company.com',
		role: 'user',
	};

	beforeEach(async () => {
		// Create mock CreditsService
		const mockCreditsService = {
			getBalance: jest.fn(),
			useCredits: jest.fn(),
			getTransactionHistory: jest.fn(),
			getPurchaseHistory: jest.fn(),
			getPackages: jest.fn(),
			allocateCredits: jest.fn(),
			getOrganizationBalance: jest.fn(),
			getEmployeeCreditBalance: jest.fn(),
			deductCredits: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [CreditsController],
			providers: [
				{
					provide: CreditsService,
					useValue: mockCreditsService,
				},
			],
		})
			// Override the guard to allow all requests in tests
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<CreditsController>(CreditsController);
		creditsService = module.get(CreditsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// B2C ENDPOINTS - Personal Credits
	// ============================================================================

	describe('B2C Endpoints', () => {
		// --------------------------------------------------------------------------
		// GET /credits/balance
		// --------------------------------------------------------------------------

		describe('GET /credits/balance', () => {
			it('should return user balance', async () => {
				const expectedBalance = mockBalanceFactory.withBalance(mockUser.userId, 500);

				creditsService.getBalance.mockResolvedValue(expectedBalance);

				const result = await controller.getBalance(mockUser);

				expect(result).toEqual(expectedBalance);
				expect(creditsService.getBalance).toHaveBeenCalledWith(mockUser.userId);
			});

			it('should return zero balance for new user', async () => {
				const newUserBalance = mockBalanceFactory.create(mockUser.userId, {
					balance: 0,
				});

				creditsService.getBalance.mockResolvedValue(newUserBalance);

				const result = await controller.getBalance(mockUser);

				expect(result.balance).toBe(0);
			});
		});

		// --------------------------------------------------------------------------
		// POST /credits/use
		// --------------------------------------------------------------------------

		describe('POST /credits/use', () => {
			it('should successfully use credits', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 10,
					appId: 'memoro',
					description: 'AI transcription',
				});

				const expectedResult = {
					success: true,
					transaction: mockTransactionFactory.create(mockUser.userId, {
						amount: -10,
						appId: 'memoro',
					}),
					newBalance: 90,
				};

				creditsService.useCredits.mockResolvedValue(expectedResult as any);

				const result = await controller.useCredits(mockUser, useCreditsDto);

				expect(result).toEqual(expectedResult);
				expect(creditsService.useCredits).toHaveBeenCalledWith(mockUser.userId, useCreditsDto);
			});

			it('should pass idempotency key for duplicate prevention', async () => {
				const idempotencyKey = `idempotency-${nanoid()}`;
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 25,
					appId: 'chat',
					description: 'Message generation',
					idempotencyKey,
				});

				creditsService.useCredits.mockResolvedValue({ success: true } as any);

				await controller.useCredits(mockUser, useCreditsDto);

				expect(creditsService.useCredits).toHaveBeenCalledWith(
					mockUser.userId,
					expect.objectContaining({ idempotencyKey })
				);
			});

			it('should propagate BadRequestException for insufficient credits', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 1000,
					appId: 'picture',
					description: 'Image generation',
				});

				creditsService.useCredits.mockRejectedValue(
					new BadRequestException('Insufficient credits')
				);

				await expect(controller.useCredits(mockUser, useCreditsDto)).rejects.toThrow(
					BadRequestException
				);
			});

			it('should handle metadata in credit usage', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 5,
					appId: 'wisekeep',
					description: 'Video analysis',
					metadata: {
						videoId: 'vid-123',
						duration: 120,
						model: 'gpt-4',
					},
				});

				creditsService.useCredits.mockResolvedValue({ success: true } as any);

				await controller.useCredits(mockUser, useCreditsDto);

				expect(creditsService.useCredits).toHaveBeenCalledWith(
					mockUser.userId,
					expect.objectContaining({
						metadata: {
							videoId: 'vid-123',
							duration: 120,
							model: 'gpt-4',
						},
					})
				);
			});
		});

		// --------------------------------------------------------------------------
		// GET /credits/transactions
		// --------------------------------------------------------------------------

		describe('GET /credits/transactions', () => {
			it('should return transaction history with default pagination', async () => {
				const transactions = mockTransactionFactory.createMany(mockUser.userId, 5);

				creditsService.getTransactionHistory.mockResolvedValue(transactions as any);

				const result = await controller.getTransactionHistory(mockUser);

				expect(result).toEqual(transactions);
				expect(creditsService.getTransactionHistory).toHaveBeenCalledWith(
					mockUser.userId,
					undefined,
					undefined
				);
			});

			it('should pass limit parameter', async () => {
				const limit = 10;

				creditsService.getTransactionHistory.mockResolvedValue([]);

				await controller.getTransactionHistory(mockUser, limit);

				expect(creditsService.getTransactionHistory).toHaveBeenCalledWith(
					mockUser.userId,
					limit,
					undefined
				);
			});

			it('should pass offset parameter', async () => {
				const limit = 20;
				const offset = 40;

				creditsService.getTransactionHistory.mockResolvedValue([]);

				await controller.getTransactionHistory(mockUser, limit, offset);

				expect(creditsService.getTransactionHistory).toHaveBeenCalledWith(
					mockUser.userId,
					limit,
					offset
				);
			});

			it('should return empty array for user with no transactions', async () => {
				creditsService.getTransactionHistory.mockResolvedValue([]);

				const result = await controller.getTransactionHistory(mockUser);

				expect(result).toEqual([]);
			});
		});

		// --------------------------------------------------------------------------
		// GET /credits/purchases
		// --------------------------------------------------------------------------

		describe('GET /credits/purchases', () => {
			it('should return purchase history', async () => {
				const packageId = 'pkg-123';
				const purchases = [
					mockPurchaseFactory.create(mockUser.userId, packageId, {
						credits: 100,
						priceEuroCents: 100,
					}),
					mockPurchaseFactory.create(mockUser.userId, packageId, {
						credits: 500,
						priceEuroCents: 450,
					}),
				];

				creditsService.getPurchaseHistory.mockResolvedValue(purchases as any);

				const result = await controller.getPurchaseHistory(mockUser);

				expect(result).toEqual(purchases);
				expect(creditsService.getPurchaseHistory).toHaveBeenCalledWith(mockUser.userId);
			});

			it('should return empty array for user with no purchases', async () => {
				creditsService.getPurchaseHistory.mockResolvedValue([]);

				const result = await controller.getPurchaseHistory(mockUser);

				expect(result).toEqual([]);
			});
		});

		// --------------------------------------------------------------------------
		// GET /credits/packages
		// --------------------------------------------------------------------------

		describe('GET /credits/packages', () => {
			it('should return all available packages', async () => {
				const packages = mockPackageFactory.createMany(3);

				creditsService.getPackages.mockResolvedValue(packages);

				const result = await controller.getPackages();

				expect(result).toEqual(packages);
				expect(creditsService.getPackages).toHaveBeenCalled();
			});

			it('should return only active packages', async () => {
				const activePackages = mockPackageFactory.createMany(2).map((pkg) => ({
					...pkg,
					active: true,
				}));

				creditsService.getPackages.mockResolvedValue(activePackages);

				const result = await controller.getPackages();

				expect(result.every((pkg: any) => pkg.active === true)).toBe(true);
			});

			it('should return empty array when no packages available', async () => {
				creditsService.getPackages.mockResolvedValue([]);

				const result = await controller.getPackages();

				expect(result).toEqual([]);
			});
		});
	});

	// B2B endpoints removed - functionality simplified to B2C only
});
