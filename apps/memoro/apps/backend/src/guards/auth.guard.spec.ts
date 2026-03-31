import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthClientService } from '../auth/auth-client.service';
import { JwtPayload } from '../types/jwt-payload.interface';

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let authClientService: jest.Mocked<AuthClientService>;

	const mockJwtPayload: JwtPayload = {
		sub: 'user-123',
		email: 'test@example.com',
		role: 'authenticated',
		app_id: 'test-app',
		aud: 'authenticated',
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600,
	};

	const mockToken = 'mock-jwt-token';

	const createMockExecutionContext = (headers: Record<string, string> = {}) => {
		const request = {
			headers,
			user: undefined,
			token: undefined,
		};

		return {
			switchToHttp: () => ({
				getRequest: () => request,
			}),
			getRequest: () => request, // Helper method to get request in tests
		} as any;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthGuard,
				{
					provide: AuthClientService,
					useValue: {
						validateToken: jest.fn(),
					},
				},
			],
		}).compile();

		guard = module.get<AuthGuard>(AuthGuard);
		authClientService = module.get(AuthClientService);
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	describe('canActivate', () => {
		it('should return true and attach user/token to request when token is valid', async () => {
			const mockContext = createMockExecutionContext({
				authorization: `Bearer ${mockToken}`,
			});

			authClientService.validateToken.mockResolvedValue(mockJwtPayload);

			const result = await guard.canActivate(mockContext);
			const request = mockContext.getRequest();

			expect(result).toBe(true);
			expect(authClientService.validateToken).toHaveBeenCalledWith(mockToken);
			expect(request.user).toEqual(mockJwtPayload);
			expect(request.token).toBe(mockToken);
		});

		it('should throw UnauthorizedException when no authorization header is provided', async () => {
			const mockContext = createMockExecutionContext({});

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(
				'No authorization header provided'
			);
		});

		it('should throw UnauthorizedException when authorization header is empty', async () => {
			const mockContext = createMockExecutionContext({
				authorization: '',
			});

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException when token type is not Bearer', async () => {
			const mockContext = createMockExecutionContext({
				authorization: `Basic ${mockToken}`,
			});

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			await expect(guard.canActivate(mockContext)).rejects.toThrow('Invalid token type');
		});

		it('should throw UnauthorizedException when no token is provided after Bearer', async () => {
			const mockContext = createMockExecutionContext({
				authorization: 'Bearer',
			});

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			await expect(guard.canActivate(mockContext)).rejects.toThrow('No token provided');
		});

		it('should throw UnauthorizedException when token is only whitespace', async () => {
			const mockContext = createMockExecutionContext({
				authorization: 'Bearer   ',
			});

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			await expect(guard.canActivate(mockContext)).rejects.toThrow('No token provided');
		});

		it('should throw UnauthorizedException when token validation fails', async () => {
			const mockContext = createMockExecutionContext({
				authorization: `Bearer ${mockToken}`,
			});

			authClientService.validateToken.mockRejectedValue(new Error('Token validation failed'));

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			await expect(guard.canActivate(mockContext)).rejects.toThrow('Invalid token');
		});

		it('should handle various token validation errors', async () => {
			const mockContext = createMockExecutionContext({
				authorization: `Bearer ${mockToken}`,
			});

			const testCases = [
				{ error: new Error('Token expired'), message: 'Invalid token' },
				{ error: new Error('Invalid signature'), message: 'Invalid token' },
				{ error: new UnauthorizedException('Custom auth error'), message: 'Invalid token' },
			];

			for (const testCase of testCases) {
				authClientService.validateToken.mockRejectedValue(testCase.error);

				await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

				await expect(guard.canActivate(mockContext)).rejects.toThrow(testCase.message);
			}
		});

		it('should handle malformed authorization headers gracefully', async () => {
			const testCases = [
				'Bearer',
				'Bearer ',
				'Bearer  ',
				'BearerToken',
				'Token ' + mockToken,
				'  Bearer ' + mockToken,
				'Bearer ' + mockToken + ' extra',
			];

			for (const authHeader of testCases) {
				const mockContext = createMockExecutionContext({
					authorization: authHeader,
				});

				if (authHeader.trim().startsWith('Bearer ') && authHeader.split(' ')[1]?.trim()) {
					authClientService.validateToken.mockResolvedValue(mockJwtPayload);
					const result = await guard.canActivate(mockContext);
					expect(result).toBe(true);
				} else {
					await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
				}
			}
		});

		it('should preserve original request properties when attaching user and token', async () => {
			const originalRequest = {
				headers: {
					authorization: `Bearer ${mockToken}`,
					'content-type': 'application/json',
				},
				body: { data: 'test' },
				params: { id: '123' },
				query: { filter: 'active' },
			};

			const mockContext = {
				switchToHttp: () => ({
					getRequest: () => originalRequest,
				}),
			} as ExecutionContext;

			authClientService.validateToken.mockResolvedValue(mockJwtPayload);

			await guard.canActivate(mockContext);

			expect(originalRequest.headers).toEqual({
				authorization: `Bearer ${mockToken}`,
				'content-type': 'application/json',
			});
			expect(originalRequest.body).toEqual({ data: 'test' });
			expect(originalRequest.params).toEqual({ id: '123' });
			expect(originalRequest.query).toEqual({ filter: 'active' });
			expect((originalRequest as any).user).toEqual(mockJwtPayload);
			expect((originalRequest as any).token).toBe(mockToken);
		});

		it('should log error details when token validation fails', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			const mockContext = createMockExecutionContext({
				authorization: `Bearer ${mockToken}`,
			});

			const validationError = new Error('Token signature invalid');
			authClientService.validateToken.mockRejectedValue(validationError);

			await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);

			expect(consoleSpy).toHaveBeenCalledWith('Auth error:', 'Token signature invalid');

			consoleSpy.mockRestore();
		});
	});
});
