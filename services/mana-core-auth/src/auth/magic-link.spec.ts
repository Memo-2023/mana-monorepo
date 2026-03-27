/**
 * Magic Link Passthrough Unit Tests
 *
 * Tests that the BetterAuthPassthroughController has the magic link
 * handler method and that it delegates to forwardToBetterAuth.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BetterAuthPassthroughController } from './better-auth-passthrough.controller';
import { BetterAuthService } from './services/better-auth.service';
import { LoggerService } from '../common/logger';

describe('BetterAuthPassthroughController - Magic Link', () => {
	let controller: BetterAuthPassthroughController;
	let betterAuthService: jest.Mocked<BetterAuthService>;

	const mockBetterAuthService = {
		getHandler: jest.fn(),
		verifyEmail: jest.fn(),
		getSourceAppUrl: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn((key: string) => {
			const config: Record<string, string> = {
				BASE_URL: 'http://localhost:3001',
			};
			return config[key] || '';
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
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BetterAuthPassthroughController],
			providers: [
				{ provide: BetterAuthService, useValue: mockBetterAuthService },
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: LoggerService, useValue: mockLoggerService },
			],
		}).compile();

		controller = module.get<BetterAuthPassthroughController>(BetterAuthPassthroughController);
		betterAuthService = module.get(BetterAuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// Magic Link Handler Existence
	// ============================================================================

	describe('handleMagicLink', () => {
		it('should have handleMagicLink method defined', () => {
			expect(controller.handleMagicLink).toBeDefined();
			expect(typeof controller.handleMagicLink).toBe('function');
		});

		it('should call forwardToBetterAuth and delegate to Better Auth handler', async () => {
			const mockResponse = new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			});

			const mockHandler = jest.fn().mockResolvedValue(mockResponse);
			betterAuthService.getHandler.mockReturnValue(mockHandler);

			const mockReq = {
				method: 'POST',
				originalUrl: '/api/auth/magic-link/send-magic-link',
				headers: { 'content-type': 'application/json' },
				body: { email: 'test@example.com' },
			} as any;

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				setHeader: jest.fn().mockReturnThis(),
				append: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			} as any;

			await controller.handleMagicLink(mockReq, mockRes);

			expect(betterAuthService.getHandler).toHaveBeenCalled();
			expect(mockHandler).toHaveBeenCalled();
		});

		it('should return 500 on internal error', async () => {
			betterAuthService.getHandler.mockImplementation(() => {
				throw new Error('Handler unavailable');
			});

			const mockReq = {
				method: 'POST',
				originalUrl: '/api/auth/magic-link/send-magic-link',
				headers: {},
				body: {},
			} as any;

			const mockRes = {
				status: jest.fn().mockReturnThis(),
				setHeader: jest.fn().mockReturnThis(),
				append: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			} as any;

			await controller.handleMagicLink(mockReq, mockRes);

			expect(mockRes.status).toHaveBeenCalledWith(500);
			expect(mockRes.json).toHaveBeenCalledWith({ error: 'Magic link request failed' });
		});
	});

	// ============================================================================
	// Route Metadata
	// ============================================================================

	describe('Route metadata', () => {
		it('should have @All decorator on handleMagicLink for magic-link/* routes', () => {
			const routePath = Reflect.getMetadata(
				'path',
				BetterAuthPassthroughController.prototype.handleMagicLink
			);
			expect(routePath).toBe('magic-link/*');
		});
	});
});
