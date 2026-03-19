import { Test, TestingModule } from '@nestjs/testing';
import { SpaceService } from '../space.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('SpaceService', () => {
	let service: SpaceService;
	let mockDb: any;

	const ownerId = 'user-owner-1';
	const memberId = 'user-member-2';
	const spaceId = 'space-abc-123';

	const mockSpace = {
		id: spaceId,
		ownerId,
		name: 'Test Space',
		description: 'A test space',
		isArchived: false,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	const mockMember = {
		id: 'member-001',
		spaceId,
		userId: memberId,
		role: 'member' as const,
		invitationStatus: 'accepted' as const,
		invitedBy: ownerId,
		invitedAt: new Date('2025-01-01'),
		joinedAt: new Date('2025-01-02'),
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	const mockOwnerMember = {
		id: 'member-000',
		spaceId,
		userId: ownerId,
		role: 'owner' as const,
		invitationStatus: 'accepted' as const,
		invitedBy: null,
		invitedAt: new Date('2025-01-01'),
		joinedAt: new Date('2025-01-01'),
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SpaceService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<SpaceService>(SpaceService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getUserSpaces', () => {
		it('should return spaces where user is an accepted member', async () => {
			// First query: get spaceIds from spaceMembers
			mockDb.where.mockResolvedValueOnce([{ spaceId }]);
			// Second query: get spaces by ids - ends at orderBy
			mockDb.orderBy.mockResolvedValueOnce([mockSpace]);

			const result = await service.getUserSpaces(ownerId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].name).toBe('Test Space');
			}
		});

		it('should return empty array when user has no spaces', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getUserSpaces('user-no-spaces');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
		});

		it('should return error on database failure', async () => {
			mockDb.where.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.getUserSpaces(ownerId);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Failed to fetch user spaces');
			}
		});
	});

	describe('getOwnedSpaces', () => {
		it('should return spaces owned by the user', async () => {
			mockDb.orderBy.mockResolvedValueOnce([mockSpace]);

			const result = await service.getOwnedSpaces(ownerId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].ownerId).toBe(ownerId);
			}
		});

		it('should return empty array when user owns no spaces', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.getOwnedSpaces('user-no-ownership');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
		});
	});

	describe('getSpace', () => {
		it('should return a space when found', async () => {
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.getSpace(spaceId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe(spaceId);
				expect(result.value.name).toBe('Test Space');
			}
		});

		it('should return NotFoundError when space does not exist', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getSpace('nonexistent');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Space');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.limit.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.getSpace(spaceId);

			expect(result.ok).toBe(false);
		});
	});

	describe('createSpace', () => {
		it('should create a space and add owner as member', async () => {
			// insert().values().returning() for space creation
			mockDb.returning.mockResolvedValueOnce([mockSpace]);
			// Second insert().values() for adding owner as member - values() returns this (mockDb)
			// which is awaited and resolves to mockDb (non-thenable resolves to itself)

			const result = await service.createSpace(ownerId, 'Test Space', 'A test space');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.name).toBe('Test Space');
				expect(result.value.ownerId).toBe(ownerId);
			}
			expect(mockDb.insert).toHaveBeenCalledTimes(2);
		});

		it('should create a space without description', async () => {
			const spaceNoDesc = { ...mockSpace, description: null };
			mockDb.returning.mockResolvedValueOnce([spaceNoDesc]);

			const result = await service.createSpace(ownerId, 'No Desc Space');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.description).toBeNull();
			}
		});

		it('should return error on database failure', async () => {
			mockDb.returning.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.createSpace(ownerId, 'Failing Space');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('Failed to create space');
			}
		});
	});

	describe('updateSpace', () => {
		it('should update a space when user is the owner', async () => {
			const updatedSpace = { ...mockSpace, name: 'Updated Name' };
			// getSpace call (via limit)
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([updatedSpace]);

			const result = await service.updateSpace(spaceId, ownerId, { name: 'Updated Name' });

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.name).toBe('Updated Name');
			}
		});

		it('should return error when user is not the owner', async () => {
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.updateSpace(spaceId, 'other-user', { name: 'Hacked' });

			expect(result.ok).toBe(false);
		});

		it('should return error when space not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.updateSpace('nonexistent', ownerId, { name: 'Nope' });

			expect(result.ok).toBe(false);
		});
	});

	describe('deleteSpace', () => {
		it('should delete a space when user is the owner', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.deleteSpace(spaceId, ownerId);

			expect(result.ok).toBe(true);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should return error when user is not the owner', async () => {
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.deleteSpace(spaceId, 'other-user');

			expect(result.ok).toBe(false);
		});

		it('should return error when space not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.deleteSpace('nonexistent', ownerId);

			expect(result.ok).toBe(false);
		});
	});

	describe('getSpaceMembers', () => {
		it('should return all members of a space', async () => {
			const members = [mockOwnerMember, mockMember];
			mockDb.orderBy.mockResolvedValueOnce(members);

			const result = await service.getSpaceMembers(spaceId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].role).toBe('owner');
				expect(result.value[1].role).toBe('member');
			}
		});

		it('should return error on database failure', async () => {
			mockDb.orderBy.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.getSpaceMembers(spaceId);

			expect(result.ok).toBe(false);
		});
	});

	describe('inviteUserToSpace', () => {
		it('should create an invitation when inviter is the owner', async () => {
			const pendingMember = { ...mockMember, invitationStatus: 'pending' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check existing member - none found
			mockDb.limit.mockResolvedValueOnce([]);
			// insert().values().returning() for new invitation
			mockDb.returning.mockResolvedValueOnce([pendingMember]);

			const result = await service.inviteUserToSpace(spaceId, memberId, ownerId, 'member');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.userId).toBe(memberId);
				expect(result.value.spaceId).toBe(spaceId);
			}
		});

		it('should create an invitation when inviter is an admin', async () => {
			const adminId = 'user-admin';
			const adminMember = { ...mockMember, userId: adminId, role: 'admin' as const };
			const pendingMember = { ...mockMember, invitationStatus: 'pending' as const };

			// getSpace call (inviter is not owner)
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check inviter role - is admin
			mockDb.limit.mockResolvedValueOnce([adminMember]);
			// Check existing member - none found
			mockDb.limit.mockResolvedValueOnce([]);
			// insert().values().returning()
			mockDb.returning.mockResolvedValueOnce([pendingMember]);

			const result = await service.inviteUserToSpace(spaceId, memberId, adminId, 'member');

			expect(result.ok).toBe(true);
		});

		it('should return error when inviter is a regular member', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check inviter role - is regular member (not admin)
			mockDb.limit.mockResolvedValueOnce([mockMember]);

			const result = await service.inviteUserToSpace(spaceId, 'new-user', memberId, 'member');

			// The service throws ForbiddenException which gets caught and returns err
			expect(result.ok).toBe(false);
		});

		it('should return existing member if already accepted', async () => {
			const acceptedMember = { ...mockMember, invitationStatus: 'accepted' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check existing member - already accepted
			mockDb.limit.mockResolvedValueOnce([acceptedMember]);

			const result = await service.inviteUserToSpace(spaceId, memberId, ownerId, 'member');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.invitationStatus).toBe('accepted');
			}
		});

		it('should update existing declined invitation', async () => {
			const declinedMember = { ...mockMember, invitationStatus: 'declined' as const };
			const updatedMember = { ...mockMember, invitationStatus: 'pending' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check existing member - declined
			mockDb.limit.mockResolvedValueOnce([declinedMember]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([updatedMember]);

			const result = await service.inviteUserToSpace(spaceId, memberId, ownerId, 'member');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.invitationStatus).toBe('pending');
			}
		});
	});

	describe('respondToInvitation', () => {
		it('should accept an invitation', async () => {
			const acceptedMember = { ...mockMember, invitationStatus: 'accepted' as const };
			mockDb.returning.mockResolvedValueOnce([acceptedMember]);

			const result = await service.respondToInvitation(spaceId, memberId, 'accepted');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.invitationStatus).toBe('accepted');
			}
		});

		it('should decline an invitation', async () => {
			const declinedMember = { ...mockMember, invitationStatus: 'declined' as const };
			mockDb.returning.mockResolvedValueOnce([declinedMember]);

			const result = await service.respondToInvitation(spaceId, memberId, 'declined');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.invitationStatus).toBe('declined');
			}
		});

		it('should return NotFoundError when invitation does not exist', async () => {
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.respondToInvitation(spaceId, 'unknown-user', 'accepted');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('SpaceMember');
			}
		});
	});

	describe('removeMember', () => {
		it('should remove a member when requester is the owner', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check requester role - owner is found in spaceMembers
			mockDb.limit.mockResolvedValueOnce([mockOwnerMember]);

			const result = await service.removeMember(spaceId, memberId, ownerId);

			expect(result.ok).toBe(true);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should remove a member when requester is an admin', async () => {
			const adminId = 'user-admin';
			const adminMember = { ...mockMember, userId: adminId, role: 'admin' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check requester role - is admin
			mockDb.limit.mockResolvedValueOnce([adminMember]);

			const result = await service.removeMember(spaceId, memberId, adminId);

			expect(result.ok).toBe(true);
		});

		it('should return error when requester is a regular member', async () => {
			const regularUser = 'user-regular';
			const regularMember = { ...mockMember, userId: regularUser, role: 'member' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check requester role - is regular member
			mockDb.limit.mockResolvedValueOnce([regularMember]);

			const result = await service.removeMember(spaceId, memberId, regularUser);

			expect(result.ok).toBe(false);
		});

		it('should return error when space not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.removeMember('nonexistent', memberId, ownerId);

			expect(result.ok).toBe(false);
		});
	});

	describe('changeMemberRole', () => {
		it('should change a member role when requester is the owner', async () => {
			const promotedMember = { ...mockMember, role: 'admin' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// update().set().where().returning()
			mockDb.returning.mockResolvedValueOnce([promotedMember]);

			const result = await service.changeMemberRole(spaceId, memberId, 'admin', ownerId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('admin');
			}
		});

		it('should return error when requester is not the owner', async () => {
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.changeMemberRole(spaceId, memberId, 'admin', 'not-owner');

			expect(result.ok).toBe(false);
		});

		it('should return error when member not found', async () => {
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.changeMemberRole(spaceId, 'nonexistent', 'admin', ownerId);

			expect(result.ok).toBe(false);
		});
	});

	describe('getUserRoleInSpace', () => {
		it('should return owner when user is the space owner', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.getUserRoleInSpace(spaceId, ownerId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe('owner');
			}
		});

		it('should return member role for accepted members', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check membership
			mockDb.limit.mockResolvedValueOnce([mockMember]);

			const result = await service.getUserRoleInSpace(spaceId, memberId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe('member');
			}
		});

		it('should return admin role for admin members', async () => {
			const adminMember = { ...mockMember, role: 'admin' as const };
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check membership
			mockDb.limit.mockResolvedValueOnce([adminMember]);

			const result = await service.getUserRoleInSpace(spaceId, adminMember.userId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe('admin');
			}
		});

		it('should return null when user is not a member', async () => {
			// getSpace call
			mockDb.limit.mockResolvedValueOnce([mockSpace]);
			// Check membership - not found
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getUserRoleInSpace(spaceId, 'stranger');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
		});

		it('should return error when space not found', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.getUserRoleInSpace('nonexistent', ownerId);

			expect(result.ok).toBe(false);
		});
	});

	describe('getPendingInvitations', () => {
		it('should return pending invitations with space details', async () => {
			const pendingMember = { ...mockMember, invitationStatus: 'pending' as const };
			// Get pending invitations - where is terminal
			mockDb.where.mockResolvedValueOnce([pendingMember]);
			// getSpace call for each invitation
			mockDb.limit.mockResolvedValueOnce([mockSpace]);

			const result = await service.getPendingInvitations(memberId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].invitation.invitationStatus).toBe('pending');
				expect(result.value[0].space.id).toBe(spaceId);
			}
		});

		it('should return empty array when no pending invitations', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getPendingInvitations(memberId);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
		});

		it('should return error on database failure', async () => {
			mockDb.where.mockRejectedValueOnce(new Error('DB error'));

			const result = await service.getPendingInvitations(memberId);

			expect(result.ok).toBe(false);
		});
	});
});
