/**
 * AuthController Passkey + 2FA Unit Tests
 *
 * Tests all passkey (WebAuthn) endpoints on the AuthController:
 *
 * - POST /auth/passkeys/register/options - Generate registration options
 * - POST /auth/passkeys/register/verify - Verify and store passkey
 * - POST /auth/passkeys/authenticate/options - Generate auth options (public)
 * - POST /auth/passkeys/authenticate/verify - Verify and return JWT tokens
 * - GET /auth/passkeys - List user's passkeys
 * - DELETE /auth/passkeys/:id - Delete a passkey
 * - PATCH /auth/passkeys/:id - Rename a passkey
 *
 * Also tests 2FA-related behavior in signIn.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';
import { PasskeyService } from './services/passkey.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SecurityEventsService, SecurityEventType, AccountLockoutService } from '../security';

describe('AuthController - Passkey Endpoints', () => {
	let controller: AuthController;
	let passkeyService: jest.Mocked<PasskeyService>;
	let betterAuthService: jest.Mocked<BetterAuthService>;
	let securityEventsService: jest.Mocked<SecurityEventsService>;

	const mockUser = { userId: 'user-123', email: 'test@example.com', role: 'user' };
	const mockReq = {
		headers: { 'user-agent': 'test-agent' },
		ip: '127.0.0.1',
	} as any;

	beforeEach(async () => {
		const mockPasskeyService = {
			generateRegistrationOptions: jest.fn(),
			verifyRegistration: jest.fn(),
			generateAuthenticationOptions: jest.fn(),
			verifyAuthentication: jest.fn(),
			listPasskeys: jest.fn(),
			deletePasskey: jest.fn(),
			renamePasskey: jest.fn(),
		};

		const mockBetterAuthService = {
			registerB2C: jest.fn(),
			registerB2B: jest.fn(),
			signIn: jest.fn(),
			signOut: jest.fn(),
			getSession: jest.fn(),
			listOrganizations: jest.fn(),
			getOrganization: jest.fn(),
			getOrganizationMembers: jest.fn(),
			inviteEmployee: jest.fn(),
			acceptInvitation: jest.fn(),
			removeMember: jest.fn(),
			setActiveOrganization: jest.fn(),
			refreshToken: jest.fn(),
			validateToken: jest.fn(),
			createSessionAndTokens: jest.fn(),
			requestPasswordReset: jest.fn(),
			resetPassword: jest.fn(),
			resendVerificationEmail: jest.fn(),
			getProfile: jest.fn(),
			updateProfile: jest.fn(),
			changePassword: jest.fn(),
			deleteAccount: jest.fn(),
			sessionToToken: jest.fn(),
			getJwks: jest.fn(),
			updateOrganization: jest.fn(),
			deleteOrganization: jest.fn(),
			updateMemberRole: jest.fn(),
			listOrganizationInvitations: jest.fn(),
			listUserInvitations: jest.fn(),
			cancelInvitation: jest.fn(),
			rejectInvitation: jest.fn(),
		};

		const mockSecurityEventsService = {
			logEvent: jest.fn().mockResolvedValue(undefined),
			logEventWithRequest: jest.fn().mockResolvedValue(undefined),
			extractRequestInfo: jest.fn().mockReturnValue({
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent',
			}),
		};

		const mockAccountLockoutService = {
			checkLockout: jest.fn().mockResolvedValue({ locked: false }),
			recordAttempt: jest.fn().mockResolvedValue(undefined),
			clearAttempts: jest.fn().mockResolvedValue(undefined),
		};

		const module: TestingModule = await Test.createTestingModule({
			imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
			controllers: [AuthController],
			providers: [
				{ provide: BetterAuthService, useValue: mockBetterAuthService },
				{ provide: PasskeyService, useValue: mockPasskeyService },
				{ provide: SecurityEventsService, useValue: mockSecurityEventsService },
				{ provide: AccountLockoutService, useValue: mockAccountLockoutService },
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(ThrottlerGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<AuthController>(AuthController);
		passkeyService = module.get(PasskeyService);
		betterAuthService = module.get(BetterAuthService);
		securityEventsService = module.get(SecurityEventsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// POST /auth/passkeys/register/options
	// ============================================================================

	describe('POST /auth/passkeys/register/options', () => {
		it('should call generateRegistrationOptions with user.userId', async () => {
			const expectedResult = {
				options: {
					challenge: 'test-challenge',
					rp: { name: 'ManaCore', id: 'localhost' },
				},
				challengeId: 'challenge-id-123',
			};

			passkeyService.generateRegistrationOptions.mockResolvedValue(expectedResult as any);

			const result = await controller.passkeyRegisterOptions(mockUser as any);

			expect(result).toEqual(expectedResult);
			expect(passkeyService.generateRegistrationOptions).toHaveBeenCalledWith('user-123');
		});

		it('should return options and challengeId', async () => {
			const expectedResult = {
				options: { challenge: 'abc', rp: { name: 'ManaCore', id: 'localhost' } },
				challengeId: 'ch-456',
			};

			passkeyService.generateRegistrationOptions.mockResolvedValue(expectedResult as any);

			const result = await controller.passkeyRegisterOptions(mockUser as any);

			expect(result.options).toBeDefined();
			expect(result.challengeId).toBe('ch-456');
		});
	});

	// ============================================================================
	// POST /auth/passkeys/register/verify
	// ============================================================================

	describe('POST /auth/passkeys/register/verify', () => {
		it('should verify and return passkey info', async () => {
			const body = {
				challengeId: 'challenge-123',
				credential: { id: 'cred-1', response: {} },
				friendlyName: 'My Passkey',
			};

			const expectedResult = {
				id: 'pk-123',
				credentialId: 'cred-1',
				deviceType: 'multiPlatform',
				friendlyName: 'My Passkey',
				createdAt: new Date(),
			};

			passkeyService.verifyRegistration.mockResolvedValue(expectedResult);

			const result = await controller.passkeyRegisterVerify(mockUser as any, body, mockReq);

			expect(result).toEqual(expectedResult);
			expect(passkeyService.verifyRegistration).toHaveBeenCalledWith(
				'challenge-123',
				body.credential,
				'My Passkey'
			);
		});

		it('should log security event on successful registration', async () => {
			const body = {
				challengeId: 'challenge-123',
				credential: { id: 'cred-1', response: {} },
			};

			passkeyService.verifyRegistration.mockResolvedValue({
				id: 'pk-123',
				credentialId: 'cred-1',
				deviceType: 'singleDevice',
				friendlyName: null,
				createdAt: new Date(),
			});

			await controller.passkeyRegisterVerify(mockUser as any, body, mockReq);

			expect(securityEventsService.logEvent).toHaveBeenCalledWith({
				userId: 'user-123',
				eventType: SecurityEventType.PASSKEY_REGISTERED,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent',
				metadata: { passkeyId: 'pk-123' },
			});
		});
	});

	// ============================================================================
	// POST /auth/passkeys/authenticate/options
	// ============================================================================

	describe('POST /auth/passkeys/authenticate/options', () => {
		it('should return options (no auth required)', async () => {
			const expectedResult = {
				options: { challenge: 'auth-challenge', rpId: 'localhost' },
				challengeId: 'auth-ch-123',
			};

			passkeyService.generateAuthenticationOptions.mockResolvedValue(expectedResult);

			const result = await controller.passkeyAuthOptions();

			expect(result).toEqual(expectedResult);
			expect(passkeyService.generateAuthenticationOptions).toHaveBeenCalled();
		});
	});

	// ============================================================================
	// POST /auth/passkeys/authenticate/verify
	// ============================================================================

	describe('POST /auth/passkeys/authenticate/verify', () => {
		it('should verify, create session+tokens, return tokens', async () => {
			const body = {
				challengeId: 'auth-ch-123',
				credential: { id: 'cred-1', response: {} },
			};

			const mockAuthUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'Test User',
				emailVerified: true,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				role: 'user' as const,
				twoFactorEnabled: null,
				deletedAt: null,
			};

			passkeyService.verifyAuthentication.mockResolvedValue({
				user: mockAuthUser as any,
				passkeyId: 'pk-123',
			});

			const tokenResult = {
				user: { id: 'user-123', email: 'test@example.com', name: 'Test User', role: 'user' },
				accessToken: 'jwt-access-token',
				refreshToken: 'jwt-refresh-token',
				expiresIn: 900,
			};

			betterAuthService.createSessionAndTokens.mockResolvedValue(tokenResult);

			const result = await controller.passkeyAuthVerify(body, mockReq);

			expect(result).toEqual(tokenResult);
			expect(passkeyService.verifyAuthentication).toHaveBeenCalledWith(
				'auth-ch-123',
				body.credential
			);
			expect(betterAuthService.createSessionAndTokens).toHaveBeenCalledWith(mockAuthUser, {
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent',
			});
		});

		it('should log security event on success', async () => {
			const body = {
				challengeId: 'auth-ch-123',
				credential: { id: 'cred-1', response: {} },
			};

			passkeyService.verifyAuthentication.mockResolvedValue({
				user: {
					id: 'user-123',
					email: 'test@example.com',
					name: 'Test',
					emailVerified: true,
					image: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					role: 'user' as const,
					twoFactorEnabled: null,
					deletedAt: null,
				} as any,
				passkeyId: 'pk-456',
			});

			betterAuthService.createSessionAndTokens.mockResolvedValue({
				user: { id: 'user-123', email: 'test@example.com', name: 'Test', role: 'user' },
				accessToken: 'token',
				refreshToken: 'refresh',
				expiresIn: 900,
			});

			await controller.passkeyAuthVerify(body, mockReq);

			expect(securityEventsService.logEvent).toHaveBeenCalledWith({
				userId: 'user-123',
				eventType: SecurityEventType.PASSKEY_LOGIN_SUCCESS,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent',
				metadata: { passkeyId: 'pk-456' },
			});
		});
	});

	// ============================================================================
	// GET /auth/passkeys
	// ============================================================================

	describe('GET /auth/passkeys', () => {
		it("should return user's passkeys", async () => {
			const mockPasskeys = [
				{
					id: 'pk-1',
					credentialId: 'cred-1',
					deviceType: 'multiPlatform',
					backedUp: true,
					friendlyName: 'MacBook',
					lastUsedAt: new Date(),
					createdAt: new Date(),
				},
				{
					id: 'pk-2',
					credentialId: 'cred-2',
					deviceType: 'singleDevice',
					backedUp: false,
					friendlyName: null,
					lastUsedAt: null,
					createdAt: new Date(),
				},
			];

			passkeyService.listPasskeys.mockResolvedValue(mockPasskeys);

			const result = await controller.listPasskeys(mockUser as any);

			expect(result).toEqual(mockPasskeys);
			expect(passkeyService.listPasskeys).toHaveBeenCalledWith('user-123');
		});
	});

	// ============================================================================
	// DELETE /auth/passkeys/:id
	// ============================================================================

	describe('DELETE /auth/passkeys/:id', () => {
		it('should delete and log security event', async () => {
			passkeyService.deletePasskey.mockResolvedValue(undefined);

			await controller.deletePasskey(mockUser as any, 'pk-123', mockReq);

			expect(passkeyService.deletePasskey).toHaveBeenCalledWith('user-123', 'pk-123');
			expect(securityEventsService.logEvent).toHaveBeenCalledWith({
				userId: 'user-123',
				eventType: SecurityEventType.PASSKEY_DELETED,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent',
				metadata: { passkeyId: 'pk-123' },
			});
		});

		it('should return void (204 status handled by decorator)', async () => {
			passkeyService.deletePasskey.mockResolvedValue(undefined);

			const result = await controller.deletePasskey(mockUser as any, 'pk-456', mockReq);

			expect(result).toBeUndefined();
		});
	});

	// ============================================================================
	// PATCH /auth/passkeys/:id
	// ============================================================================

	describe('PATCH /auth/passkeys/:id', () => {
		it('should rename passkey', async () => {
			passkeyService.renamePasskey.mockResolvedValue(undefined);

			const result = await controller.renamePasskey(mockUser as any, 'pk-123', {
				friendlyName: 'Work Laptop',
			});

			expect(result).toEqual({ success: true });
			expect(passkeyService.renamePasskey).toHaveBeenCalledWith(
				'user-123',
				'pk-123',
				'Work Laptop'
			);
		});
	});

	// ============================================================================
	// 2FA behavior in signIn
	// ============================================================================

	describe('2FA in signIn', () => {
		it('should pass through twoFactorRedirect when returned by BetterAuthService', async () => {
			const loginDto = {
				email: 'user@example.com',
				password: 'SecurePassword123!',
				deviceId: undefined,
				deviceName: undefined,
			};

			const twoFactorResult = {
				twoFactorRedirect: true,
				message: 'Two-factor authentication required',
			};

			betterAuthService.signIn.mockResolvedValue(twoFactorResult as any);

			const result = await controller.login(loginDto, mockReq);

			expect(result).toEqual(twoFactorResult);
			expect((result as any).twoFactorRedirect).toBe(true);
		});
	});

	// ============================================================================
	// Guard Tests for Passkey Endpoints
	// ============================================================================

	describe('Passkey Guard Configuration', () => {
		it('should have JwtAuthGuard on protected passkey endpoints', () => {
			const protectedEndpoints: (keyof AuthController)[] = [
				'passkeyRegisterOptions',
				'passkeyRegisterVerify',
				'listPasskeys',
				'deletePasskey',
				'renamePasskey',
			];

			protectedEndpoints.forEach((endpoint) => {
				const guards = Reflect.getMetadata(
					'__guards__',
					AuthController.prototype[endpoint as keyof AuthController]
				);
				expect(guards).toBeDefined();
				expect(guards).toContain(JwtAuthGuard);
			});
		});

		it('should NOT have JwtAuthGuard on public passkey endpoints', () => {
			const publicEndpoints: (keyof AuthController)[] = ['passkeyAuthOptions', 'passkeyAuthVerify'];

			publicEndpoints.forEach((endpoint) => {
				const guards = Reflect.getMetadata(
					'__guards__',
					AuthController.prototype[endpoint as keyof AuthController]
				);
				expect(guards).toBeUndefined();
			});
		});
	});
});
