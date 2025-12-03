/**
 * BetterAuthService Unit Tests
 *
 * Tests all Better Auth integration flows:
 * - B2C user registration
 * - B2B organization registration
 * - Organization member management
 * - Employee invitations
 * - Credit balance initialization
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BetterAuthService } from './better-auth.service';
import { createMockConfigService } from '../../__tests__/utils/test-helpers';

// Mock nanoid before importing factories
jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => 'mock-nanoid-123'),
}));

// Mock database connection
jest.mock('../../db/connection');

// Import after mocks
import { mockUserFactory } from '../../__tests__/utils/mock-factories';

// Mock Better Auth configuration
const mockAuthApi = {
	signUpEmail: jest.fn(),
	createOrganization: jest.fn(),
	inviteMember: jest.fn(),
	acceptInvitation: jest.fn(),
	getFullOrganization: jest.fn(),
	removeMember: jest.fn(),
	setActiveOrganization: jest.fn(),
};

jest.mock('../better-auth.config', () => ({
	createBetterAuth: jest.fn(() => ({
		api: mockAuthApi,
	})),
}));

describe('BetterAuthService', () => {
	let service: BetterAuthService;
	let configService: ConfigService;
	let mockDb: any;

	beforeEach(async () => {
		// Create mock database
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			returning: jest.fn(),
		};

		// Mock getDb
		const { getDb } = require('../../db/connection');
		getDb.mockReturnValue(mockDb);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BetterAuthService,
				{
					provide: ConfigService,
					useValue: createMockConfigService({
						'database.url': 'postgresql://test:test@localhost:5432/test',
					}),
				},
			],
		}).compile();

		service = module.get<BetterAuthService>(BetterAuthService);
		configService = module.get<ConfigService>(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('registerB2C', () => {
		it('should register a new B2C user successfully', async () => {
			const registerDto = {
				email: 'newuser@example.com',
				password: 'SecurePassword123!',
				name: 'New User',
			};

			const mockUser = mockUserFactory.create({
				id: 'user-123',
				email: registerDto.email,
				name: registerDto.name,
			});

			// Mock Better Auth signup response
			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'mock-session-token',
			});

			// Mock credit balance creation (success)
			mockDb.returning.mockResolvedValue([]);

			const result = await service.registerB2C(registerDto);

			// Verify Better Auth API was called correctly
			expect(mockAuthApi.signUpEmail).toHaveBeenCalledWith({
				body: {
					email: registerDto.email,
					password: registerDto.password,
					name: registerDto.name,
				},
			});

			// Verify personal credit balance was created
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 'user-123',
					balance: 0,
					freeCreditsRemaining: 150,
					dailyFreeCredits: 5,
					totalEarned: 0,
					totalSpent: 0,
				})
			);

			// Verify response structure
			expect(result).toEqual({
				user: {
					id: 'user-123',
					email: 'newuser@example.com',
					name: 'New User',
				},
				token: 'mock-session-token',
			});
		});

		it('should throw ConflictException if user already exists', async () => {
			const registerDto = {
				email: 'existing@example.com',
				password: 'SecurePassword123!',
				name: 'Existing User',
			};

			// Mock Better Auth error for existing user
			mockAuthApi.signUpEmail.mockRejectedValue(new Error('User with this email already exists'));

			await expect(service.registerB2C(registerDto)).rejects.toThrow(ConflictException);
			await expect(service.registerB2C(registerDto)).rejects.toThrow(
				'User with this email already exists'
			);

			// Verify no credit balance was created
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should normalize email to lowercase', async () => {
			const registerDto = {
				email: 'NewUser@EXAMPLE.COM',
				password: 'SecurePassword123!',
				name: 'New User',
			};

			const mockUser = mockUserFactory.create({
				email: 'NewUser@EXAMPLE.COM', // Better Auth should handle normalization
			});

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'mock-token',
			});

			mockDb.returning.mockResolvedValue([]);

			await service.registerB2C(registerDto);

			// Verify email was passed as-is (Better Auth normalizes internally)
			expect(mockAuthApi.signUpEmail).toHaveBeenCalledWith({
				body: expect.objectContaining({
					email: 'NewUser@EXAMPLE.COM',
				}),
			});
		});

		it('should create personal credit balance with signup bonus', async () => {
			const registerDto = {
				email: 'test@example.com',
				password: 'SecurePassword123!',
				name: 'Test User',
			};

			const mockUser = mockUserFactory.create({ id: 'user-123' });

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'mock-token',
			});

			mockDb.returning.mockResolvedValue([]);

			await service.registerB2C(registerDto);

			// Verify credit balance initialization
			expect(mockDb.values).toHaveBeenCalledWith({
				userId: 'user-123',
				balance: 0,
				freeCreditsRemaining: 150, // Signup bonus
				dailyFreeCredits: 5,
				totalEarned: 0,
				totalSpent: 0,
			});
		});

		it('should continue registration even if credit balance creation fails', async () => {
			const registerDto = {
				email: 'test@example.com',
				password: 'SecurePassword123!',
				name: 'Test User',
			};

			const mockUser = mockUserFactory.create({ id: 'user-123' });

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'mock-token',
			});

			// Mock database error for credit balance creation
			mockDb.returning.mockRejectedValue(new Error('Database error'));

			// Should not throw - registration should complete
			const result = await service.registerB2C(registerDto);

			expect(result.user.id).toBe('user-123');
		});
	});

	describe('registerB2B', () => {
		it('should register organization owner successfully', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const mockUser = mockUserFactory.create({
				id: 'owner-123',
				email: registerDto.ownerEmail,
				name: registerDto.ownerName,
			});

			const mockOrg = {
				id: 'org-123',
				name: 'Acme Corporation',
				slug: 'acme-corporation',
			};

			// Mock user creation
			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'mock-session-token',
			});

			// Mock organization creation
			mockAuthApi.createOrganization.mockResolvedValue(mockOrg);

			// Mock credit balance creation
			mockDb.returning.mockResolvedValue([]);

			const result = await service.registerB2B(registerDto);

			// Verify user creation
			expect(mockAuthApi.signUpEmail).toHaveBeenCalledWith({
				body: {
					email: registerDto.ownerEmail,
					password: registerDto.password,
					name: registerDto.ownerName,
				},
			});

			// Verify organization creation
			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: {
					name: 'Acme Corporation',
					slug: 'acme-corporation',
				},
				headers: {
					authorization: 'Bearer mock-session-token',
				},
			});

			// Verify both credit balances were created
			expect(mockDb.insert).toHaveBeenCalledTimes(2);

			// Verify response structure
			expect(result).toEqual({
				user: mockUser,
				organization: mockOrg,
				token: 'mock-session-token',
			});
		});

		it('should create organization credit balance', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			const mockOrg = { id: 'org-123', name: 'Acme Corporation' };

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'token',
			});
			mockAuthApi.createOrganization.mockResolvedValue(mockOrg);
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			// Verify organization credit balance was created
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: 'org-123',
					balance: 0,
					allocatedCredits: 0,
					availableCredits: 0,
					totalPurchased: 0,
					totalAllocated: 0,
				})
			);
		});

		it('should handle organization creation failure', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'token',
			});

			// Mock organization creation failure
			mockAuthApi.createOrganization.mockRejectedValue(new Error('Failed to create organization'));

			await expect(service.registerB2B(registerDto)).rejects.toThrow(
				'Failed to create organization'
			);
		});

		it('should generate valid slug from organization name', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'My Awesome Company!!!',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			const mockOrg = { id: 'org-123', name: 'My Awesome Company' };

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'token',
			});
			mockAuthApi.createOrganization.mockResolvedValue(mockOrg);
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			// Verify slug was sanitized
			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: expect.objectContaining({
					slug: 'my-awesome-company',
				}),
				headers: expect.anything(),
			});
		});

		it('should throw ConflictException if owner email already exists', async () => {
			const registerDto = {
				ownerEmail: 'existing@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			mockAuthApi.signUpEmail.mockRejectedValue(new Error('User with this email already exists'));

			await expect(service.registerB2B(registerDto)).rejects.toThrow(ConflictException);
			await expect(service.registerB2B(registerDto)).rejects.toThrow('Owner email already exists');

			// Verify organization was never created
			expect(mockAuthApi.createOrganization).not.toHaveBeenCalled();
		});

		it('should create both organization and personal credit balances', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			const mockOrg = { id: 'org-123', name: 'Acme Corporation' };

			mockAuthApi.signUpEmail.mockResolvedValue({
				user: mockUser,
				token: 'token',
			});
			mockAuthApi.createOrganization.mockResolvedValue(mockOrg);
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			// Verify two credit balances were created
			expect(mockDb.insert).toHaveBeenCalledTimes(2);

			// First call: organization balance
			expect(mockDb.values).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					organizationId: 'org-123',
				})
			);

			// Second call: personal balance
			expect(mockDb.values).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					userId: 'owner-123',
				})
			);
		});
	});

	describe('inviteEmployee', () => {
		it('should send invitation successfully', async () => {
			const inviteDto = {
				organizationId: 'org-123',
				employeeEmail: 'employee@example.com',
				role: 'member' as const,
				inviterToken: 'inviter-session-token',
			};

			const mockInvitation = {
				id: 'invitation-123',
				email: 'employee@example.com',
				organizationId: 'org-123',
				role: 'member',
			};

			mockAuthApi.inviteMember.mockResolvedValue(mockInvitation);

			const result = await service.inviteEmployee(inviteDto);

			// Verify Better Auth API was called
			expect(mockAuthApi.inviteMember).toHaveBeenCalledWith({
				body: {
					organizationId: 'org-123',
					email: 'employee@example.com',
					role: 'member',
				},
				headers: {
					authorization: 'Bearer inviter-session-token',
				},
			});

			expect(result).toEqual(mockInvitation);
		});

		it('should pass correct role to Better Auth API', async () => {
			const inviteDto = {
				organizationId: 'org-123',
				employeeEmail: 'admin@example.com',
				role: 'admin' as const,
				inviterToken: 'inviter-token',
			};

			mockAuthApi.inviteMember.mockResolvedValue({});

			await service.inviteEmployee(inviteDto);

			expect(mockAuthApi.inviteMember).toHaveBeenCalledWith({
				body: expect.objectContaining({
					role: 'admin',
				}),
				headers: expect.anything(),
			});
		});

		it('should handle invitation to existing member', async () => {
			const inviteDto = {
				organizationId: 'org-123',
				employeeEmail: 'existing@example.com',
				role: 'member' as const,
				inviterToken: 'inviter-token',
			};

			mockAuthApi.inviteMember.mockRejectedValue(new Error('User is already a member'));

			await expect(service.inviteEmployee(inviteDto)).rejects.toThrow('User is already a member');
		});

		it('should throw ForbiddenException if inviter lacks permission', async () => {
			const inviteDto = {
				organizationId: 'org-123',
				employeeEmail: 'employee@example.com',
				role: 'member' as const,
				inviterToken: 'invalid-token',
			};

			mockAuthApi.inviteMember.mockRejectedValue(
				new Error('You do not have permission to invite members')
			);

			await expect(service.inviteEmployee(inviteDto)).rejects.toThrow(ForbiddenException);
			await expect(service.inviteEmployee(inviteDto)).rejects.toThrow(
				'You do not have permission to invite members'
			);
		});
	});

	describe('acceptInvitation', () => {
		it('should accept invitation and add user to org', async () => {
			const acceptDto = {
				invitationId: 'invitation-123',
				userToken: 'user-session-token',
			};

			const mockMembership = {
				userId: 'user-123',
				organizationId: 'org-123',
				role: 'member',
			};

			mockAuthApi.acceptInvitation.mockResolvedValue(mockMembership);

			const result = await service.acceptInvitation(acceptDto);

			// Verify Better Auth API was called
			expect(mockAuthApi.acceptInvitation).toHaveBeenCalledWith({
				body: { invitationId: 'invitation-123' },
				headers: {
					authorization: 'Bearer user-session-token',
				},
			});

			expect(result).toEqual(mockMembership);
		});

		it('should handle expired invitation', async () => {
			const acceptDto = {
				invitationId: 'expired-invitation',
				userToken: 'user-token',
			};

			mockAuthApi.acceptInvitation.mockRejectedValue(new Error('Invitation expired'));

			await expect(service.acceptInvitation(acceptDto)).rejects.toThrow(NotFoundException);
			await expect(service.acceptInvitation(acceptDto)).rejects.toThrow(
				'Invitation not found or expired'
			);
		});

		it('should handle already accepted invitation', async () => {
			const acceptDto = {
				invitationId: 'used-invitation',
				userToken: 'user-token',
			};

			mockAuthApi.acceptInvitation.mockRejectedValue(new Error('Invitation not found'));

			await expect(service.acceptInvitation(acceptDto)).rejects.toThrow(NotFoundException);
		});
	});

	describe('getOrganizationMembers', () => {
		it('should return list of members', async () => {
			const mockMembers = [
				{
					userId: 'user-1',
					organizationId: 'org-123',
					role: 'owner',
					name: 'John Owner',
					email: 'owner@example.com',
				},
				{
					userId: 'user-2',
					organizationId: 'org-123',
					role: 'member',
					name: 'Jane Member',
					email: 'member@example.com',
				},
			];

			mockAuthApi.getFullOrganization.mockResolvedValue({ members: mockMembers });

			const result = await service.getOrganizationMembers('org-123');

			expect(mockAuthApi.getFullOrganization).toHaveBeenCalledWith({
				query: { organizationId: 'org-123' },
			});

			expect(result).toEqual(mockMembers);
			expect(result).toHaveLength(2);
		});

		it('should handle empty organization', async () => {
			mockAuthApi.getFullOrganization.mockResolvedValue({ members: [] });

			const result = await service.getOrganizationMembers('org-123');

			expect(result).toEqual([]);
		});

		it('should return empty array on error', async () => {
			mockAuthApi.getFullOrganization.mockRejectedValue(new Error('Database error'));

			const result = await service.getOrganizationMembers('org-123');

			// Should not throw, but return empty array
			expect(result).toEqual([]);
		});
	});

	describe('removeMember', () => {
		it('should remove member successfully', async () => {
			const removeDto = {
				organizationId: 'org-123',
				memberId: 'user-456',
				removerToken: 'admin-token',
			};

			mockAuthApi.removeMember.mockResolvedValue({ success: true });

			const result = await service.removeMember(removeDto);

			expect(mockAuthApi.removeMember).toHaveBeenCalledWith({
				body: {
					memberIdOrEmail: 'user-456',
					organizationId: 'org-123',
				},
				headers: {
					authorization: 'Bearer admin-token',
				},
			});

			expect(result).toEqual({
				success: true,
				message: 'Member removed successfully',
			});
		});

		it('should handle removing non-existent member', async () => {
			const removeDto = {
				organizationId: 'org-123',
				memberId: 'non-existent',
				removerToken: 'admin-token',
			};

			mockAuthApi.removeMember.mockRejectedValue(new Error('Member not found'));

			await expect(service.removeMember(removeDto)).rejects.toThrow('Member not found');
		});

		it('should throw ForbiddenException if remover lacks permission', async () => {
			const removeDto = {
				organizationId: 'org-123',
				memberId: 'user-456',
				removerToken: 'member-token', // Regular member cannot remove
			};

			mockAuthApi.removeMember.mockRejectedValue(
				new Error('You do not have permission to remove members')
			);

			await expect(service.removeMember(removeDto)).rejects.toThrow(ForbiddenException);
			await expect(service.removeMember(removeDto)).rejects.toThrow(
				'You do not have permission to remove members'
			);
		});
	});

	describe('setActiveOrganization', () => {
		it('should switch organization successfully', async () => {
			const setActiveDto = {
				organizationId: 'org-456',
				userToken: 'user-token',
			};

			const mockSession = {
				userId: 'user-123',
				activeOrganizationId: 'org-456',
			};

			mockAuthApi.setActiveOrganization.mockResolvedValue(mockSession);

			const result = await service.setActiveOrganization(setActiveDto);

			expect(mockAuthApi.setActiveOrganization).toHaveBeenCalledWith({
				body: { organizationId: 'org-456' },
				headers: {
					authorization: 'Bearer user-token',
				},
			});

			expect(result).toEqual(mockSession);
		});

		it('should update session context', async () => {
			const setActiveDto = {
				organizationId: 'org-789',
				userToken: 'user-token',
			};

			const mockSession = {
				userId: 'user-123',
				activeOrganizationId: 'org-789',
				metadata: {
					previousOrg: 'org-456',
				},
			};

			mockAuthApi.setActiveOrganization.mockResolvedValue(mockSession);

			const result = await service.setActiveOrganization(setActiveDto);

			expect(result.activeOrganizationId).toBe('org-789');
		});

		it('should throw NotFoundException for invalid organization', async () => {
			const setActiveDto = {
				organizationId: 'non-existent-org',
				userToken: 'user-token',
			};

			mockAuthApi.setActiveOrganization.mockRejectedValue(
				new Error('Organization not found or you are not a member')
			);

			await expect(service.setActiveOrganization(setActiveDto)).rejects.toThrow(NotFoundException);
			await expect(service.setActiveOrganization(setActiveDto)).rejects.toThrow(
				'Organization not found or you are not a member'
			);
		});
	});

	describe('slugify (private method)', () => {
		it('should convert organization name to lowercase slug', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'My Company',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockAuthApi.createOrganization.mockResolvedValue({ id: 'org-123' });
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: expect.objectContaining({
					slug: 'my-company',
				}),
				headers: expect.anything(),
			});
		});

		it('should remove special characters from slug', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Company #1 (Best!)',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockAuthApi.createOrganization.mockResolvedValue({ id: 'org-123' });
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: expect.objectContaining({
					slug: 'company-1-best',
				}),
				headers: expect.anything(),
			});
		});

		it('should replace spaces with hyphens', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Multi Word Company Name',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockAuthApi.createOrganization.mockResolvedValue({ id: 'org-123' });
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: expect.objectContaining({
					slug: 'multi-word-company-name',
				}),
				headers: expect.anything(),
			});
		});

		it('should handle multiple consecutive spaces', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Company   With   Spaces',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockAuthApi.createOrganization.mockResolvedValue({ id: 'org-123' });
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			expect(mockAuthApi.createOrganization).toHaveBeenCalledWith({
				body: expect.objectContaining({
					slug: 'company-with-spaces',
				}),
				headers: expect.anything(),
			});
		});
	});

	describe('Credit Balance Initialization', () => {
		it('should initialize B2C user with signup bonus credits', async () => {
			const registerDto = {
				email: 'test@example.com',
				password: 'SecurePassword123!',
				name: 'Test User',
			};

			const mockUser = mockUserFactory.create({ id: 'user-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2C(registerDto);

			// Verify credit balance was initialized with correct values
			expect(mockDb.values).toHaveBeenCalledWith({
				userId: 'user-123',
				balance: 0,
				freeCreditsRemaining: 150,
				dailyFreeCredits: 5,
				totalEarned: 0,
				totalSpent: 0,
			});
		});

		it('should initialize organization balance with zero credits', async () => {
			const registerDto = {
				ownerEmail: 'owner@company.com',
				password: 'SecurePassword123!',
				ownerName: 'John Owner',
				organizationName: 'Acme Corporation',
			};

			const mockUser = mockUserFactory.create({ id: 'owner-123' });
			const mockOrg = { id: 'org-123', name: 'Acme Corporation' };

			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });
			mockAuthApi.createOrganization.mockResolvedValue(mockOrg);
			mockDb.returning.mockResolvedValue([]);

			await service.registerB2B(registerDto);

			// Verify organization balance was initialized
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: 'org-123',
					balance: 0,
					allocatedCredits: 0,
					availableCredits: 0,
					totalPurchased: 0,
					totalAllocated: 0,
				})
			);
		});

		it('should not fail registration if credit balance creation errors', async () => {
			const registerDto = {
				email: 'test@example.com',
				password: 'SecurePassword123!',
				name: 'Test User',
			};

			const mockUser = mockUserFactory.create({ id: 'user-123' });
			mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser, token: 'token' });

			// Mock database error
			mockDb.insert.mockImplementation(() => {
				throw new Error('Database connection failed');
			});

			// Should not throw - registration should complete despite credit error
			const result = await service.registerB2C(registerDto);

			expect(result.user.id).toBe('user-123');
		});
	});

	describe('Error Handling', () => {
		it('should handle generic errors from Better Auth', async () => {
			const registerDto = {
				email: 'test@example.com',
				password: 'SecurePassword123!',
				name: 'Test User',
			};

			mockAuthApi.signUpEmail.mockRejectedValue(new Error('Unexpected server error'));

			await expect(service.registerB2C(registerDto)).rejects.toThrow('Unexpected server error');
		});

		it('should propagate network errors', async () => {
			const inviteDto = {
				organizationId: 'org-123',
				employeeEmail: 'employee@example.com',
				role: 'member' as const,
				inviterToken: 'token',
			};

			mockAuthApi.inviteMember.mockRejectedValue(new Error('Network timeout'));

			await expect(service.inviteEmployee(inviteDto)).rejects.toThrow('Network timeout');
		});
	});
});
