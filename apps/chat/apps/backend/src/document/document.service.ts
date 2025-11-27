import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { type AsyncResult, ok, err, DatabaseError, NotFoundError } from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { documents, type Document, type NewDocument } from '../db/schema/documents.schema';
import { conversations } from '../db/schema/conversations.schema';

@Injectable()
export class DocumentService {
	private readonly logger = new Logger(DocumentService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	private async verifyConversationOwnership(
		conversationId: string,
		userId: string
	): AsyncResult<void> {
		const result = await this.db
			.select()
			.from(conversations)
			.where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
			.limit(1);

		if (result.length === 0) {
			return err(new NotFoundError('Conversation', conversationId));
		}

		return ok(undefined);
	}

	async createDocument(
		conversationId: string,
		userId: string,
		content: string
	): AsyncResult<Document> {
		try {
			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			const newDocument: NewDocument = {
				conversationId,
				version: 1,
				content,
			};

			const result = await this.db.insert(documents).values(newDocument).returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error creating document', error);
			return err(DatabaseError.queryFailed('Failed to create document'));
		}
	}

	async createDocumentVersion(
		conversationId: string,
		userId: string,
		content: string
	): AsyncResult<Document> {
		try {
			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			// Get the latest version number
			const latestDoc = await this.db
				.select({ version: documents.version })
				.from(documents)
				.where(eq(documents.conversationId, conversationId))
				.orderBy(desc(documents.version))
				.limit(1);

			const newVersion = (latestDoc[0]?.version || 0) + 1;

			const newDocument: NewDocument = {
				conversationId,
				version: newVersion,
				content,
			};

			const result = await this.db.insert(documents).values(newDocument).returning();

			return ok(result[0]);
		} catch (error) {
			this.logger.error('Error creating document version', error);
			return err(DatabaseError.queryFailed('Failed to create document version'));
		}
	}

	async getLatestDocument(conversationId: string, userId: string): AsyncResult<Document | null> {
		try {
			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			const result = await this.db
				.select()
				.from(documents)
				.where(eq(documents.conversationId, conversationId))
				.orderBy(desc(documents.version))
				.limit(1);

			return ok(result.length > 0 ? result[0] : null);
		} catch (error) {
			this.logger.error('Error fetching latest document', error);
			return err(DatabaseError.queryFailed('Failed to fetch latest document'));
		}
	}

	async getAllDocumentVersions(conversationId: string, userId: string): AsyncResult<Document[]> {
		try {
			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			const result = await this.db
				.select()
				.from(documents)
				.where(eq(documents.conversationId, conversationId))
				.orderBy(desc(documents.version));

			return ok(result);
		} catch (error) {
			this.logger.error('Error fetching document versions', error);
			return err(DatabaseError.queryFailed('Failed to fetch document versions'));
		}
	}

	async hasDocument(conversationId: string, userId: string): AsyncResult<boolean> {
		try {
			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			const result = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(documents)
				.where(eq(documents.conversationId, conversationId));

			return ok(Number(result[0]?.count || 0) > 0);
		} catch (error) {
			this.logger.error('Error checking document existence', error);
			return err(DatabaseError.queryFailed('Failed to check document existence'));
		}
	}

	async deleteDocumentVersion(documentId: string, userId: string): AsyncResult<void> {
		try {
			// Get the document to verify ownership
			const doc = await this.db
				.select()
				.from(documents)
				.where(eq(documents.id, documentId))
				.limit(1);

			if (doc.length === 0) {
				return err(new NotFoundError('Document', documentId));
			}

			// Verify conversation ownership
			const ownershipResult = await this.verifyConversationOwnership(doc[0].conversationId, userId);
			if (!ownershipResult.ok) {
				return err(ownershipResult.error);
			}

			await this.db.delete(documents).where(eq(documents.id, documentId));

			return ok(undefined);
		} catch (error) {
			this.logger.error('Error deleting document version', error);
			return err(DatabaseError.queryFailed('Failed to delete document version'));
		}
	}
}
