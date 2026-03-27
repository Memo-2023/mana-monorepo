/**
 * BetterAuthService.getSecurityEvents Unit Tests
 *
 * Tests the audit log / security events query method.
 * Uses the thenable DB mock pattern from passkey.service.spec.ts.
 *
 * Since BetterAuthService has complex constructor dependencies (Better Auth,
 * OIDC provider), we mock the better-auth.config module and the DB connection.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../../db/connection';
import { LoggerService } from '../../common/logger';

// Mock better-auth config to avoid oidcProvider instantiation
jest.mock('../better-auth.config', () => ({
	createBetterAuth: jest.fn(() => ({
		api: {},
		handler: jest.fn(),
	})),
}));

jest.mock('../../db/connection', () => ({
	getDb: jest.fn(),
}));

const createMockDb = () => {
	let results: any[] = [];
	let resultIndex = 0;

	const db: any = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		then: jest.fn((resolve) => resolve(results[resultIndex++] || [])),
		setResults: (...r: any[]) => {
			results = r;
			resultIndex = 0;
		},
	};
	return db;
};

// Import after mocks are set up
import { BetterAuthService } from './better-auth.service';

describe('BetterAuthService - getSecurityEvents', () => {
	let service: BetterAuthService;
	let mockDb: ReturnType<typeof createMockDb>;

	const mockConfigService = {
		get: jest.fn((key: string, defaultValue?: string) => {
			const config: Record<string, string> = {
				'database.url': 'postgresql://test:test@localhost:5432/test',
				DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
				JWT_ISSUER: 'manacore',
				JWT_AUDIENCE: 'manacore',
				BASE_URL: 'http://localhost:3001',
			};
			return config[key] || defaultValue || '';
		}),
	};

	const mockLoggerService = {
		setContext: jest.fn().mockReturnThis(),
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	};

	beforeEach(async () => {
		mockDb = createMockDb();
		(getDb as jest.Mock).mockReturnValue(mockDb);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BetterAuthService,
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: LoggerService, useValue: mockLoggerService },
			],
		}).compile();

		service = module.get<BetterAuthService>(BetterAuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return events for a given userId ordered by createdAt desc', async () => {
		const mockEvents = [
			{
				id: 'evt-1',
				eventType: 'login_success',
				ipAddress: '192.168.1.1',
				userAgent: 'Mozilla/5.0',
				metadata: { email: 'test@example.com' },
				createdAt: new Date('2026-03-27T10:00:00Z'),
			},
			{
				id: 'evt-2',
				eventType: 'logout',
				ipAddress: '192.168.1.1',
				userAgent: 'Mozilla/5.0',
				metadata: {},
				createdAt: new Date('2026-03-26T09:00:00Z'),
			},
		];

		mockDb.setResults(mockEvents);

		const result = await service.getSecurityEvents('user-123');

		expect(result).toEqual(mockEvents);
		expect(mockDb.select).toHaveBeenCalled();
		expect(mockDb.from).toHaveBeenCalled();
		expect(mockDb.where).toHaveBeenCalled();
		expect(mockDb.orderBy).toHaveBeenCalled();
		expect(mockDb.limit).toHaveBeenCalled();
	});

	it('should limit results to default of 50', async () => {
		mockDb.setResults([]);

		await service.getSecurityEvents('user-123');

		expect(mockDb.limit).toHaveBeenCalledWith(50);
	});

	it('should respect custom limit parameter', async () => {
		mockDb.setResults([]);

		await service.getSecurityEvents('user-123', 10);

		expect(mockDb.limit).toHaveBeenCalledWith(10);
	});

	it('should return empty array when no events exist', async () => {
		mockDb.setResults([]);

		const result = await service.getSecurityEvents('user-123');

		expect(result).toEqual([]);
	});
});
