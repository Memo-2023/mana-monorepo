import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	/**
	 * Get user data counts for a specific user
	 */
	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count conversations
		const conversationsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.conversations)
			.where(eq(schema.conversations.userId, userId));
		const conversationsCount = conversationsResult[0]?.count ?? 0;

		// Count messages (through conversations)
		const messagesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.messages)
			.innerJoin(schema.conversations, eq(schema.messages.conversationId, schema.conversations.id))
			.where(eq(schema.conversations.userId, userId));
		const messagesCount = messagesResult[0]?.count ?? 0;

		// Count spaces owned by user
		const spacesOwnedResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.spaces)
			.where(eq(schema.spaces.ownerId, userId));
		const spacesOwnedCount = spacesOwnedResult[0]?.count ?? 0;

		// Count space memberships
		const spaceMembershipsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.spaceMembers)
			.where(eq(schema.spaceMembers.userId, userId));
		const spaceMembershipsCount = spaceMembershipsResult[0]?.count ?? 0;

		// Count documents (through conversations)
		const documentsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.documents)
			.innerJoin(schema.conversations, eq(schema.documents.conversationId, schema.conversations.id))
			.where(eq(schema.conversations.userId, userId));
		const documentsCount = documentsResult[0]?.count ?? 0;

		// Get last activity (most recent conversation or message)
		const lastConversation = await this.db
			.select({ updatedAt: schema.conversations.updatedAt })
			.from(schema.conversations)
			.where(eq(schema.conversations.userId, userId))
			.orderBy(desc(schema.conversations.updatedAt))
			.limit(1);
		const lastActivityAt = lastConversation[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'conversations', count: conversationsCount, label: 'Conversations' },
			{ entity: 'messages', count: messagesCount, label: 'Messages' },
			{ entity: 'spaces_owned', count: spacesOwnedCount, label: 'Spaces (Owned)' },
			{ entity: 'space_memberships', count: spaceMembershipsCount, label: 'Space Memberships' },
			{ entity: 'documents', count: documentsCount, label: 'Documents' },
		];

		const totalCount =
			conversationsCount +
			messagesCount +
			spacesOwnedCount +
			spaceMembershipsCount +
			documentsCount;

		return {
			entities,
			totalCount,
			lastActivityAt,
		};
	}

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete space memberships first
		const deletedMemberships = await this.db
			.delete(schema.spaceMembers)
			.where(eq(schema.spaceMembers.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'space_memberships',
			count: deletedMemberships.length,
			label: 'Space Memberships',
		});
		totalDeleted += deletedMemberships.length;

		// Delete spaces owned by user (cascades to members)
		const deletedSpaces = await this.db
			.delete(schema.spaces)
			.where(eq(schema.spaces.ownerId, userId))
			.returning();
		deletedCounts.push({
			entity: 'spaces_owned',
			count: deletedSpaces.length,
			label: 'Spaces (Owned)',
		});
		totalDeleted += deletedSpaces.length;

		// Delete conversations (cascades to messages and documents)
		const deletedConversations = await this.db
			.delete(schema.conversations)
			.where(eq(schema.conversations.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'conversations',
			count: deletedConversations.length,
			label: 'Conversations',
		});
		totalDeleted += deletedConversations.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return {
			success: true,
			deletedCounts,
			totalDeleted,
		};
	}
}
