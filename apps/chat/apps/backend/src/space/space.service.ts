import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { type AsyncResult, ok, err, DatabaseError, NotFoundError } from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	spaces,
	spaceMembers,
	type Space,
	type NewSpace,
	type SpaceMember,
	type NewSpaceMember,
} from '../db/schema/spaces.schema';

@Injectable()
export class SpaceService {
	private readonly logger = new Logger(SpaceService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getUserSpaces(userId: string): AsyncResult<Space[]> {
		try {
			// Get all space IDs where user is an accepted member
			const memberData = await this.db
				.select({ spaceId: spaceMembers.spaceId })
				.from(spaceMembers)
				.where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.invitationStatus, 'accepted')));

			if (memberData.length === 0) {
				return ok([]);
			}

			const spaceIds = memberData.map((m) => m.spaceId);

			const result = await this.db
				.select()
				.from(spaces)
				.where(and(inArray(spaces.id, spaceIds), eq(spaces.isArchived, false)))
				.orderBy(desc(spaces.createdAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching user spaces', error);
			return err(DatabaseError.queryFailed('Failed to fetch user spaces'));
		}
	}

	async getOwnedSpaces(userId: string): AsyncResult<Space[]> {
		try {
			const result = await this.db
				.select()
				.from(spaces)
				.where(and(eq(spaces.ownerId, userId), eq(spaces.isArchived, false)))
				.orderBy(desc(spaces.createdAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching owned spaces', error);
			return err(DatabaseError.queryFailed('Failed to fetch owned spaces'));
		}
	}

	async getSpace(id: string): AsyncResult<Space> {
		try {
			const result = await this.db.select().from(spaces).where(eq(spaces.id, id)).limit(1);

			if (result.length === 0) {
				return err(new NotFoundError('Space', id));
			}

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error fetching space', error);
			return err(DatabaseError.queryFailed('Failed to fetch space'));
		}
	}

	async createSpace(userId: string, name: string, description?: string): AsyncResult<Space> {
		try {
			const newSpace: NewSpace = {
				ownerId: userId,
				name,
				description,
				isArchived: false,
			};

			const result = await this.db.insert(spaces).values(newSpace).returning();

			// Add owner as an accepted member
			const memberData: NewSpaceMember = {
				spaceId: result[0].id,
				userId,
				role: 'owner',
				invitationStatus: 'accepted',
				joinedAt: new Date(),
			};

			await this.db.insert(spaceMembers).values(memberData);

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error creating space', error);
			return err(DatabaseError.queryFailed('Failed to create space'));
		}
	}

	async updateSpace(
		id: string,
		userId: string,
		data: { name?: string; description?: string; isArchived?: boolean }
	): AsyncResult<Space> {
		try {
			// Verify ownership
			const spaceResult = await this.getSpace(id);
			if (!spaceResult.ok) {
				return err(spaceResult.error);
			}

			if (spaceResult.value.ownerId !== userId) {
				return err(new NotFoundError('Space', id));
			}

			const result = await this.db
				.update(spaces)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(spaces.id, id))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error updating space', error);
			return err(DatabaseError.queryFailed('Failed to update space'));
		}
	}

	async deleteSpace(id: string, userId: string): AsyncResult<void> {
		try {
			// Verify ownership
			const spaceResult = await this.getSpace(id);
			if (!spaceResult.ok) {
				return err(spaceResult.error);
			}

			if (spaceResult.value.ownerId !== userId) {
				return err(new NotFoundError('Space', id));
			}

			// Members will be cascade deleted
			await this.db.delete(spaces).where(eq(spaces.id, id));

			return ok(undefined);
		} catch (error) {
			this.logger.error('Error deleting space', error);
			return err(DatabaseError.queryFailed('Failed to delete space'));
		}
	}

	async getSpaceMembers(spaceId: string): AsyncResult<SpaceMember[]> {
		try {
			const result = await this.db
				.select()
				.from(spaceMembers)
				.where(eq(spaceMembers.spaceId, spaceId))
				.orderBy(spaceMembers.role, desc(spaceMembers.joinedAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching space members', error);
			return err(DatabaseError.queryFailed('Failed to fetch space members'));
		}
	}

	async inviteUserToSpace(
		spaceId: string,
		userId: string,
		invitedByUserId: string,
		role: 'admin' | 'member' | 'viewer' = 'member'
	): AsyncResult<SpaceMember> {
		try {
			// Check if user is already a member
			const existingMember = await this.db
				.select()
				.from(spaceMembers)
				.where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
				.limit(1);

			if (existingMember.length > 0) {
				if (existingMember[0].invitationStatus === 'accepted') {
					return ok(existingMember[0]);
				}

				// Update existing invitation
				const result = await this.db
					.update(spaceMembers)
					.set({
						role,
						invitationStatus: 'pending',
						invitedBy: invitedByUserId,
						invitedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(spaceMembers.id, existingMember[0].id))
					.returning();

				return ok(result[0]);
			}

			// Create new invitation
			const memberData: NewSpaceMember = {
				spaceId,
				userId,
				role,
				invitationStatus: 'pending',
				invitedBy: invitedByUserId,
			};

			const result = await this.db.insert(spaceMembers).values(memberData).returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error inviting user to space', error);
			return err(DatabaseError.queryFailed('Failed to invite user to space'));
		}
	}

	async respondToInvitation(
		spaceId: string,
		userId: string,
		status: 'accepted' | 'declined'
	): AsyncResult<SpaceMember> {
		try {
			const updates: Partial<SpaceMember> = {
				invitationStatus: status,
				updatedAt: new Date(),
			};

			if (status === 'accepted') {
				updates.joinedAt = new Date();
			}

			const result = await this.db
				.update(spaceMembers)
				.set(updates)
				.where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
				.returning();

			if (result.length === 0) {
				return err(new NotFoundError('SpaceMember', `${spaceId}:${userId}`));
			}

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error responding to invitation', error);
			return err(DatabaseError.queryFailed('Failed to respond to invitation'));
		}
	}

	async removeMember(spaceId: string, userId: string, requestingUserId: string): AsyncResult<void> {
		try {
			// Verify the requesting user is the owner or an admin
			const spaceResult = await this.getSpace(spaceId);
			if (!spaceResult.ok) {
				return err(spaceResult.error);
			}

			const requestingMember = await this.db
				.select()
				.from(spaceMembers)
				.where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, requestingUserId)))
				.limit(1);

			const isOwner = spaceResult.value.ownerId === requestingUserId;
			const isAdmin = requestingMember.length > 0 && requestingMember[0].role === 'admin';

			if (!isOwner && !isAdmin) {
				return err(new NotFoundError('SpaceMember', `${spaceId}:${userId}`));
			}

			await this.db
				.delete(spaceMembers)
				.where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)));

			return ok(undefined);
		} catch (error) {
			this.logger.error('Error removing member', error);
			return err(DatabaseError.queryFailed('Failed to remove member'));
		}
	}

	async changeMemberRole(
		spaceId: string,
		userId: string,
		newRole: 'admin' | 'member' | 'viewer',
		requestingUserId: string
	): AsyncResult<SpaceMember> {
		try {
			// Verify the requesting user is the owner
			const spaceResult = await this.getSpace(spaceId);
			if (!spaceResult.ok) {
				return err(spaceResult.error);
			}

			if (spaceResult.value.ownerId !== requestingUserId) {
				return err(new NotFoundError('SpaceMember', `${spaceId}:${userId}`));
			}

			const result = await this.db
				.update(spaceMembers)
				.set({ role: newRole, updatedAt: new Date() })
				.where(and(eq(spaceMembers.spaceId, spaceId), eq(spaceMembers.userId, userId)))
				.returning();

			if (result.length === 0) {
				return err(new NotFoundError('SpaceMember', `${spaceId}:${userId}`));
			}

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error changing member role', error);
			return err(DatabaseError.queryFailed('Failed to change member role'));
		}
	}

	async getUserRoleInSpace(
		spaceId: string,
		userId: string
	): AsyncResult<'owner' | 'admin' | 'member' | 'viewer' | null> {
		try {
			// Check if owner
			const spaceResult = await this.getSpace(spaceId);
			if (!spaceResult.ok) {
				return err(spaceResult.error);
			}

			if (spaceResult.value.ownerId === userId) {
				return ok('owner');
			}

			// Check membership
			const memberResult = await this.db
				.select()
				.from(spaceMembers)
				.where(
					and(
						eq(spaceMembers.spaceId, spaceId),
						eq(spaceMembers.userId, userId),
						eq(spaceMembers.invitationStatus, 'accepted')
					)
				)
				.limit(1);

			if (memberResult.length === 0) {
				return ok(null);
			}

			return ok(memberResult[0].role as 'admin' | 'member' | 'viewer');
		} catch (error) {
			this.logger.error('Error getting user role in space', error);
			return err(DatabaseError.queryFailed('Failed to get user role in space'));
		}
	}

	async getPendingInvitations(
		userId: string
	): AsyncResult<Array<{ invitation: SpaceMember; space: Space }>> {
		try {
			const invitations = await this.db
				.select()
				.from(spaceMembers)
				.where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.invitationStatus, 'pending')));

			const results: Array<{ invitation: SpaceMember; space: Space }> = [];

			for (const invitation of invitations) {
				const spaceResult = await this.getSpace(invitation.spaceId);
				if (spaceResult.ok) {
					results.push({ invitation, space: spaceResult.value });
				}
			}

			return ok(results);
		} catch (error) {
			this.logger.error('Error fetching pending invitations', error);
			return err(DatabaseError.queryFailed('Failed to fetch pending invitations'));
		}
	}
}
