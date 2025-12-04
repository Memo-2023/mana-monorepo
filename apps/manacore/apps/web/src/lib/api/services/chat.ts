/**
 * Chat API Service
 *
 * Fetches conversations from the Chat backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const CHAT_API_URL = import.meta.env.PUBLIC_CHAT_API_URL || 'http://localhost:3002';

const client = createApiClient(CHAT_API_URL);

/**
 * Conversation entity from Chat backend
 */
export interface Conversation {
	id: string;
	userId: string;
	title: string;
	modelId: string;
	spaceId?: string;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	isArchived: boolean;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Message entity from Chat backend
 */
export interface Message {
	id: string;
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
	createdAt: string;
}

/**
 * AI Model entity from Chat backend
 */
export interface AiModel {
	id: string;
	name: string;
	description: string;
}

/**
 * Chat service for dashboard widgets
 */
export const chatService = {
	/**
	 * Get recent conversations
	 */
	async getRecentConversations(limit: number = 5): Promise<ApiResult<Conversation[]>> {
		const result = await client.get<Conversation[]>('/conversations');

		if (result.error || !result.data) {
			return result;
		}

		// Sort by updatedAt and limit
		const sorted = result.data
			.filter((c) => !c.isArchived)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, limit);

		return { data: sorted, error: null };
	},

	/**
	 * Get pinned conversations
	 */
	async getPinnedConversations(): Promise<ApiResult<Conversation[]>> {
		const result = await client.get<Conversation[]>('/conversations');

		if (result.error || !result.data) {
			return result;
		}

		const pinned = result.data.filter((c) => c.isPinned && !c.isArchived);
		return { data: pinned, error: null };
	},

	/**
	 * Get available AI models
	 */
	async getModels(): Promise<ApiResult<AiModel[]>> {
		return client.get<AiModel[]>('/chat/models');
	},

	/**
	 * Get conversation count
	 */
	async getConversationCount(): Promise<ApiResult<{ total: number; pinned: number }>> {
		const result = await client.get<Conversation[]>('/conversations');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const active = result.data.filter((c) => !c.isArchived);
		const pinned = active.filter((c) => c.isPinned);

		return { data: { total: active.length, pinned: pinned.length }, error: null };
	},
};
