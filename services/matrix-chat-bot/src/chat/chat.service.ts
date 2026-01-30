import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Model {
	id: string;
	name: string;
	description?: string;
	provider: string;
	isActive: boolean;
	isDefault: boolean;
}

export interface Conversation {
	id: string;
	userId: string;
	modelId: string;
	title: string;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	isArchived: boolean;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
	createdAt: string;
}

export interface ChatCompletionResponse {
	content: string;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	private baseUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('chat.url') || 'http://localhost:3002';
		this.apiPrefix = this.configService.get<string>('chat.apiPrefix') || '';
	}

	private getUrl(path: string): string {
		return `${this.baseUrl}${this.apiPrefix}${path}`;
	}

	private async request<T>(
		path: string,
		token: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const response = await fetch(this.getUrl(path), {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `HTTP ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${path}`, error);
			return { error: 'Verbindung zum Chat-Server fehlgeschlagen' };
		}
	}

	// Models (public endpoints)
	async getModels(): Promise<{ data?: Model[]; error?: string }> {
		try {
			const response = await fetch(this.getUrl('/models'));
			if (!response.ok) {
				return { error: `HTTP ${response.status}` };
			}
			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error('Failed to fetch models', error);
			return { error: 'Verbindung zum Chat-Server fehlgeschlagen' };
		}
	}

	async getModel(id: string): Promise<{ data?: Model; error?: string }> {
		try {
			const response = await fetch(this.getUrl(`/models/${id}`));
			if (!response.ok) {
				return { error: `HTTP ${response.status}` };
			}
			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Failed to fetch model ${id}`, error);
			return { error: 'Modell nicht gefunden' };
		}
	}

	// Chat Completions
	async createCompletion(
		token: string,
		messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
		modelId: string,
		options?: { temperature?: number; maxTokens?: number }
	): Promise<{ data?: ChatCompletionResponse; error?: string }> {
		return this.request<ChatCompletionResponse>('/chat/completions', token, {
			method: 'POST',
			body: JSON.stringify({
				messages,
				modelId,
				temperature: options?.temperature,
				maxTokens: options?.maxTokens,
			}),
		});
	}

	// Conversations
	async getConversations(
		token: string,
		spaceId?: string
	): Promise<{ data?: Conversation[]; error?: string }> {
		const query = spaceId ? `?spaceId=${spaceId}` : '';
		return this.request<Conversation[]>(`/conversations${query}`, token);
	}

	async getArchivedConversations(token: string): Promise<{ data?: Conversation[]; error?: string }> {
		return this.request<Conversation[]>('/conversations/archived', token);
	}

	async getConversation(token: string, id: string): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${id}`, token);
	}

	async getMessages(token: string, conversationId: string): Promise<{ data?: Message[]; error?: string }> {
		return this.request<Message[]>(`/conversations/${conversationId}/messages`, token);
	}

	async createConversation(
		token: string,
		data: {
			title: string;
			modelId: string;
			conversationMode?: 'free' | 'guided' | 'template';
		}
	): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>('/conversations', token, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async addMessage(
		token: string,
		conversationId: string,
		messageText: string,
		sender: 'user' | 'assistant' = 'user'
	): Promise<{ data?: Message; error?: string }> {
		return this.request<Message>(`/conversations/${conversationId}/messages`, token, {
			method: 'POST',
			body: JSON.stringify({ messageText, sender }),
		});
	}

	async updateTitle(
		token: string,
		conversationId: string,
		title: string
	): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${conversationId}/title`, token, {
			method: 'PATCH',
			body: JSON.stringify({ title }),
		});
	}

	async archiveConversation(token: string, conversationId: string): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${conversationId}/archive`, token, {
			method: 'PATCH',
		});
	}

	async unarchiveConversation(token: string, conversationId: string): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${conversationId}/unarchive`, token, {
			method: 'PATCH',
		});
	}

	async pinConversation(token: string, conversationId: string): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${conversationId}/pin`, token, {
			method: 'PATCH',
		});
	}

	async unpinConversation(token: string, conversationId: string): Promise<{ data?: Conversation; error?: string }> {
		return this.request<Conversation>(`/conversations/${conversationId}/unpin`, token, {
			method: 'PATCH',
		});
	}

	async deleteConversation(token: string, conversationId: string): Promise<{ error?: string }> {
		return this.request(`/conversations/${conversationId}`, token, {
			method: 'DELETE',
		});
	}
}
