/**
 * Mock Factories for Testing
 *
 * Centralized factory functions for creating test data
 */

import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';

/**
 * Mock User Factory
 */
export const mockUserFactory = {
	create: (overrides: Partial<any> = {}) => ({
		id: nanoid(),
		email: `test-${nanoid(6)}@example.com`,
		emailVerified: true,
		name: 'Test User',
		avatarUrl: null,
		role: 'user',
		createdAt: new Date(),
		updatedAt: new Date(),
		deletedAt: null,
		...overrides,
	}),

	createMany: (count: number, overrides: Partial<any> = {}) => {
		return Array.from({ length: count }, () => mockUserFactory.create(overrides));
	},
};

/**
 * Mock Session Factory
 */
export const mockSessionFactory = {
	create: (userId: string, overrides: Partial<any> = {}) => ({
		id: nanoid(),
		userId,
		token: nanoid(),
		refreshToken: nanoid(64),
		refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		ipAddress: '127.0.0.1',
		userAgent: 'Mozilla/5.0 Test',
		deviceId: null,
		deviceName: null,
		lastActivityAt: new Date(),
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
		revokedAt: null,
		...overrides,
	}),
};

/**
 * Mock Password Factory
 */
export const mockPasswordFactory = {
	create: async (userId: string, password: string = 'TestPassword123!') => ({
		userId,
		hashedPassword: await bcrypt.hash(password, 12),
		createdAt: new Date(),
		updatedAt: new Date(),
	}),

	createSync: (userId: string, password: string = 'TestPassword123!') => ({
		userId,
		hashedPassword: bcrypt.hashSync(password, 12),
		createdAt: new Date(),
		updatedAt: new Date(),
	}),
};

/**
 * Mock Balance Factory
 */
export const mockBalanceFactory = {
	create: (userId: string, overrides: Partial<any> = {}) => ({
		userId,
		balance: 0,
		freeCreditsRemaining: 150,
		dailyFreeCredits: 5,
		lastDailyResetAt: new Date(),
		totalEarned: 0,
		totalSpent: 0,
		version: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),

	withBalance: (userId: string, balance: number, freeCredits: number = 0) => {
		return mockBalanceFactory.create(userId, {
			balance,
			freeCreditsRemaining: freeCredits,
		});
	},
};

/**
 * Mock Transaction Factory
 */
export const mockTransactionFactory = {
	create: (userId: string, overrides: Partial<any> = {}) => ({
		id: nanoid(),
		userId,
		type: 'usage',
		status: 'completed',
		amount: -10,
		balanceBefore: 100,
		balanceAfter: 90,
		appId: 'test-app',
		description: 'Test transaction',
		metadata: null,
		idempotencyKey: null,
		createdAt: new Date(),
		completedAt: new Date(),
		...overrides,
	}),

	createMany: (userId: string, count: number) => {
		return Array.from({ length: count }, (_, i) =>
			mockTransactionFactory.create(userId, {
				amount: -(i + 1) * 10,
			})
		);
	},
};

/**
 * Mock Package Factory
 */
export const mockPackageFactory = {
	create: (overrides: Partial<any> = {}) => ({
		id: nanoid(),
		name: 'Test Package',
		description: '100 credits',
		credits: 100,
		priceEuroCents: 100,
		stripePriceId: `price_${nanoid()}`,
		active: true,
		sortOrder: 0,
		metadata: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),

	createMany: (count: number) => {
		return Array.from({ length: count }, (_, i) =>
			mockPackageFactory.create({
				name: `Package ${i + 1}`,
				credits: (i + 1) * 100,
				priceEuroCents: (i + 1) * 100,
				sortOrder: i,
			})
		);
	},
};

/**
 * Mock Purchase Factory
 */
export const mockPurchaseFactory = {
	create: (userId: string, packageId: string, overrides: Partial<any> = {}) => ({
		id: nanoid(),
		userId,
		packageId,
		credits: 100,
		priceEuroCents: 100,
		stripePaymentIntentId: `pi_${nanoid()}`,
		stripeCustomerId: `cus_${nanoid()}`,
		status: 'completed',
		metadata: null,
		createdAt: new Date(),
		completedAt: new Date(),
		...overrides,
	}),
};

/**
 * Mock DTO Factory
 */
export const mockDtoFactory = {
	register: (overrides: Partial<any> = {}) => ({
		email: `test-${nanoid(6)}@example.com`,
		password: 'SecurePassword123!',
		name: 'Test User',
		...overrides,
	}),

	login: (overrides: Partial<any> = {}) => ({
		email: 'test@example.com',
		password: 'SecurePassword123!',
		deviceId: undefined,
		deviceName: undefined,
		...overrides,
	}),

	useCredits: (overrides: Partial<any> = {}) => ({
		amount: 10,
		appId: 'test-app',
		description: 'Test operation',
		metadata: undefined,
		idempotencyKey: undefined,
		...overrides,
	}),
};

/**
 * Mock JWT Tokens
 */
export const mockTokenFactory = {
	validPayload: (overrides: Partial<any> = {}) => ({
		sub: nanoid(),
		email: 'test@example.com',
		role: 'user',
		sessionId: nanoid(),
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
		...overrides,
	}),

	expiredPayload: (overrides: Partial<any> = {}) => ({
		sub: nanoid(),
		email: 'test@example.com',
		role: 'user',
		sessionId: nanoid(),
		iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
		exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
		...overrides,
	}),
};

/**
 * Mock Organization Factory
 */
export const mockOrganizationFactory = {
	create: (overrides: Partial<any> = {}) => ({
		id: nanoid(),
		name: 'Test Organization',
		slug: `test-org-${nanoid(6)}`,
		logo: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),
};

/**
 * Mock Organization Balance Factory
 */
export const mockOrganizationBalanceFactory = {
	create: (organizationId: string, overrides: Partial<any> = {}) => ({
		organizationId,
		balance: 0,
		allocatedCredits: 0,
		availableCredits: 0,
		totalPurchased: 0,
		totalAllocated: 0,
		version: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),

	withBalance: (organizationId: string, balance: number, allocated: number = 0) => {
		return mockOrganizationBalanceFactory.create(organizationId, {
			balance,
			allocatedCredits: allocated,
			availableCredits: balance - allocated,
		});
	},
};

/**
 * Mock Member Factory
 */
export const mockMemberFactory = {
	create: (organizationId: string, userId: string, overrides: Partial<any> = {}) => ({
		id: nanoid(),
		organizationId,
		userId,
		role: 'member',
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),

	createOwner: (organizationId: string, userId: string) => {
		return mockMemberFactory.create(organizationId, userId, {
			role: 'owner',
		});
	},

	createEmployee: (organizationId: string, userId: string) => {
		return mockMemberFactory.create(organizationId, userId, {
			role: 'member',
		});
	},
};

/**
 * Mock Credit Allocation Factory
 */
export const mockCreditAllocationFactory = {
	create: (organizationId: string, employeeId: string, allocatedBy: string, overrides: Partial<any> = {}) => ({
		id: nanoid(),
		organizationId,
		employeeId,
		amount: 100,
		allocatedBy,
		reason: 'Credit allocation',
		balanceBefore: 0,
		balanceAfter: 100,
		createdAt: new Date(),
		...overrides,
	}),
};

/**
 * Mock Database Responses
 */
export const mockDbFactory = {
	createSelectMock: () => ({
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		for: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	}),

	createInsertMock: () => ({
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	}),

	createUpdateMock: () => ({
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		returning: jest.fn(),
	}),

	createTransactionMock: () => ({
		transaction: jest.fn((callback) => callback(mockDbFactory.createSelectMock())),
	}),

	createFullMock: () => ({
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		for: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		returning: jest.fn(),
		transaction: jest.fn((callback) => callback(this)),
	}),
};
