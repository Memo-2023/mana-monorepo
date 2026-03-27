/**
 * AuthController Security Events Unit Tests
 *
 * Tests the security events / audit log endpoint on the AuthController:
 *
 * - GET /auth/security-events - List user's security events
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';
import { PasskeyService } from './services/passkey.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SecurityEventsService, SecurityEventType, AccountLockoutService } from '../security';

describe('AuthController - Security Events', () => {
	let controller: AuthController;
	let betterAuthService: jest.Mocked<BetterAuthService>;

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
			getSecurityEvents: jest.fn(),
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
		betterAuthService = module.get(BetterAuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// GET /auth/security-events
	// ============================================================================

	describe('GET /auth/security-events', () => {
		it("should return user's events from BetterAuthService", async () => {
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
					eventType: 'password_changed',
					ipAddress: '192.168.1.1',
					userAgent: 'Mozilla/5.0',
					metadata: {},
					createdAt: new Date('2026-03-26T09:00:00Z'),
				},
			];

			betterAuthService.getSecurityEvents.mockResolvedValue(mockEvents);

			const result = await controller.getSecurityEvents(mockUser as any, mockReq);

			expect(result).toEqual(mockEvents);
			expect(betterAuthService.getSecurityEvents).toHaveBeenCalledWith('user-123');
		});

		it('should return empty array when no events exist', async () => {
			betterAuthService.getSecurityEvents.mockResolvedValue([]);

			const result = await controller.getSecurityEvents(mockUser as any, mockReq);

			expect(result).toEqual([]);
			expect(betterAuthService.getSecurityEvents).toHaveBeenCalledWith('user-123');
		});

		it('should return events in descending order by createdAt', async () => {
			const newerEvent = {
				id: 'evt-1',
				eventType: 'login_success',
				ipAddress: '127.0.0.1',
				userAgent: 'test',
				metadata: {},
				createdAt: new Date('2026-03-27T12:00:00Z'),
			};
			const olderEvent = {
				id: 'evt-2',
				eventType: 'logout',
				ipAddress: '127.0.0.1',
				userAgent: 'test',
				metadata: {},
				createdAt: new Date('2026-03-26T08:00:00Z'),
			};

			// BetterAuthService already orders them desc by createdAt
			betterAuthService.getSecurityEvents.mockResolvedValue([newerEvent, olderEvent]);

			const result = await controller.getSecurityEvents(mockUser as any, mockReq);

			expect(result).toHaveLength(2);
			expect(new Date(result[0].createdAt).getTime()).toBeGreaterThan(
				new Date(result[1].createdAt).getTime()
			);
		});
	});

	// ============================================================================
	// Guard Configuration
	// ============================================================================

	describe('Security Events Guard Configuration', () => {
		it('should have JwtAuthGuard on getSecurityEvents', () => {
			const guards = Reflect.getMetadata('__guards__', AuthController.prototype.getSecurityEvents);
			expect(guards).toBeDefined();
			expect(guards).toContain(JwtAuthGuard);
		});
	});
});
