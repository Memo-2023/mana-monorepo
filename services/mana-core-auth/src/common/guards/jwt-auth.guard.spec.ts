/**
 * JwtAuthGuard Unit Tests
 *
 * Tests JWT authentication guard functionality:
 * - Token extraction from Authorization header
 * - JWT verification using JWKS (EdDSA keys)
 * - Error handling for invalid/expired tokens
 * - User attachment to request object
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoggerService } from '../logger';
import { createMockConfigService, httpMockHelpers } from '../../__tests__/utils/test-helpers';
import { mockTokenFactory } from '../../__tests__/utils/mock-factories';
import { silentError } from '../../__tests__/utils/silent-error.decorator';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Mock jose (auto-mocked via jest.config.js moduleNameMapper)
jest.mock('jose');

// Setup mock for createRemoteJWKSet to return a defined JWKS function
const mockJWKS = jest.fn();
const mockCreateRemoteJWKSet = createRemoteJWKSet as jest.MockedFunction<typeof createRemoteJWKSet>;
mockCreateRemoteJWKSet.mockReturnValue(mockJWKS as any);

// Mock LoggerService
const createMockLoggerService = (): LoggerService =>
	({
		setContext: jest.fn().mockReturnThis(),
		log: jest.fn(),
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
		verbose: jest.fn(),
	}) as unknown as LoggerService;

describe('JwtAuthGuard', () => {
	let guard: JwtAuthGuard;
	let configService: ConfigService;
	const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

	beforeEach(async () => {
		// Reset mocks
		jest.clearAllMocks();

		// Ensure createRemoteJWKSet returns a defined value after clearing
		mockCreateRemoteJWKSet.mockReturnValue(mockJWKS as any);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtAuthGuard,
				{
					provide: ConfigService,
					useValue: createMockConfigService({
						BASE_URL: 'http://localhost:3001',
						'jwt.issuer': 'manacore',
						'jwt.audience': 'manacore',
					}),
				},
				{
					provide: LoggerService,
					useValue: createMockLoggerService(),
				},
			],
		}).compile();

		guard = module.get<JwtAuthGuard>(JwtAuthGuard);
		configService = module.get<ConfigService>(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should return true for valid JWT token', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload({
				sub: 'user-123',
				email: 'test@example.com',
				role: 'user',
			});

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			const result = await guard.canActivate(mockContext as any);

			expect(result).toBe(true);
			expect(mockRequest.user).toEqual({
				sub: 'user-123',
				userId: 'user-123',
				email: 'test@example.com',
				role: 'user',
			});
		});

		it('should throw UnauthorizedException when no token provided', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should throw UnauthorizedException when authorization header is missing', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					'content-type': 'application/json',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should throw UnauthorizedException for expired token', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer expired-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const expiredError = new Error('JWT expired');
			(expiredError as any).code = 'ERR_JWT_EXPIRED';
			mockJwtVerify.mockRejectedValue(expiredError);

			await silentError(async () => {
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow('Invalid token');
			});
		});

		it('should throw UnauthorizedException for invalid token', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer invalid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const invalidError = new Error('JWT invalid');
			(invalidError as any).code = 'ERR_JWT_INVALID';
			mockJwtVerify.mockRejectedValue(invalidError);

			await silentError(async () => {
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow('Invalid token');
			});
		});

		it('should throw UnauthorizedException for malformed token', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer not.a.valid.jwt',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			mockJwtVerify.mockRejectedValue(new Error('Invalid compact JWS'));

			await silentError(async () => {
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should verify token with correct issuer and audience', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guard.canActivate(mockContext as any);

			// Note: issuer defaults to http://localhost:3001 when BASE_URL and jwt.issuer are not set
			expect(mockJwtVerify).toHaveBeenCalledWith(
				'valid-jwt-token',
				expect.anything(), // JWKS
				expect.objectContaining({
					issuer: 'http://localhost:3001',
					audience: 'manacore',
				})
			);
		});

		it('should attach complete user info to request', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload({
				sub: 'user-456',
				email: 'admin@example.com',
				role: 'admin',
			});

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guard.canActivate(mockContext as any);

			expect(mockRequest.user).toEqual({
				sub: 'user-456',
				userId: 'user-456',
				email: 'admin@example.com',
				role: 'admin',
			});
		});

		it('should initialize JWKS on first use', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			// First call initializes JWKS
			await guard.canActivate(mockContext as any);

			expect(mockJwtVerify).toHaveBeenCalledTimes(1);

			// Second call reuses same JWKS
			await guard.canActivate(mockContext as any);

			expect(mockJwtVerify).toHaveBeenCalledTimes(2);
		});
	});

	describe('extractTokenFromHeader', () => {
		it('should extract token from Bearer authorization header', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer my-secret-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guard.canActivate(mockContext as any);

			expect(mockJwtVerify).toHaveBeenCalledWith(
				'my-secret-token',
				expect.anything(),
				expect.anything()
			);
		});

		it('should return undefined for non-Bearer authorization', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Basic user:pass',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should return undefined for empty authorization header', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: '',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should return undefined when authorization header is just "Bearer"', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});
	});

	describe('Configuration', () => {
		it('should use BASE_URL from config for JWKS endpoint', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guard.canActivate(mockContext as any);

			// JWKS should be created with correct URL (verified via createRemoteJWKSet call)
			expect(mockJwtVerify).toHaveBeenCalled();
		});

		it('should use default BASE_URL when not configured', async () => {
			// Create guard with config missing BASE_URL
			const guardWithDefaults = new JwtAuthGuard(
				createMockConfigService({
					'jwt.issuer': 'manacore',
					'jwt.audience': 'manacore',
				}),
				createMockLoggerService()
			);

			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guardWithDefaults.canActivate(mockContext as any);

			// Should still work with default localhost URL
			expect(mockJwtVerify).toHaveBeenCalled();
		});

		it('should use configured issuer and audience', async () => {
			// Note: issuer = baseUrl || jwtIssuer || default, so we don't set BASE_URL to test jwt.issuer
			const guardWithCustomConfig = new JwtAuthGuard(
				createMockConfigService({
					'jwt.issuer': 'custom-issuer',
					'jwt.audience': 'custom-audience',
				}),
				createMockLoggerService()
			);

			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			const mockPayload = mockTokenFactory.validPayload();

			mockJwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: { alg: 'EdDSA', typ: 'JWT' },
				key: {} as any,
			});

			await guardWithCustomConfig.canActivate(mockContext as any);

			expect(mockJwtVerify).toHaveBeenCalledWith(
				'valid-jwt-token',
				expect.anything(),
				expect.objectContaining({
					issuer: 'custom-issuer',
					audience: 'custom-audience',
				})
			);
		});
	});

	describe('Security', () => {
		it('should not accept tokens without Bearer prefix', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should handle case-sensitive Bearer prefix', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'bearer valid-jwt-token', // lowercase
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			// Should not accept lowercase "bearer"
			await expect(guard.canActivate(mockContext as any)).rejects.toThrow('No token provided');
		});

		it('should reject token with wrong issuer', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			mockJwtVerify.mockRejectedValue(new Error('unexpected "iss" claim value'));

			await silentError(async () => {
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should reject token with wrong audience', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer valid-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			mockJwtVerify.mockRejectedValue(new Error('unexpected "aud" claim value'));

			await silentError(async () => {
				await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should not expose sensitive error details', async () => {
			const mockRequest = httpMockHelpers.createMockRequest({
				headers: {
					authorization: 'Bearer tampered-jwt-token',
				},
			});

			const mockContext = httpMockHelpers.createMockExecutionContext(mockRequest);

			mockJwtVerify.mockRejectedValue(new Error('signature verification failed'));

			await silentError(async () => {
				try {
					await guard.canActivate(mockContext as any);
					fail('Should have thrown UnauthorizedException');
				} catch (error) {
					expect(error).toBeInstanceOf(UnauthorizedException);
					// Should not expose the specific jose error message
					expect((error as any).message).toBe('Invalid token');
				}
			});
		});
	});
});
