/**
 * Space Service - CRUD operations via Backend API
 */
import { spaceApi, type Space as ApiSpace, type SpaceMember as ApiSpaceMember } from './api';

// Re-export types with backwards-compatible naming (snake_case for mobile)
export type Space = {
	id: string;
	name: string;
	description?: string;
	owner_id: string;
	created_at: string;
	updated_at: string;
	is_archived: boolean;
};

export type SpaceMember = {
	id: string;
	space_id: string;
	user_id: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	invitation_status: 'pending' | 'accepted' | 'declined';
	invited_by?: string;
	invited_at: string;
	joined_at?: string;
	created_at: string;
	updated_at: string;
};

// Helper to convert API response to local format
function toLocalSpace(space: ApiSpace): Space {
	return {
		id: space.id,
		name: space.name,
		description: space.description,
		owner_id: space.ownerId,
		created_at: space.createdAt,
		updated_at: space.updatedAt,
		is_archived: space.isArchived,
	};
}

function toLocalSpaceMember(member: ApiSpaceMember): SpaceMember {
	return {
		id: member.id,
		space_id: member.spaceId,
		user_id: member.userId,
		role: member.role,
		invitation_status: member.invitationStatus,
		invited_by: member.invitedBy,
		invited_at: member.invitedAt,
		joined_at: member.joinedAt,
		created_at: member.createdAt,
		updated_at: member.updatedAt,
	};
}

/**
 * Get all spaces for a user (both owned and member of)
 */
export async function getUserSpaces(userId: string): Promise<Space[]> {
	try {
		const spaces = await spaceApi.getUserSpaces();
		return spaces.map(toLocalSpace);
	} catch (error) {
		console.error('Error in getUserSpaces:', error);
		return [];
	}
}

/**
 * Get spaces the user owns
 */
export async function getOwnedSpaces(userId: string): Promise<Space[]> {
	try {
		const spaces = await spaceApi.getOwnedSpaces();
		return spaces.map(toLocalSpace);
	} catch (error) {
		console.error('Error in getOwnedSpaces:', error);
		return [];
	}
}

/**
 * Get a single space by ID
 */
export async function getSpace(spaceId: string): Promise<Space | null> {
	try {
		const space = await spaceApi.getSpace(spaceId);
		if (!space) {
			return null;
		}
		return toLocalSpace(space);
	} catch (error) {
		console.error('Error in getSpace:', error);
		return null;
	}
}

/**
 * Create a new space
 */
export async function createSpace(
	userId: string,
	name: string,
	description?: string
): Promise<string | null> {
	try {
		const space = await spaceApi.createSpace(name, description);
		return space?.id || null;
	} catch (error) {
		console.error('Error in createSpace:', error);
		return null;
	}
}

/**
 * Update a space
 */
export async function updateSpace(
	spaceId: string,
	updates: { name?: string; description?: string; is_archived?: boolean }
): Promise<boolean> {
	try {
		return await spaceApi.updateSpace(spaceId, {
			name: updates.name,
			description: updates.description,
			isArchived: updates.is_archived,
		});
	} catch (error) {
		console.error('Error in updateSpace:', error);
		return false;
	}
}

/**
 * Delete a space
 */
export async function deleteSpace(spaceId: string): Promise<boolean> {
	try {
		return await spaceApi.deleteSpace(spaceId);
	} catch (error) {
		console.error('Error in deleteSpace:', error);
		return false;
	}
}

/**
 * Get members of a space
 */
export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
	try {
		const members = await spaceApi.getSpaceMembers(spaceId);
		return members.map(toLocalSpaceMember);
	} catch (error) {
		console.error('Error in getSpaceMembers:', error);
		return [];
	}
}

/**
 * Add a member to a space (invite)
 */
export async function inviteUserToSpace(
	spaceId: string,
	userId: string,
	invitedByUserId: string,
	role: 'admin' | 'member' | 'viewer' = 'member'
): Promise<boolean> {
	try {
		return await spaceApi.inviteUser(spaceId, userId, role);
	} catch (error) {
		console.error('Error in inviteUserToSpace:', error);
		return false;
	}
}

/**
 * Accept or decline a space invitation
 */
export async function respondToInvitation(
	spaceId: string,
	userId: string,
	status: 'accepted' | 'declined'
): Promise<boolean> {
	try {
		return await spaceApi.respondToInvitation(spaceId, status);
	} catch (error) {
		console.error('Error in respondToInvitation:', error);
		return false;
	}
}

/**
 * Remove a member from a space
 */
export async function removeMember(spaceId: string, userId: string): Promise<boolean> {
	try {
		return await spaceApi.removeMember(spaceId, userId);
	} catch (error) {
		console.error('Error in removeMember:', error);
		return false;
	}
}

/**
 * Change a member's role
 */
export async function changeMemberRole(
	spaceId: string,
	userId: string,
	newRole: 'admin' | 'member' | 'viewer'
): Promise<boolean> {
	try {
		return await spaceApi.changeMemberRole(spaceId, userId, newRole);
	} catch (error) {
		console.error('Error in changeMemberRole:', error);
		return false;
	}
}

/**
 * Get user's role in a space
 */
export async function getUserRoleInSpace(
	spaceId: string,
	userId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
	try {
		return await spaceApi.getUserRoleInSpace(spaceId);
	} catch (error) {
		console.error('Error in getUserRoleInSpace:', error);
		return null;
	}
}

/**
 * Get pending space invitations for a user
 */
export async function getPendingInvitations(
	userId: string
): Promise<Array<{ invitation: SpaceMember; space: Space }>> {
	try {
		const invitations = await spaceApi.getPendingInvitations();
		return invitations.map((inv) => ({
			invitation: toLocalSpaceMember(inv.invitation),
			space: toLocalSpace(inv.space),
		}));
	} catch (error) {
		console.error('Error in getPendingInvitations:', error);
		return [];
	}
}
