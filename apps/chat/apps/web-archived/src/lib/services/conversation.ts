/**
 * Conversation Service - CRUD operations via Backend API
 *
 * Note: userId is derived from JWT token on the backend,
 * so we don't need to pass it from the frontend.
 */

import { conversationApi, chatApi } from './api';
import type { Conversation, Message, ChatMessage } from './api';

export type { Conversation, Message };

export const conversationService = {
	/**
	 * Create a new conversation
	 */
	async createConversation(options: {
		modelId: string;
		mode?: 'free' | 'guided' | 'template';
		templateId?: string;
		documentMode?: boolean;
		spaceId?: string;
	}): Promise<string | null> {
		const conversation = await conversationApi.createConversation({
			modelId: options.modelId,
			conversationMode: options.mode ?? 'free',
			templateId: options.templateId,
			documentMode: options.documentMode ?? false,
			spaceId: options.spaceId,
		});

		return conversation?.id || null;
	},

	/**
	 * Get all active conversations
	 */
	async getConversations(spaceId?: string): Promise<Conversation[]> {
		return conversationApi.getConversations(spaceId);
	},

	/**
	 * Get archived conversations
	 */
	async getArchivedConversations(): Promise<Conversation[]> {
		return conversationApi.getArchivedConversations();
	},

	/**
	 * Get a single conversation
	 */
	async getConversation(conversationId: string): Promise<Conversation | null> {
		return conversationApi.getConversation(conversationId);
	},

	/**
	 * Get messages for a conversation
	 */
	async getMessages(conversationId: string): Promise<Message[]> {
		return conversationApi.getMessages(conversationId);
	},

	/**
	 * Add a message to a conversation
	 */
	async addMessage(
		conversationId: string,
		sender: 'user' | 'assistant' | 'system',
		messageText: string
	): Promise<string | null> {
		const message = await conversationApi.addMessage(conversationId, sender, messageText);
		return message?.id || null;
	},

	/**
	 * Update conversation title
	 */
	async updateTitle(conversationId: string, title: string): Promise<boolean> {
		return conversationApi.updateTitle(conversationId, title);
	},

	/**
	 * Archive a conversation
	 */
	async archiveConversation(conversationId: string): Promise<boolean> {
		return conversationApi.archiveConversation(conversationId);
	},

	/**
	 * Unarchive a conversation
	 */
	async unarchiveConversation(conversationId: string): Promise<boolean> {
		return conversationApi.unarchiveConversation(conversationId);
	},

	/**
	 * Delete a conversation permanently
	 */
	async deleteConversation(conversationId: string): Promise<boolean> {
		return conversationApi.deleteConversation(conversationId);
	},

	/**
	 * Pin a conversation
	 */
	async pinConversation(conversationId: string): Promise<boolean> {
		return conversationApi.pinConversation(conversationId);
	},

	/**
	 * Unpin a conversation
	 */
	async unpinConversation(conversationId: string): Promise<boolean> {
		return conversationApi.unpinConversation(conversationId);
	},

	/**
	 * Send a message and get AI response
	 */
	async sendMessageAndGetResponse(
		conversationId: string,
		userMessage: string,
		modelId: string
	): Promise<{
		userMessageId: string | null;
		assistantMessageId: string | null;
		assistantResponse: string;
		title?: string;
	}> {
		// Add user message
		const userMessageId = await this.addMessage(conversationId, 'user', userMessage);

		// Load all messages for context
		const messages = await this.getMessages(conversationId);

		// Build chat messages for API
		const chatMessages: ChatMessage[] = messages.map((m) => ({
			role: m.sender === 'user' ? 'user' : m.sender === 'assistant' ? 'assistant' : 'system',
			content: m.messageText,
		}));

		// Get AI response
		const response = await chatApi.createCompletion({
			messages: chatMessages,
			modelId,
		});

		if (!response) {
			return {
				userMessageId,
				assistantMessageId: null,
				assistantResponse: 'Fehler beim Abrufen der Antwort.',
			};
		}

		// Save assistant message
		const assistantMessageId = await this.addMessage(conversationId, 'assistant', response.content);

		// Generate title if this is a new conversation (first or second message)
		let title: string | undefined;
		if (messages.length <= 2) {
			title = await this.generateTitle(userMessage, modelId);
			if (title) {
				await this.updateTitle(conversationId, title);
			}
		}

		return {
			userMessageId,
			assistantMessageId,
			assistantResponse: response.content,
			title,
		};
	},

	/**
	 * Generate a conversation title based on user message using AI
	 */
	async generateTitle(userMessage: string, modelId: string): Promise<string> {
		try {
			const titlePrompt = `Schreibe eine kurze, prägnante Überschrift (maximal 5 Wörter) für diesen Chat: "${userMessage}"`;

			const response = await chatApi.createCompletion({
				messages: [{ role: 'user', content: titlePrompt }],
				modelId,
				temperature: 0.3,
				maxTokens: 50,
			});

			if (!response) {
				console.warn('Title generation returned no response, using fallback');
				return this.createFallbackTitle(userMessage);
			}

			// Clean up title
			let title = response.content
				.trim()
				.replace(/^["']|["']$/g, '')
				.replace(/\.$/g, '');

			if (title.length > 100) {
				title = title.substring(0, 97) + '...';
			}

			return title || this.createFallbackTitle(userMessage);
		} catch (error) {
			console.error('Error generating title:', error);
			return this.createFallbackTitle(userMessage);
		}
	},

	/**
	 * Create a fallback title from the first words of the message
	 */
	createFallbackTitle(message: string): string {
		const words = message.trim().split(/\s+/).slice(0, 5);
		let title = words.join(' ');
		if (message.trim().split(/\s+/).length > 5) {
			title += '...';
		}
		return title || 'Neue Konversation';
	},
};
