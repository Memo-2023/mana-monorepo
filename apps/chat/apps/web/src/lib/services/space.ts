/**
 * Space Service - CRUD operations via Backend API
 */

import { spaceApi, type Space, type SpaceMember } from './api';

export type { Space, SpaceMember };

export const spaceService = {
	/**
	 * Get all spaces for the current user (both owned and member of)
	 */
	async getUserSpaces(userId: string): Promise<Space[]> {
		return spaceApi.getUserSpaces();
	},

	/**
	 * Get a single space by ID
	 */
	async getSpace(spaceId: string): Promise<Space | null> {
		return spaceApi.getSpace(spaceId);
	},

	/**
	 * Create a new space
	 */
	async createSpace(space: {
		name: string;
		description?: string;
		ownerId: string;
	}): Promise<string | null> {
		const result = await spaceApi.createSpace(space.name, space.description);
		return result?.id || null;
	},

	/**
	 * Update a space
	 */
	async updateSpace(
		spaceId: string,
		updates: { name?: string; description?: string; isArchived?: boolean }
	): Promise<boolean> {
		return spaceApi.updateSpace(spaceId, updates);
	},

	/**
	 * Delete a space
	 */
	async deleteSpace(spaceId: string): Promise<boolean> {
		return spaceApi.deleteSpace(spaceId);
	},

	/**
	 * Get members of a space
	 */
	async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
		return spaceApi.getSpaceMembers(spaceId);
	},

	/**
	 * Get user's role in a space
	 */
	async getUserRoleInSpace(
		spaceId: string,
		userId: string
	): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
		return spaceApi.getUserRoleInSpace(spaceId);
	},

	/**
	 * Leave a space (remove self from members)
	 */
	async leaveSpace(spaceId: string, userId: string): Promise<boolean> {
		return spaceApi.removeMember(spaceId, userId);
	},

	/**
	 * Invite a user to a space
	 */
	async inviteUserToSpace(
		spaceId: string,
		userId: string,
		role: 'admin' | 'member' | 'viewer' = 'member'
	): Promise<boolean> {
		return spaceApi.inviteUser(spaceId, userId, role);
	},

	/**
	 * Respond to a space invitation
	 */
	async respondToInvitation(spaceId: string, status: 'accepted' | 'declined'): Promise<boolean> {
		return spaceApi.respondToInvitation(spaceId, status);
	},

	/**
	 * Get pending invitations for the current user
	 */
	async getPendingInvitations(): Promise<Array<{ invitation: SpaceMember; space: Space }>> {
		return spaceApi.getPendingInvitations();
	},

	/**
	 * Remove a member from a space
	 */
	async removeMember(spaceId: string, userId: string): Promise<boolean> {
		return spaceApi.removeMember(spaceId, userId);
	},

	/**
	 * Change a member's role
	 */
	async changeMemberRole(
		spaceId: string,
		userId: string,
		newRole: 'admin' | 'member' | 'viewer'
	): Promise<boolean> {
		return spaceApi.changeMemberRole(spaceId, userId, newRole);
	},
};
