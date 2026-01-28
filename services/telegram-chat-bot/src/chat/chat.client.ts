import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AIModel {
	id: string;
	name: string;
	provider: string;
	isLocal: boolean;
	isDefault: boolean;
}

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	createdAt: string;
}

export interface Conversation {
	id: string;
	title: string;
	modelId: string;
	createdAt: string;
	updatedAt: string;
	messageCount?: number;
}

export interface ChatCompletionResponse {
	message: string;
	conversationId: string;
	model: string;
}

@Injectable()
export class ChatClient {
	private readonly logger = new Logger(ChatClient.name);
	private readonly apiUrl: string;

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('chat.apiUrl') || 'http://localhost:3002';
	}

	/**
	 * Get available AI models
	 */
	async getModels(accessToken: string): Promise<AIModel[]> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/chat/models`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				this.logger.error(`Failed to get models: ${response.status}`);
				return [];
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Error fetching models: ${error}`);
			return [];
		}
	}

	/**
	 * Get user conversations
	 */
	async getConversations(accessToken: string, limit = 10): Promise<Conversation[]> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/conversations?limit=${limit}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				this.logger.error(`Failed to get conversations: ${response.status}`);
				return [];
			}

			const data = await response.json();
			return data.conversations || data || [];
		} catch (error) {
			this.logger.error(`Error fetching conversations: ${error}`);
			return [];
		}
	}

	/**
	 * Get conversation messages
	 */
	async getMessages(accessToken: string, conversationId: string, limit = 20): Promise<Message[]> {
		try {
			const response = await fetch(
				`${this.apiUrl}/api/v1/conversations/${conversationId}/messages?limit=${limit}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			if (!response.ok) {
				this.logger.error(`Failed to get messages: ${response.status}`);
				return [];
			}

			const data = await response.json();
			return data.messages || data || [];
		} catch (error) {
			this.logger.error(`Error fetching messages: ${error}`);
			return [];
		}
	}

	/**
	 * Create a new conversation
	 */
	async createConversation(
		accessToken: string,
		title: string,
		modelId?: string
	): Promise<Conversation | null> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/conversations`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title, modelId }),
			});

			if (!response.ok) {
				this.logger.error(`Failed to create conversation: ${response.status}`);
				return null;
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Error creating conversation: ${error}`);
			return null;
		}
	}

	/**
	 * Send a chat message and get AI response
	 */
	async sendMessage(
		accessToken: string,
		message: string,
		conversationId?: string,
		modelId?: string
	): Promise<ChatCompletionResponse | null> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/chat/completions`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message,
					conversationId,
					model: modelId,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`Failed to send message: ${response.status} - ${errorText}`);
				return null;
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Error sending message: ${error}`);
			return null;
		}
	}

	/**
	 * Stream chat completion (returns async generator)
	 */
	async *streamMessage(
		accessToken: string,
		message: string,
		conversationId?: string,
		modelId?: string
	): AsyncGenerator<string, void, unknown> {
		try {
			const response = await fetch(`${this.apiUrl}/api/v1/chat/completions`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message,
					conversationId,
					model: modelId,
					stream: true,
				}),
			});

			if (!response.ok || !response.body) {
				this.logger.error(`Failed to stream message: ${response.status}`);
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				yield chunk;
			}
		} catch (error) {
			this.logger.error(`Error streaming message: ${error}`);
		}
	}
}
