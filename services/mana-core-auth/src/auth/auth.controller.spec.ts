/**
 * AuthController Unit Tests
 *
 * Tests all authentication controller endpoints using BetterAuthService:
 *
 * B2C Endpoints:
 * - POST /auth/register - User registration
 * - POST /auth/login - User login
 * - POST /auth/logout - User logout
 * - POST /auth/refresh - Token refresh
 * - GET /auth/session - Get current session
 * - POST /auth/validate - Token validation
 *
 * B2B Endpoints:
 * - POST /auth/register/b2b - Organization registration
 * - GET /auth/organizations - List organizations
 * - GET /auth/organizations/:id - Get organization
 * - GET /auth/organizations/:id/members - Get organization members
 * - POST /auth/organizations/:id/invite - Invite employee
 * - POST /auth/organizations/accept-invitation - Accept invitation
 * - DELETE /auth/organizations/:id/members/:memberId - Remove member
 * - POST /auth/organizations/set-active - Set active organization
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import {
	UnauthorizedException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { mockDtoFactory } from '../__tests__/utils/mock-factories';

describe('AuthController', () => {
	let controller: AuthController;
	let betterAuthService: jest.Mocked<BetterAuthService>;

	// Common test data
	const mockAuthHeader = 'Bearer valid-jwt-token';
	const mockToken = 'valid-jwt-token';

	beforeEach(async () => {
		// Create mock BetterAuthService with all methods
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
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: BetterAuthService,
					useValue: mockBetterAuthService,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<AuthController>(AuthController);
		betterAuthService = module.get(BetterAuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// POST /auth/register (B2C)
	// ============================================================================

	describe('POST /auth/register', () => {
		it('should successfully register a new B2C user', async () => {
			const registerDto = mockDtoFactory.register({
				email: 'newuser@example.com',
				password: 'SecurePassword123!',
				name: 'New User',
			});

			const expectedResult = {
				user: {
					id: 'user-123',
					email: registerDto.email,
					name: registerDto.name,
				},
				token: 'jwt-token',
			};

			betterAuthService.registerB2C.mockResolvedValue(expectedResult);

			const result = await controller.register(registerDto);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.registerB2C).toHaveBeenCalledWith({
				email: registerDto.email,
				password: registerDto.password,
				name: registerDto.name,
			});
		});

		it('should handle registration without name', async () => {
			const registerDto = {
				email: 'noname@example.com',
				password: 'SecurePassword123!',
			};

			const expectedResult = {
				user: { id: 'user-456', email: registerDto.email, name: '' },
				token: 'jwt-token',
			};

			betterAuthService.registerB2C.mockResolvedValue(expectedResult);

			const result = await controller.register(registerDto as any);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.registerB2C).toHaveBeenCalledWith({
				email: registerDto.email,
				password: registerDto.password,
				name: '',
			});
		});

		it('should propagate ConflictException when user exists', async () => {
			const registerDto = mockDtoFactory.register({ email: 'existing@example.com' });

			betterAuthService.registerB2C.mockRejectedValue(
				new ConflictException('User with this email already exists')
			);

			await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
		});
	});

	// ============================================================================
	// POST /auth/login
	// ============================================================================

	describe('POST /auth/login', () => {
		it('should successfully login a user', async () => {
			const loginDto = mockDtoFactory.login({
				email: 'user@example.com',
				password: 'SecurePassword123!',
			});

			const expectedResult = {
				user: {
					id: 'user-123',
					email: loginDto.email,
					name: 'Test User',
					role: 'user',
				},
				accessToken: 'jwt-access-token',
				refreshToken: 'session-refresh-token',
				expiresIn: 900,
			};

			betterAuthService.signIn.mockResolvedValue(expectedResult);

			const result = await controller.login(loginDto);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.signIn).toHaveBeenCalledWith({
				email: loginDto.email,
				password: loginDto.password,
				deviceId: undefined,
				deviceName: undefined,
			});
		});

		it('should pass device info when provided', async () => {
			const loginDto = {
				email: 'user@example.com',
				password: 'SecurePassword123!',
				deviceId: 'device-abc-123',
				deviceName: 'iPhone 15 Pro',
			};

			betterAuthService.signIn.mockResolvedValue({
				user: { id: '123', email: 'user@example.com', name: 'Test', role: 'user' },
				accessToken: 'jwt-token',
				refreshToken: 'refresh-token',
				expiresIn: 900,
			});

			await controller.login(loginDto);

			expect(betterAuthService.signIn).toHaveBeenCalledWith({
				email: loginDto.email,
				password: loginDto.password,
				deviceId: 'device-abc-123',
				deviceName: 'iPhone 15 Pro',
			});
		});

		it('should propagate UnauthorizedException for invalid credentials', async () => {
			const loginDto = mockDtoFactory.login({ password: 'WrongPassword' });

			betterAuthService.signIn.mockRejectedValue(
				new UnauthorizedException('Invalid email or password')
			);

			await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
		});
	});

	// ============================================================================
	// POST /auth/logout
	// ============================================================================

	describe('POST /auth/logout', () => {
		it('should successfully logout a user', async () => {
			const expectedResult = { success: true, message: 'Signed out successfully' };

			betterAuthService.signOut.mockResolvedValue(expectedResult);

			const result = await controller.logout(mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.signOut).toHaveBeenCalledWith(mockToken);
		});

		it('should extract token from Bearer header', async () => {
			betterAuthService.signOut.mockResolvedValue({ success: true, message: 'Signed out' });

			await controller.logout('Bearer my-secret-token');

			expect(betterAuthService.signOut).toHaveBeenCalledWith('my-secret-token');
		});

		it('should handle raw token without Bearer prefix', async () => {
			betterAuthService.signOut.mockResolvedValue({ success: true, message: 'Signed out' });

			await controller.logout('raw-token');

			expect(betterAuthService.signOut).toHaveBeenCalledWith('raw-token');
		});
	});

	// ============================================================================
	// POST /auth/refresh
	// ============================================================================

	describe('POST /auth/refresh', () => {
		it('should successfully refresh tokens', async () => {
			const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

			const expectedResult = {
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
				expiresIn: 900,
				tokenType: 'Bearer',
				user: { id: 'user-123', email: 'user@example.com', name: 'Test', role: 'user' as const },
			};

			betterAuthService.refreshToken.mockResolvedValue(expectedResult);

			const result = await controller.refresh(refreshTokenDto);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
		});

		it('should propagate UnauthorizedException for invalid refresh token', async () => {
			const refreshTokenDto = { refreshToken: 'invalid-token' };

			betterAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('Invalid refresh token')
			);

			await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
		});
	});

	// ============================================================================
	// GET /auth/session
	// ============================================================================

	describe('GET /auth/session', () => {
		it('should return current session', async () => {
			const expectedResult = {
				user: { id: 'user-123', email: 'user@example.com', name: 'Test' },
				session: { id: 'session-123', activeOrganizationId: null },
			};

			betterAuthService.getSession.mockResolvedValue(expectedResult as any);

			const result = await controller.getSession(mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.getSession).toHaveBeenCalledWith(mockToken);
		});

		it('should propagate UnauthorizedException for invalid session', async () => {
			betterAuthService.getSession.mockRejectedValue(
				new UnauthorizedException('Invalid or expired session')
			);

			await expect(controller.getSession(mockAuthHeader)).rejects.toThrow(UnauthorizedException);
		});
	});

	// ============================================================================
	// POST /auth/validate
	// ============================================================================

	describe('POST /auth/validate', () => {
		it('should return valid for a valid token', async () => {
			const body = { token: 'valid-jwt-token' };

			const expectedResult = {
				valid: true,
				payload: { sub: 'user-123', email: 'user@example.com', role: 'user' },
			};

			betterAuthService.validateToken.mockResolvedValue(expectedResult as any);

			const result = await controller.validate(body);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.validateToken).toHaveBeenCalledWith(body.token);
		});

		it('should return invalid for expired token', async () => {
			const body = { token: 'expired-token' };

			betterAuthService.validateToken.mockResolvedValue({
				valid: false,
				error: 'Token expired',
			} as any);

			const result = await controller.validate(body);

			expect((result as any).valid).toBe(false);
		});
	});

	// ============================================================================
	// POST /auth/register/b2b
	// ============================================================================

	describe('POST /auth/register/b2b', () => {
		it('should successfully register a B2B organization', async () => {
			const registerDto = {
				ownerEmail: 'owner@acme.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const expectedResult = {
				user: { id: 'user-123', email: registerDto.ownerEmail, name: registerDto.ownerName },
				organization: { id: 'org-456', name: 'Acme Corporation', slug: 'acme-corporation' },
				token: 'jwt-token',
			};

			betterAuthService.registerB2B.mockResolvedValue(expectedResult as any);

			const result = await controller.registerB2B(registerDto);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.registerB2B).toHaveBeenCalledWith(registerDto);
		});

		it('should propagate ConflictException when owner email exists', async () => {
			const registerDto = {
				ownerEmail: 'existing@acme.com',
				password: 'SecurePassword123!',
				ownerName: 'John',
				organizationName: 'Acme',
			};

			betterAuthService.registerB2B.mockRejectedValue(
				new ConflictException('Owner email already exists')
			);

			await expect(controller.registerB2B(registerDto)).rejects.toThrow(ConflictException);
		});
	});

	// ============================================================================
	// GET /auth/organizations
	// ============================================================================

	describe('GET /auth/organizations', () => {
		it('should list user organizations', async () => {
			const expectedResult = {
				organizations: [
					{ id: 'org-1', name: 'Org One', slug: 'org-one' },
					{ id: 'org-2', name: 'Org Two', slug: 'org-two' },
				],
			};

			betterAuthService.listOrganizations.mockResolvedValue(expectedResult as any);

			const result = await controller.listOrganizations(mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.listOrganizations).toHaveBeenCalledWith(mockToken);
		});

		it('should return empty array when user has no organizations', async () => {
			betterAuthService.listOrganizations.mockResolvedValue({ organizations: [] });

			const result = await controller.listOrganizations(mockAuthHeader);

			expect(result.organizations).toEqual([]);
		});
	});

	// ============================================================================
	// GET /auth/organizations/:id
	// ============================================================================

	describe('GET /auth/organizations/:id', () => {
		it('should get organization details', async () => {
			const orgId = 'org-123';
			const expectedResult = {
				id: orgId,
				name: 'Acme Corp',
				slug: 'acme-corp',
				members: [{ id: 'member-1', userId: 'user-1', role: 'owner' }],
			};

			betterAuthService.getOrganization.mockResolvedValue(expectedResult as any);

			const result = await controller.getOrganization(orgId, mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.getOrganization).toHaveBeenCalledWith(orgId, mockToken);
		});

		it('should throw NotFoundException when organization not found', async () => {
			betterAuthService.getOrganization.mockRejectedValue(
				new NotFoundException('Organization not found')
			);

			await expect(controller.getOrganization('invalid-id', mockAuthHeader)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// GET /auth/organizations/:id/members
	// ============================================================================

	describe('GET /auth/organizations/:id/members', () => {
		it('should get organization members', async () => {
			const orgId = 'org-123';
			const expectedMembers = [
				{ id: 'member-1', userId: 'user-1', organizationId: orgId, role: 'owner' },
				{ id: 'member-2', userId: 'user-2', organizationId: orgId, role: 'member' },
			];

			betterAuthService.getOrganizationMembers.mockResolvedValue(expectedMembers as any);

			const result = await controller.getOrganizationMembers(orgId);

			expect(result).toEqual(expectedMembers);
			expect(betterAuthService.getOrganizationMembers).toHaveBeenCalledWith(orgId);
		});
	});

	// ============================================================================
	// POST /auth/organizations/:id/invite
	// ============================================================================

	describe('POST /auth/organizations/:id/invite', () => {
		it('should invite an employee to organization', async () => {
			const orgId = 'org-123';
			const inviteDto = {
				organizationId: orgId,
				employeeEmail: 'employee@acme.com',
				role: 'member' as const,
			};

			const expectedResult = {
				id: 'invitation-123',
				email: 'employee@acme.com',
				organizationId: orgId,
				role: 'member',
				status: 'pending',
			};

			betterAuthService.inviteEmployee.mockResolvedValue(expectedResult as any);

			const result = await controller.inviteEmployee(orgId, inviteDto, mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.inviteEmployee).toHaveBeenCalledWith({
				organizationId: orgId,
				employeeEmail: 'employee@acme.com',
				role: 'member',
				inviterToken: mockToken,
			});
		});

		it('should throw ForbiddenException when inviter lacks permission', async () => {
			const orgId = 'org-123';
			const inviteDto = {
				organizationId: orgId,
				employeeEmail: 'employee@acme.com',
				role: 'member' as const,
			};

			betterAuthService.inviteEmployee.mockRejectedValue(
				new ForbiddenException('You do not have permission to invite members')
			);

			await expect(controller.inviteEmployee(orgId, inviteDto, mockAuthHeader)).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	// ============================================================================
	// POST /auth/organizations/accept-invitation
	// ============================================================================

	describe('POST /auth/organizations/accept-invitation', () => {
		it('should accept an invitation', async () => {
			const acceptDto = { invitationId: 'invitation-123' };

			const expectedResult = {
				member: { id: 'member-123', userId: 'user-456', organizationId: 'org-123', role: 'member' },
				organization: { id: 'org-123', name: 'Acme Corp' },
			};

			betterAuthService.acceptInvitation.mockResolvedValue(expectedResult as any);

			const result = await controller.acceptInvitation(acceptDto, mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.acceptInvitation).toHaveBeenCalledWith({
				invitationId: 'invitation-123',
				userToken: mockToken,
			});
		});

		it('should throw NotFoundException when invitation not found', async () => {
			const acceptDto = { invitationId: 'invalid-invitation' };

			betterAuthService.acceptInvitation.mockRejectedValue(
				new NotFoundException('Invitation not found or expired')
			);

			await expect(controller.acceptInvitation(acceptDto, mockAuthHeader)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// DELETE /auth/organizations/:id/members/:memberId
	// ============================================================================

	describe('DELETE /auth/organizations/:id/members/:memberId', () => {
		it('should remove a member from organization', async () => {
			const orgId = 'org-123';
			const memberId = 'member-456';

			const expectedResult = { success: true, message: 'Member removed successfully' };

			betterAuthService.removeMember.mockResolvedValue(expectedResult);

			const result = await controller.removeMember(orgId, memberId, mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.removeMember).toHaveBeenCalledWith({
				organizationId: orgId,
				memberId,
				removerToken: mockToken,
			});
		});

		it('should throw ForbiddenException when remover lacks permission', async () => {
			betterAuthService.removeMember.mockRejectedValue(
				new ForbiddenException('You do not have permission to remove members')
			);

			await expect(
				controller.removeMember('org-123', 'member-456', mockAuthHeader)
			).rejects.toThrow(ForbiddenException);
		});
	});

	// ============================================================================
	// POST /auth/organizations/set-active
	// ============================================================================

	describe('POST /auth/organizations/set-active', () => {
		it('should set active organization', async () => {
			const setActiveDto = { organizationId: 'org-123' };

			const expectedResult = {
				userId: 'user-123',
				activeOrganizationId: 'org-123',
			};

			betterAuthService.setActiveOrganization.mockResolvedValue(expectedResult as any);

			const result = await controller.setActiveOrganization(setActiveDto, mockAuthHeader);

			expect(result).toEqual(expectedResult);
			expect(betterAuthService.setActiveOrganization).toHaveBeenCalledWith({
				organizationId: 'org-123',
				userToken: mockToken,
			});
		});

		it('should throw NotFoundException when not a member', async () => {
			const setActiveDto = { organizationId: 'org-999' };

			betterAuthService.setActiveOrganization.mockRejectedValue(
				new NotFoundException('Organization not found or you are not a member')
			);

			await expect(controller.setActiveOrganization(setActiveDto, mockAuthHeader)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// Guard Tests
	// ============================================================================

	describe('Guards', () => {
		it('should have JwtAuthGuard on protected endpoints', () => {
			const protectedEndpoints: (keyof AuthController)[] = [
				'logout',
				'getSession',
				'listOrganizations',
				'getOrganization',
				'getOrganizationMembers',
				'inviteEmployee',
				'acceptInvitation',
				'removeMember',
				'setActiveOrganization',
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

		it('should NOT have JwtAuthGuard on public endpoints', () => {
			const publicEndpoints: (keyof AuthController)[] = [
				'register',
				'login',
				'refresh',
				'validate',
				'registerB2B',
			];

			publicEndpoints.forEach((endpoint) => {
				const guards = Reflect.getMetadata(
					'__guards__',
					AuthController.prototype[endpoint as keyof AuthController]
				);
				expect(guards).toBeUndefined();
			});
		});
	});

	// ============================================================================
	// Token Extraction Helper
	// ============================================================================

	describe('Token Extraction', () => {
		it('should extract token from Bearer authorization header', async () => {
			betterAuthService.signOut.mockResolvedValue({ success: true, message: 'OK' });

			await controller.logout('Bearer my-token-123');

			expect(betterAuthService.signOut).toHaveBeenCalledWith('my-token-123');
		});

		it('should handle missing authorization header', async () => {
			betterAuthService.signOut.mockResolvedValue({ success: true, message: 'OK' });

			await controller.logout('');

			expect(betterAuthService.signOut).toHaveBeenCalledWith('');
		});
	});
});
