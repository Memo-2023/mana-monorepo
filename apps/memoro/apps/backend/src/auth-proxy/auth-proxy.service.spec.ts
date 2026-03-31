import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthProxyService } from './auth-proxy.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

describe('AuthProxyService', () => {
	let service: AuthProxyService;
	let httpService: jest.Mocked<HttpService>;
	let configService: jest.Mocked<ConfigService>;

	const mockHttpService = {
		post: jest.fn(),
		get: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn(),
	};

	const authServiceUrl = 'http://localhost:3000';
	const memoroAppId = 'test-app-id';

	beforeEach(async () => {
		// Reset mocks
		mockConfigService.get.mockReset();
		mockHttpService.post.mockReset();
		mockHttpService.get.mockReset();

		// Setup config mock
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

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthProxyService,
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

		service = module.get<AuthProxyService>(AuthProxyService);
		httpService = module.get(HttpService);
		configService = module.get(ConfigService);

		// Mock console methods to avoid test output noise
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('signin', () => {
		it('should forward signin request to auth service', async () => {
			const payload = { email: 'test@test.com', password: 'password' };
			const expectedResponse = { token: 'token', user: { id: '123' } };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.signin(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/signin?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});

		it('should handle signin errors', async () => {
			const payload = { email: 'test@test.com', password: 'wrong' };
			const error: AxiosError = {
				response: {
					data: { message: 'Invalid credentials' },
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

			mockHttpService.post.mockReturnValue(throwError(() => error));

			await expect(service.signin(payload)).rejects.toThrow();
		});
	});

	describe('signup', () => {
		it('should forward signup request to auth service', async () => {
			const payload = { email: 'test@test.com', password: 'password' };
			const expectedResponse = { user: { id: '123' } };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 201,
				statusText: 'Created',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.signup(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/signup?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('googleSignin', () => {
		it('should forward google signin request to auth service', async () => {
			const payload = { idToken: 'google-token' };
			const expectedResponse = { token: 'token', user: { id: '123' } };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.googleSignin(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/google-signin?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('appleSignin', () => {
		it('should forward apple signin request to auth service', async () => {
			const payload = { idToken: 'apple-token' };
			const expectedResponse = { token: 'token', user: { id: '123' } };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.appleSignin(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/apple-signin?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('refresh', () => {
		it('should forward refresh request to auth service with deviceInfo', async () => {
			const payload = {
				refreshToken: 'refresh-token',
				deviceInfo: {
					platform: 'ios',
					deviceId: 'device-123',
					appVersion: '1.0.0',
				},
			};
			const expectedResponse = { token: 'new-token', refreshToken: 'new-refresh' };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.refresh(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/refresh?appId=${memoroAppId}`,
				{
					refreshToken: 'refresh-token',
					appId: memoroAppId,
					deviceInfo: payload.deviceInfo,
				},
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});

		it('should throw BadRequestException when deviceInfo is missing', async () => {
			const payload = { refreshToken: 'refresh-token' };

			await expect(service.refresh(payload)).rejects.toThrow(
				'Device info is required for token refresh'
			);
			expect(httpService.post).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when refreshToken is missing', async () => {
			const payload = {
				deviceInfo: {
					platform: 'ios',
					deviceId: 'device-123',
				},
			};

			await expect(service.refresh(payload)).rejects.toThrow('Refresh token is required');
			expect(httpService.post).not.toHaveBeenCalled();
		});
	});

	describe('logout', () => {
		it('should forward logout request to auth service', async () => {
			const payload = { token: 'token' };
			const axiosResponse: AxiosResponse = {
				data: null,
				status: 204,
				statusText: 'No Content',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.logout(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/logout?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toBeNull();
		});
	});

	describe('forgotPassword', () => {
		it('should forward forgot password request to auth service', async () => {
			const payload = { email: 'test@test.com' };
			const expectedResponse = { message: 'Password reset email sent' };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.forgotPassword(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/forgot-password?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('validate', () => {
		it('should forward validate request to auth service', async () => {
			const payload = { token: 'token' };
			const expectedResponse = { valid: true, user: { id: '123' } };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.post.mockReturnValue(of(axiosResponse));

			const result = await service.validate(payload);

			expect(httpService.post).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/validate?appId=${memoroAppId}`,
				payload,
				expect.any(Object)
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('getCredits', () => {
		it('should forward get credits request to auth service', async () => {
			const authorization = 'Bearer token';
			const expectedResponse = { credits: 100 };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.get.mockReturnValue(of(axiosResponse));

			const result = await service.getCredits(authorization);

			expect(httpService.get).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/credits?appId=${memoroAppId}`,
				{
					headers: {
						Authorization: authorization,
					},
				}
			);
			expect(result).toEqual(expectedResponse);
		});

		it('should handle get credits errors', async () => {
			const authorization = 'Bearer invalid';
			const error: AxiosError = {
				response: {
					data: { message: 'Unauthorized' },
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

			mockHttpService.get.mockReturnValue(throwError(() => error));

			await expect(service.getCredits(authorization)).rejects.toThrow();
		});
	});

	describe('getDevices', () => {
		it('should forward get devices request to auth service', async () => {
			const authorization = 'Bearer token';
			const expectedResponse = { devices: [{ id: 'device-1' }] };
			const axiosResponse: AxiosResponse = {
				data: expectedResponse,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as any,
			};

			mockHttpService.get.mockReturnValue(of(axiosResponse));

			const result = await service.getDevices(authorization);

			expect(httpService.get).toHaveBeenCalledWith(
				`${authServiceUrl}/auth/devices?appId=${memoroAppId}`,
				{
					headers: {
						Authorization: authorization,
					},
				}
			);
			expect(result).toEqual(expectedResponse);
		});
	});
});
