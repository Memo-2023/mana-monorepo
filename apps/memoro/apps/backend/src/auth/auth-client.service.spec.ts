import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';
import { UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('AuthClientService', () => {
	let service: AuthClientService;
	let httpService: jest.Mocked<HttpService>;
	let configService: jest.Mocked<ConfigService>;

	const mockHttpService = {
		post: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	const authServiceUrl = 'http://localhost:3000';
	const memoroAppId = 'test-app-id';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthClientService,
				{
					provide: HttpService,
					useValue: mockHttpService,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<AuthClientService>(AuthClientService);
		httpService = module.get(HttpService);
		configService = module.get(ConfigService);

		// Clear and reset all mocks first
		mockConfigService.get.mockClear();
		mockHttpService.post.mockClear();

		// Setup default config values
		mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
			switch (key) {
				case 'MANA_SERVICE_URL':
					return authServiceUrl;
				case 'MEMORO_APP_ID':
					return memoroAppId;
				default:
					return defaultValue;
			}
		});

		// Reset console.log mock
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with config values', () => {
			expect(service).toBeDefined();
			expect(configService.get).toHaveBeenCalledWith('MANA_SERVICE_URL', 'http://localhost:3000');
			expect(configService.get).toHaveBeenCalledWith(
				'MEMORO_APP_ID',
				'973da0c1-b479-4dac-a1b0-ed09c72caca8'
			);
		});

		it('should use default values when config not provided', async () => {
			mockConfigService.get.mockReturnValue(undefined);

			const module: TestingModule = await Test.createTestingModule({
				providers: [
					AuthClientService,
					{
						provide: HttpService,
						useValue: mockHttpService,
					},
					{
						provide: ConfigService,
						useValue: mockConfigService,
					},
				],
			}).compile();

			const serviceWithDefaults = module.get<AuthClientService>(AuthClientService);
			expect(serviceWithDefaults).toBeDefined();
		});
	});

	describe('validateToken', () => {
		it('should validate token successfully', async () => {
			const token = 'valid-token';
			const expectedUser = {
				id: 'user-123',
				email: 'test@test.com',
				role: 'user',
			};
			const axiosResponse: AxiosResponse = {
				data: {
					valid: true,
					user: expectedUser,
				},
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.validateToken(token);

			expect(console.log).toHaveBeenCalledWith(
				'Calling: ',
				`${authServiceUrl}/auth/validate?appId=${memoroAppId}`
			);
			expect(console.log).toHaveBeenCalledWith('Memoro App ID: ', memoroAppId);
			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/validate?appId=${memoroAppId}`,
				{ appToken: token },
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			expect(result).toEqual(expectedUser);
		});

		it('should throw UnauthorizedException for invalid token', async () => {
			const token = 'invalid-token';
			const axiosError: AxiosError = {
				response: {
					data: { message: 'Invalid token' },
					status: 401,
					statusText: 'Unauthorized',
					headers: {},
					config: {} as any,
				},
				config: {} as any,
				isAxiosError: true,
				toJSON: () => ({}),
				name: 'AxiosError',
				message: 'Request failed',
			};

			mockHttpService.post.mockReturnValue(throwError(() => axiosError));

			await expect(service.validateToken(token)).rejects.toThrow(
				new UnauthorizedException('Invalid token')
			);
		});

		it('should throw UnauthorizedException when response is not valid', async () => {
			const token = 'token';
			const axiosResponse: AxiosResponse = {
				data: {
					valid: false,
				},
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			await expect(service.validateToken(token)).rejects.toThrow(
				new UnauthorizedException('Invalid token')
			);
		});

		it('should throw UnauthorizedException when user is missing', async () => {
			const token = 'token';
			const axiosResponse: AxiosResponse = {
				data: {
					valid: true,
					user: null,
				},
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			await expect(service.validateToken(token)).rejects.toThrow(
				new UnauthorizedException('Invalid token')
			);
		});

		it('should handle network errors', async () => {
			const token = 'token';
			const error = new Error('Network error');

			mockHttpService.post.mockReturnValue(throwError(() => error));

			await expect(service.validateToken(token)).rejects.toThrow(
				new UnauthorizedException('Invalid token')
			);
		});

		it('should handle unexpected errors', async () => {
			const token = 'token';

			mockHttpService.post.mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			await expect(service.validateToken(token)).rejects.toThrow(
				new UnauthorizedException('Invalid token')
			);
		});
	});

	describe('refreshToken', () => {
		it('should refresh token successfully', async () => {
			const refreshToken = 'valid-refresh-token';
			const expectedResponse = {
				appToken: 'new-app-token',
				refreshToken: 'new-refresh-token',
			};
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.refreshToken(refreshToken);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/refresh`,
				{ refreshToken, appId: memoroAppId },
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			expect(result).toEqual(expectedResponse);
		});

		it('should throw UnauthorizedException for invalid refresh token', async () => {
			const refreshToken = 'invalid-refresh-token';
			const axiosError: AxiosError = {
				response: {
					data: { message: 'Invalid refresh token' },
					status: 401,
					statusText: 'Unauthorized',
					headers: {},
					config: {} as any,
				},
				config: {} as any,
				isAxiosError: true,
				toJSON: () => ({}),
				name: 'AxiosError',
				message: 'Request failed',
			};

			mockHttpService.post.mockReturnValue(throwError(() => axiosError));

			await expect(service.refreshToken(refreshToken)).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token')
			);
		});

		it('should handle network errors during refresh', async () => {
			const refreshToken = 'refresh-token';
			const error = new Error('Network error');

			mockHttpService.post.mockReturnValue(throwError(() => error));

			await expect(service.refreshToken(refreshToken)).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token')
			);
		});

		it('should handle unexpected errors during refresh', async () => {
			const refreshToken = 'refresh-token';

			mockHttpService.post.mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			await expect(service.refreshToken(refreshToken)).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token')
			);
		});

		it('should handle timeout errors', async () => {
			const refreshToken = 'refresh-token';
			const axiosError: AxiosError = {
				code: 'ECONNABORTED',
				config: {} as any,
				isAxiosError: true,
				toJSON: () => ({}),
				name: 'AxiosError',
				message: 'Timeout',
			};

			mockHttpService.post.mockReturnValue(throwError(() => axiosError));

			await expect(service.refreshToken(refreshToken)).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token')
			);
		});
	});
});
