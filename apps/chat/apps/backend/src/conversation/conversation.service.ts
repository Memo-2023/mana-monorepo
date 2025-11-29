import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { type AsyncResult, ok, err, DatabaseError, NotFoundError } from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	conversations,
	type Conversation,
	type NewConversation,
} from '../db/schema/conversations.schema';
import { messages, type Message, type NewMessage } from '../db/schema/messages.schema';

@Injectable()
export class ConversationService {
	private readonly logger = new Logger(ConversationService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getConversations(userId: string, spaceId?: string): AsyncResult<Conversation[]> {
		try {
			const conditions = [eq(conversations.userId, userId), eq(conversations.isArchived, false)];

			if (spaceId) {
				conditions.push(eq(conversations.spaceId, spaceId));
			}

			const result = await this.db
				.select()
				.from(conversations)
				.where(and(...conditions))
				.orderBy(desc(conversations.isPinned), desc(conversations.updatedAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching conversations', error);
			return err(DatabaseError.queryFailed('Failed to fetch conversations'));
		}
	}

	async getArchivedConversations(userId: string): AsyncResult<Conversation[]> {
		try {
			const result = await this.db
				.select()
				.from(conversations)
				.where(and(eq(conversations.userId, userId), eq(conversations.isArchived, true)))
				.orderBy(desc(conversations.updatedAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching archived conversations', error);
			return err(DatabaseError.queryFailed('Failed to fetch archived conversations'));
		}
	}

	async getConversation(id: string, userId: string): AsyncResult<Conversation> {
		try {
			const result = await this.db
				.select()
				.from(conversations)
				.where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
				.limit(1);

			if (result.length === 0) {
				return err(new NotFoundError('Conversation', id));
			}

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error fetching conversation', error);
			return err(DatabaseError.queryFailed('Failed to fetch conversation'));
		}
	}

	async getMessages(conversationId: string, userId: string): AsyncResult<Message[]> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.select()
				.from(messages)
				.where(eq(messages.conversationId, conversationId))
				.orderBy(asc(messages.createdAt));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching messages', error);
			return err(DatabaseError.queryFailed('Failed to fetch messages'));
		}
	}

	async createConversation(
		userId: string,
		modelId: string,
		options?: {
			title?: string;
			templateId?: string;
			conversationMode?: 'free' | 'guided' | 'template';
			documentMode?: boolean;
			spaceId?: string;
		}
	): AsyncResult<Conversation> {
		try {
			const newConversation: NewConversation = {
				userId,
				modelId,
				title: options?.title || 'Neue Unterhaltung',
				templateId: options?.templateId,
				conversationMode: options?.conversationMode || 'free',
				documentMode: options?.documentMode || false,
				spaceId: options?.spaceId,
				isArchived: false,
			};

			const result = await this.db.insert(conversations).values(newConversation).returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error creating conversation', error);
			return err(DatabaseError.queryFailed('Failed to create conversation'));
		}
	}

	async addMessage(
		conversationId: string,
		userId: string,
		sender: 'user' | 'assistant' | 'system',
		messageText: string
	): AsyncResult<Message> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const newMessage: NewMessage = {
				conversationId,
				sender,
				messageText,
			};

			const result = await this.db.insert(messages).values(newMessage).returning();

			// Update conversation updated_at
			await this.db
				.update(conversations)
				.set({ updatedAt: new Date() })
				.where(eq(conversations.id, conversationId));

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error adding message', error);
			return err(DatabaseError.queryFailed('Failed to add message'));
		}
	}

	async updateTitle(
		conversationId: string,
		userId: string,
		title: string
	): AsyncResult<Conversation> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.update(conversations)
				.set({ title, updatedAt: new Date() })
				.where(eq(conversations.id, conversationId))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error updating title', error);
			return err(DatabaseError.queryFailed('Failed to update title'));
		}
	}

	async archiveConversation(conversationId: string, userId: string): AsyncResult<Conversation> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.update(conversations)
				.set({ isArchived: true, updatedAt: new Date() })
				.where(eq(conversations.id, conversationId))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error archiving conversation', error);
			return err(DatabaseError.queryFailed('Failed to archive conversation'));
		}
	}

	async unarchiveConversation(conversationId: string, userId: string): AsyncResult<Conversation> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.db
				.select()
				.from(conversations)
				.where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
				.limit(1);

			if (convResult.length === 0) {
				return err(new NotFoundError('Conversation', conversationId));
			}

			const result = await this.db
				.update(conversations)
				.set({ isArchived: false, updatedAt: new Date() })
				.where(eq(conversations.id, conversationId))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error unarchiving conversation', error);
			return err(DatabaseError.queryFailed('Failed to unarchive conversation'));
		}
	}

	async deleteConversation(conversationId: string, userId: string): AsyncResult<void> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			// Messages will be cascade deleted due to foreign key constraint
			await this.db.delete(conversations).where(eq(conversations.id, conversationId));

			return ok(undefined);
		} catch (error) {
			this.logger.error('Error deleting conversation', error);
			return err(DatabaseError.queryFailed('Failed to delete conversation'));
		}
	}

	async getMessageCount(conversationId: string, userId: string): AsyncResult<number> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(messages)
				.where(eq(messages.conversationId, conversationId));

			return ok(Number(result[0]?.count || 0));
		} catch (error) {
			this.logger.error('Error getting message count', error);
			return err(DatabaseError.queryFailed('Failed to get message count'));
		}
	}

	async pinConversation(conversationId: string, userId: string): AsyncResult<Conversation> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.update(conversations)
				.set({ isPinned: true, updatedAt: new Date() })
				.where(eq(conversations.id, conversationId))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error pinning conversation', error);
			return err(DatabaseError.queryFailed('Failed to pin conversation'));
		}
	}

	async unpinConversation(conversationId: string, userId: string): AsyncResult<Conversation> {
		try {
			// First verify the conversation belongs to the user
			const convResult = await this.getConversation(conversationId, userId);
			if (!convResult.ok) {
				return err(convResult.error);
			}

			const result = await this.db
				.update(conversations)
				.set({ isPinned: false, updatedAt: new Date() })
				.where(eq(conversations.id, conversationId))
				.returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error unpinning conversation', error);
			return err(DatabaseError.queryFailed('Failed to unpin conversation'));
		}
	}
}
