import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceAuthGuard } from './service-auth.guard';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('ServiceAuthGuard', () => {
	let guard: ServiceAuthGuard;
	let configService: jest.Mocked<ConfigService>;

	const mockConfigService = {
		get: jest.fn(),
	};

	const mockSupabaseClient = {
		from: jest.fn().mockReturnThis(),
		select: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
	};

	const createMockExecutionContext = (headers: any = {}): ExecutionContext =>
		({
			switchToHttp: () => ({
				getRequest: () => ({
					headers,
				}),
			}),
		}) as ExecutionContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ServiceAuthGuard,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		guard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
		configService = module.get(ConfigService);

		(createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should return true for valid MEMORO_SUPABASE_SERVICE_KEY', async () => {
			const serviceKey = 'valid-memoro-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return serviceKey;
				if (key === 'SUPABASE_SERVICE_KEY') return 'other-key';
				if (key === 'MEMORO_SUPABASE_URL') return 'https://example.supabase.co';
				return null;
			});

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`,
			});

			const request = context.switchToHttp().getRequest();
			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.isServiceAuth).toBe(true);
			expect(request.serviceKey).toBe(serviceKey);
		});

		it('should return true for valid SUPABASE_SERVICE_KEY', async () => {
			const serviceKey = 'valid-supabase-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return 'other-key';
				if (key === 'SUPABASE_SERVICE_KEY') return serviceKey;
				if (key === 'MEMORO_SUPABASE_URL') return 'https://example.supabase.co';
				return null;
			});

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`,
			});

			const request = context.switchToHttp().getRequest();
			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.isServiceAuth).toBe(true);
			expect(request.serviceKey).toBe(serviceKey);
		});

		it('should validate token with Supabase when not matching config keys', async () => {
			const serviceKey = 'unknown-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return 'memoro-key';
				if (key === 'SUPABASE_SERVICE_KEY') return 'supabase-key';
				if (key === 'MEMORO_SUPABASE_URL') return 'https://example.supabase.co';
				return null;
			});

			mockSupabaseClient.limit.mockResolvedValue({ error: null });

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`,
			});

			const request = context.switchToHttp().getRequest();
			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(createClient).toHaveBeenCalledWith(
				'https://example.supabase.co',
				serviceKey,
				expect.any(Object)
			);
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('memos');
			expect(mockSupabaseClient.select).toHaveBeenCalledWith('id');
			expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
			expect(request.isServiceAuth).toBe(true);
			expect(request.serviceKey).toBe(serviceKey);
		});

		it('should throw UnauthorizedException when no authorization header', async () => {
			const context = createMockExecutionContext({});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('No authorization header provided')
			);
		});

		it('should throw UnauthorizedException for invalid token type', async () => {
			const context = createMockExecutionContext({
				authorization: 'Basic invalidtoken',
			});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('Invalid token type')
			);
		});

		it('should throw UnauthorizedException when no token provided', async () => {
			const context = createMockExecutionContext({
				authorization: 'Bearer ',
			});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('No token provided')
			);
		});

		it('should throw UnauthorizedException when Supabase validation fails', async () => {
			const serviceKey = 'invalid-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return 'memoro-key';
				if (key === 'SUPABASE_SERVICE_KEY') return 'supabase-key';
				if (key === 'MEMORO_SUPABASE_URL') return 'https://example.supabase.co';
				return null;
			});

			mockSupabaseClient.limit.mockResolvedValue({
				error: { message: 'Invalid service key', code: 'PGRST301' },
			});

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`,
			});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('Invalid service key')
			);
		});

		it('should throw UnauthorizedException when Supabase client throws error', async () => {
			const serviceKey = 'error-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return 'memoro-key';
				if (key === 'SUPABASE_SERVICE_KEY') return 'supabase-key';
				if (key === 'MEMORO_SUPABASE_URL') return 'https://example.supabase.co';
				return null;
			});

			mockSupabaseClient.limit.mockRejectedValue(new Error('Network error'));

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`,
			});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('Invalid service key')
			);
		});

		it('should handle edge case with empty Bearer token', async () => {
			const context = createMockExecutionContext({
				authorization: 'Bearer',
			});

			await expect(guard.canActivate(context)).rejects.toThrow(
				new UnauthorizedException('No token provided')
			);
		});

		it('should handle multiple spaces in authorization header', async () => {
			const serviceKey = 'valid-memoro-service-key';
			mockConfigService.get.mockImplementation((key: string) => {
				if (key === 'MEMORO_SUPABASE_SERVICE_KEY') return serviceKey;
				return null;
			});

			const context = createMockExecutionContext({
				authorization: `Bearer ${serviceKey}`, // Normal spacing
			});

			const request = context.switchToHttp().getRequest();
			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.isServiceAuth).toBe(true);
		});
	});
});
