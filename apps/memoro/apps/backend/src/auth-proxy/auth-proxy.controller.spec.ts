import { Test, TestingModule } from '@nestjs/testing';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthProxyController', () => {
	let controller: AuthProxyController;
	let service: jest.Mocked<AuthProxyService>;

	const mockAuthProxyService = {
		signin: jest.fn(),
		signup: jest.fn(),
		googleSignin: jest.fn(),
		appleSignin: jest.fn(),
		refresh: jest.fn(),
		logout: jest.fn(),
		forgotPassword: jest.fn(),
		validate: jest.fn(),
		getCredits: jest.fn(),
		getDevices: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthProxyController],
			providers: [
				{
					provide: AuthProxyService,
					useValue: mockAuthProxyService,
				},
			],
		}).compile();

		controller = module.get<AuthProxyController>(AuthProxyController);
		service = module.get(AuthProxyService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('signin', () => {
		it('should call authProxyService.signin with payload', async () => {
			const payload = { email: 'test@test.com', password: 'password' };
			const expectedResult = { token: 'token', user: { id: '123' } };

			mockAuthProxyService.signin.mockResolvedValue(expectedResult);

			const result = await controller.signin(payload);

			expect(service.signin).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});

		it('should handle service errors', async () => {
			const payload = { email: 'test@test.com', password: 'password' };
			const error = new Error('Service error');

			mockAuthProxyService.signin.mockRejectedValue(error);

			await expect(controller.signin(payload)).rejects.toThrow(error);
		});
	});

	describe('signup', () => {
		it('should call authProxyService.signup with payload', async () => {
			const payload = { email: 'test@test.com', password: 'password' };
			const expectedResult = { user: { id: '123' } };

			mockAuthProxyService.signup.mockResolvedValue(expectedResult);

			const result = await controller.signup(payload);

			expect(service.signup).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('googleSignin', () => {
		it('should call authProxyService.googleSignin with payload', async () => {
			const payload = { idToken: 'google-token' };
			const expectedResult = { token: 'token', user: { id: '123' } };

			mockAuthProxyService.googleSignin.mockResolvedValue(expectedResult);

			const result = await controller.googleSignin(payload);

			expect(service.googleSignin).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('appleSignin', () => {
		it('should call authProxyService.appleSignin with payload', async () => {
			const payload = { idToken: 'apple-token' };
			const expectedResult = { token: 'token', user: { id: '123' } };

			mockAuthProxyService.appleSignin.mockResolvedValue(expectedResult);

			const result = await controller.appleSignin(payload);

			expect(service.appleSignin).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('refresh', () => {
		it('should call authProxyService.refresh with payload', async () => {
			const payload = { refreshToken: 'refresh-token' };
			const expectedResult = { token: 'new-token', refreshToken: 'new-refresh' };

			mockAuthProxyService.refresh.mockResolvedValue(expectedResult);

			const result = await controller.refresh(payload);

			expect(service.refresh).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('logout', () => {
		it('should call authProxyService.logout with payload', async () => {
			const payload = { token: 'token' };

			mockAuthProxyService.logout.mockResolvedValue(undefined);

			const result = await controller.logout(payload);

			expect(service.logout).toHaveBeenCalledWith(payload);
			expect(result).toBeUndefined();
		});

		it('should have HttpCode 204', async () => {
			const metadata = Reflect.getMetadata('__httpCode__', controller.logout);
			expect(metadata).toBe(204);
		});
	});

	describe('forgotPassword', () => {
		it('should call authProxyService.forgotPassword with payload', async () => {
			const payload = { email: 'test@test.com' };
			const expectedResult = { message: 'Password reset email sent' };

			mockAuthProxyService.forgotPassword.mockResolvedValue(expectedResult);

			const result = await controller.forgotPassword(payload);

			expect(service.forgotPassword).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('validate', () => {
		it('should call authProxyService.validate with payload', async () => {
			const payload = { token: 'token' };
			const expectedResult = { valid: true, user: { id: '123' } };

			mockAuthProxyService.validate.mockResolvedValue(expectedResult);

			const result = await controller.validate(payload);

			expect(service.validate).toHaveBeenCalledWith(payload);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('getCredits', () => {
		it('should call authProxyService.getCredits with authorization header', async () => {
			const authorization = 'Bearer token';
			const expectedResult = { credits: 100 };

			mockAuthProxyService.getCredits.mockResolvedValue(expectedResult);

			const result = await controller.getCredits(authorization);

			expect(service.getCredits).toHaveBeenCalledWith(authorization);
			expect(result).toEqual(expectedResult);
		});

		it('should throw UnauthorizedException when no authorization header', async () => {
			await expect(controller.getCredits(undefined)).rejects.toThrow(
				new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED)
			);
			expect(service.getCredits).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when empty authorization header', async () => {
			await expect(controller.getCredits('')).rejects.toThrow(
				new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED)
			);
			expect(service.getCredits).not.toHaveBeenCalled();
		});
	});

	describe('getDevices', () => {
		it('should call authProxyService.getDevices with authorization header', async () => {
			const authorization = 'Bearer token';
			const expectedResult = { devices: [{ id: 'device-1' }] };

			mockAuthProxyService.getDevices.mockResolvedValue(expectedResult);

			const result = await controller.getDevices(authorization);

			expect(service.getDevices).toHaveBeenCalledWith(authorization);
			expect(result).toEqual(expectedResult);
		});

		it('should throw UnauthorizedException when no authorization header', async () => {
			await expect(controller.getDevices(undefined)).rejects.toThrow(
				new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED)
			);
			expect(service.getDevices).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when empty authorization header', async () => {
			await expect(controller.getDevices('')).rejects.toThrow(
				new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED)
			);
			expect(service.getDevices).not.toHaveBeenCalled();
		});
	});
});
