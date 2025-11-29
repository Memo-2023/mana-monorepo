/**
 * Document Service - CRUD operations via Backend API
 */

import { documentApi, conversationApi, type Document } from './api';

export type { Document };

export type DocumentWithConversation = Document & {
	conversationTitle: string;
};

export const documentService = {
	/**
	 * Get all documents for a user (latest version of each)
	 * This requires fetching conversations first, then documents
	 */
	async getUserDocuments(userId: string): Promise<DocumentWithConversation[]> {
		// Get all conversations (the API will filter by user)
		const conversations = await conversationApi.getConversations();

		// Filter to only document mode conversations
		const documentConversations = conversations.filter((c) => c.documentMode);

		if (documentConversations.length === 0) {
			return [];
		}

		// For each conversation, load the latest document version
		const documents: DocumentWithConversation[] = [];

		for (const conv of documentConversations) {
			const doc = await documentApi.getLatestDocument(conv.id);

			if (doc) {
				documents.push({
					...doc,
					conversationTitle: conv.title || 'Unbenannte Konversation',
				});
			}
		}

		return documents;
	},

	/**
	 * Get the latest document for a conversation
	 */
	async getLatestDocument(conversationId: string): Promise<Document | null> {
		return documentApi.getLatestDocument(conversationId);
	},

	/**
	 * Create a new document
	 */
	async createDocument(conversationId: string, content: string): Promise<Document | null> {
		return documentApi.createDocument(conversationId, content);
	},

	/**
	 * Create a new version of a document
	 */
	async createDocumentVersion(conversationId: string, content: string): Promise<Document | null> {
		return documentApi.createDocumentVersion(conversationId, content);
	},

	/**
	 * Get all versions of a document
	 */
	async getAllDocumentVersions(conversationId: string): Promise<Document[]> {
		return documentApi.getAllDocumentVersions(conversationId);
	},

	/**
	 * Check if a document exists for a conversation
	 */
	async hasDocument(conversationId: string): Promise<boolean> {
		return documentApi.hasDocument(conversationId);
	},

	/**
	 * Delete a specific document version
	 */
	async deleteDocumentVersion(documentId: string): Promise<boolean> {
		return documentApi.deleteDocumentVersion(documentId);
	},
};
