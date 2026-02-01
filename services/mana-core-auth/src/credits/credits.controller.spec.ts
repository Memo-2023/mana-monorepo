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
				const expectedBalance = mockBalanceFactory.withBalance(mockUser.userId, 500, 100);

				creditsService.getBalance.mockResolvedValue(expectedBalance);

				const result = await controller.getBalance(mockUser);

				expect(result).toEqual(expectedBalance);
				expect(creditsService.getBalance).toHaveBeenCalledWith(mockUser.userId);
			});

			it('should return zero balance for new user', async () => {
				const newUserBalance = mockBalanceFactory.create(mockUser.userId, {
					balance: 0,
					freeCreditsRemaining: 150,
				});

				creditsService.getBalance.mockResolvedValue(newUserBalance);

				const result = await controller.getBalance(mockUser);

				expect(result.balance).toBe(0);
				expect(result.freeCreditsRemaining).toBe(150);
			});

			it('should handle balance with daily free credits', async () => {
				const balanceWithDailyCredits = mockBalanceFactory.create(mockUser.userId, {
					balance: 100,
					freeCreditsRemaining: 50,
					dailyFreeCredits: 5,
				});

				creditsService.getBalance.mockResolvedValue(balanceWithDailyCredits);

				const result = await controller.getBalance(mockUser);

				expect(result.dailyFreeCredits).toBe(5);
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

	// ============================================================================
	// B2B ENDPOINTS - Organization Credits
	// ============================================================================

	describe('B2B Endpoints', () => {
		const organizationId = 'org-123';
		const employeeId = 'emp-789';

		// --------------------------------------------------------------------------
		// POST /credits/organization/allocate
		// --------------------------------------------------------------------------

		describe('POST /credits/organization/allocate', () => {
			it('should successfully allocate credits to employee', async () => {
				const allocateDto = {
					organizationId,
					employeeId,
					amount: 100,
					reason: 'Monthly allocation',
				};

				const expectedResult = {
					success: true,
					allocation: {
						id: 'alloc-123',
						organizationId,
						employeeId,
						amount: 100,
						allocatedBy: mockOrgOwner.userId,
					},
					newOrgBalance: 900,
					newEmployeeBalance: 100,
				};

				creditsService.allocateCredits.mockResolvedValue(expectedResult as any);

				const result = await controller.allocateCredits(mockOrgOwner, allocateDto);

				expect(result).toEqual(expectedResult);
				expect(creditsService.allocateCredits).toHaveBeenCalledWith(
					mockOrgOwner.userId,
					allocateDto
				);
			});

			it('should propagate ForbiddenException for non-owners', async () => {
				const allocateDto = {
					organizationId,
					employeeId,
					amount: 50,
				};

				creditsService.allocateCredits.mockRejectedValue(
					new ForbiddenException('Only organization owners can allocate credits')
				);

				await expect(controller.allocateCredits(mockUser, allocateDto)).rejects.toThrow(
					ForbiddenException
				);
			});

			it('should propagate BadRequestException for insufficient org credits', async () => {
				const allocateDto = {
					organizationId,
					employeeId,
					amount: 10000,
				};

				creditsService.allocateCredits.mockRejectedValue(
					new BadRequestException('Insufficient organization credits')
				);

				await expect(controller.allocateCredits(mockOrgOwner, allocateDto)).rejects.toThrow(
					BadRequestException
				);
			});

			it('should pass optional reason parameter', async () => {
				const allocateDto = {
					organizationId,
					employeeId,
					amount: 200,
					reason: 'Bonus for project completion',
				};

				creditsService.allocateCredits.mockResolvedValue({ success: true } as any);

				await controller.allocateCredits(mockOrgOwner, allocateDto);

				expect(creditsService.allocateCredits).toHaveBeenCalledWith(
					mockOrgOwner.userId,
					expect.objectContaining({ reason: 'Bonus for project completion' })
				);
			});
		});

		// --------------------------------------------------------------------------
		// GET /credits/organization/:organizationId/balance
		// --------------------------------------------------------------------------

		describe('GET /credits/organization/:organizationId/balance', () => {
			it('should return organization balance', async () => {
				const expectedBalance = mockOrganizationBalanceFactory.withBalance(
					organizationId,
					1000,
					300
				);

				creditsService.getOrganizationBalance.mockResolvedValue(expectedBalance as any);

				const result = await controller.getOrganizationBalance(organizationId);

				expect(result).toEqual(expectedBalance);
				expect(creditsService.getOrganizationBalance).toHaveBeenCalledWith(organizationId);
			});

			it('should return balance breakdown with allocations', async () => {
				const orgBalance = mockOrganizationBalanceFactory.create(organizationId, {
					balance: 5000,
					allocatedCredits: 2000,
					availableCredits: 3000,
					totalPurchased: 6000,
					totalAllocated: 3500,
				});

				creditsService.getOrganizationBalance.mockResolvedValue(orgBalance as any);

				const result = await controller.getOrganizationBalance(organizationId);

				expect(result.balance).toBe(5000);
				expect(result.allocatedCredits).toBe(2000);
				expect(result.availableCredits).toBe(3000);
			});

			it('should propagate NotFoundException for non-existent org', async () => {
				creditsService.getOrganizationBalance.mockRejectedValue(
					new NotFoundException('Organization not found')
				);

				await expect(controller.getOrganizationBalance('non-existent-org')).rejects.toThrow(
					NotFoundException
				);
			});
		});

		// --------------------------------------------------------------------------
		// GET /credits/organization/:organizationId/employee/:employeeId/balance
		// --------------------------------------------------------------------------

		describe('GET /credits/organization/:organizationId/employee/:employeeId/balance', () => {
			it('should return employee balance within organization', async () => {
				const expectedBalance = {
					employeeId,
					organizationId,
					balance: 250,
					allocatedTotal: 500,
					usedTotal: 250,
				};

				creditsService.getEmployeeCreditBalance.mockResolvedValue(expectedBalance as any);

				const result = await controller.getEmployeeBalance(organizationId, employeeId);

				expect(result).toEqual(expectedBalance);
				expect(creditsService.getEmployeeCreditBalance).toHaveBeenCalledWith(
					employeeId,
					organizationId
				);
			});

			it('should return zero for employee with no allocations', async () => {
				const zeroBalance = {
					employeeId,
					organizationId,
					balance: 0,
					allocatedTotal: 0,
					usedTotal: 0,
				};

				creditsService.getEmployeeCreditBalance.mockResolvedValue(zeroBalance as any);

				const result = await controller.getEmployeeBalance(organizationId, employeeId);

				expect(result!.balance).toBe(0);
			});

			it('should propagate NotFoundException for non-existent employee', async () => {
				creditsService.getEmployeeCreditBalance.mockRejectedValue(
					new NotFoundException('Employee not found in organization')
				);

				await expect(
					controller.getEmployeeBalance(organizationId, 'non-existent-emp')
				).rejects.toThrow(NotFoundException);
			});
		});

		// --------------------------------------------------------------------------
		// POST /credits/organization/:organizationId/use
		// --------------------------------------------------------------------------

		describe('POST /credits/organization/:organizationId/use', () => {
			it('should deduct credits with organization tracking', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 15,
					appId: 'chat',
					description: 'Team chat usage',
				});

				const expectedResult = {
					success: true,
					transaction: mockTransactionFactory.create(mockUser.userId, {
						amount: -15,
						organizationId,
					}),
					newBalance: 85,
				};

				creditsService.deductCredits.mockResolvedValue(expectedResult as any);

				const result = await controller.deductCreditsWithOrgTracking(
					mockUser,
					organizationId,
					useCreditsDto
				);

				expect(result).toEqual(expectedResult);
				expect(creditsService.deductCredits).toHaveBeenCalledWith(
					mockUser.userId,
					useCreditsDto,
					organizationId
				);
			});

			it('should track organization ID in transaction', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 20,
					appId: 'picture',
					description: 'Image generation for team',
				});

				creditsService.deductCredits.mockResolvedValue({ success: true } as any);

				await controller.deductCreditsWithOrgTracking(mockUser, organizationId, useCreditsDto);

				expect(creditsService.deductCredits).toHaveBeenCalledWith(
					mockUser.userId,
					useCreditsDto,
					organizationId
				);
			});

			it('should propagate BadRequestException for insufficient employee credits', async () => {
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 500,
					appId: 'wisekeep',
					description: 'Video analysis',
				});

				creditsService.deductCredits.mockRejectedValue(
					new BadRequestException('Insufficient credits')
				);

				await expect(
					controller.deductCreditsWithOrgTracking(mockUser, organizationId, useCreditsDto)
				).rejects.toThrow(BadRequestException);
			});

			it('should handle idempotency for organization credit usage', async () => {
				const idempotencyKey = `org-usage-${nanoid()}`;
				const useCreditsDto = mockDtoFactory.useCredits({
					amount: 30,
					appId: 'memoro',
					description: 'Voice transcription',
					idempotencyKey,
				});

				creditsService.deductCredits.mockResolvedValue({ success: true } as any);

				await controller.deductCreditsWithOrgTracking(mockUser, organizationId, useCreditsDto);

				expect(creditsService.deductCredits).toHaveBeenCalledWith(
					mockUser.userId,
					expect.objectContaining({ idempotencyKey }),
					organizationId
				);
			});
		});
	});

	// ============================================================================
	// Guard Tests
	// ============================================================================

	describe('Guards', () => {
		it('should have JwtAuthGuard applied at class level', async () => {
			const guards = Reflect.getMetadata('__guards__', CreditsController);
			expect(guards).toBeDefined();
			expect(guards).toContain(JwtAuthGuard);
		});

		it('should require authentication for all endpoints', () => {
			// All credits endpoints require authentication
			// This is handled at the class level with @UseGuards(JwtAuthGuard)
			const classGuards = Reflect.getMetadata('__guards__', CreditsController);
			expect(classGuards).toContain(JwtAuthGuard);
		});
	});

	// ============================================================================
	// Error Handling
	// ============================================================================

	describe('Error Handling', () => {
		it('should propagate service errors correctly', async () => {
			const error = new Error('Database connection failed');
			creditsService.getBalance.mockRejectedValue(error);

			await expect(controller.getBalance(mockUser)).rejects.toThrow('Database connection failed');
		});

		it('should handle concurrent request errors', async () => {
			const useCreditsDto = mockDtoFactory.useCredits({ amount: 10 });

			creditsService.useCredits.mockRejectedValue(
				new BadRequestException('Concurrent modification detected, please retry')
			);

			await expect(controller.useCredits(mockUser, useCreditsDto)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should handle validation errors in allocation', async () => {
			const invalidDto = {
				organizationId: '',
				employeeId: 'emp-123',
				amount: -100, // Invalid negative amount
			};

			creditsService.allocateCredits.mockRejectedValue(
				new BadRequestException('Amount must be positive')
			);

			await expect(controller.allocateCredits(mockOrgOwner, invalidDto)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	// ============================================================================
	// Edge Cases
	// ============================================================================

	describe('Edge Cases', () => {
		it('should handle zero credit usage', async () => {
			const useCreditsDto = mockDtoFactory.useCredits({ amount: 0 });

			creditsService.useCredits.mockRejectedValue(
				new BadRequestException('Amount must be greater than zero')
			);

			await expect(controller.useCredits(mockUser, useCreditsDto)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should handle very large credit amounts', async () => {
			const useCreditsDto = mockDtoFactory.useCredits({
				amount: 999999999,
				appId: 'test',
				description: 'Large transaction',
			});

			creditsService.useCredits.mockRejectedValue(new BadRequestException('Amount exceeds limit'));

			await expect(controller.useCredits(mockUser, useCreditsDto)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should handle special characters in description', async () => {
			const useCreditsDto = mockDtoFactory.useCredits({
				amount: 5,
				appId: 'chat',
				description: 'Test with émojis 🎉 and "quotes"',
			});

			creditsService.useCredits.mockResolvedValue({ success: true } as any);

			await controller.useCredits(mockUser, useCreditsDto);

			expect(creditsService.useCredits).toHaveBeenCalledWith(
				mockUser.userId,
				expect.objectContaining({
					description: 'Test with émojis 🎉 and "quotes"',
				})
			);
		});
	});
});
