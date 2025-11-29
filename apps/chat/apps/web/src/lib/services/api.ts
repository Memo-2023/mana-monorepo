/**
 * API Client for Chat Backend
 *
 * This replaces direct Supabase calls with backend API calls.
 * All database operations now go through the NestJS backend.
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3002';

type FetchOptions = {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
};

async function fetchApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body, token } = options;

	// Get token from localStorage if not provided
	// Token is stored by @manacore/shared-auth under '@auth/appToken'
	let authToken = token;
	if (!authToken && browser) {
		authToken = localStorage.getItem('@auth/appToken') || undefined;
	}

	if (!authToken) {
		return { data: null, error: new Error('No authentication token') };
	}

	try {
		const response = await fetch(`${API_BASE}/api${endpoint}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: new Error(errorData.message || `API error: ${response.status}`),
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Unknown error'),
		};
	}
}

// ============ Conversation API ============

export type Conversation = {
	id: string;
	userId: string;
	modelId: string;
	templateId?: string;
	spaceId?: string;
	title?: string;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	isArchived: boolean;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
};

export type Message = {
	id: string;
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
	createdAt: string;
	updatedAt: string;
};

export const conversationApi = {
	async getConversations(spaceId?: string): Promise<Conversation[]> {
		const query = spaceId ? `?spaceId=${spaceId}` : '';
		const { data, error } = await fetchApi<Conversation[]>(`/conversations${query}`);
		if (error) {
			console.error('Error loading conversations:', error);
			return [];
		}
		return data || [];
	},

	async getArchivedConversations(): Promise<Conversation[]> {
		const { data, error } = await fetchApi<Conversation[]>('/conversations/archived');
		if (error) {
			console.error('Error loading archived conversations:', error);
			return [];
		}
		return data || [];
	},

	async getConversation(id: string): Promise<Conversation | null> {
		const { data, error } = await fetchApi<Conversation>(`/conversations/${id}`);
		if (error) {
			console.error('Error loading conversation:', error);
			return null;
		}
		return data;
	},

	async getMessages(conversationId: string): Promise<Message[]> {
		const { data, error } = await fetchApi<Message[]>(`/conversations/${conversationId}/messages`);
		if (error) {
			console.error('Error loading messages:', error);
			return [];
		}
		return data || [];
	},

	async createConversation(options: {
		modelId: string;
		title?: string;
		templateId?: string;
		conversationMode?: 'free' | 'guided' | 'template';
		documentMode?: boolean;
		spaceId?: string;
	}): Promise<Conversation | null> {
		const { data, error } = await fetchApi<Conversation>('/conversations', {
			method: 'POST',
			body: options,
		});
		if (error) {
			console.error('Error creating conversation:', error);
			return null;
		}
		return data;
	},

	async addMessage(
		conversationId: string,
		sender: 'user' | 'assistant' | 'system',
		messageText: string
	): Promise<Message | null> {
		const { data, error } = await fetchApi<Message>(`/conversations/${conversationId}/messages`, {
			method: 'POST',
			body: { sender, messageText },
		});
		if (error) {
			console.error('Error adding message:', error);
			return null;
		}
		return data;
	},

	async updateTitle(conversationId: string, title: string): Promise<boolean> {
		const { error } = await fetchApi<Conversation>(`/conversations/${conversationId}/title`, {
			method: 'PATCH',
			body: { title },
		});
		if (error) {
			console.error('Error updating title:', error);
			return false;
		}
		return true;
	},

	async archiveConversation(conversationId: string): Promise<boolean> {
		const { error } = await fetchApi<Conversation>(`/conversations/${conversationId}/archive`, {
			method: 'PATCH',
		});
		if (error) {
			console.error('Error archiving conversation:', error);
			return false;
		}
		return true;
	},

	async unarchiveConversation(conversationId: string): Promise<boolean> {
		const { error } = await fetchApi<Conversation>(`/conversations/${conversationId}/unarchive`, {
			method: 'PATCH',
		});
		if (error) {
			console.error('Error unarchiving conversation:', error);
			return false;
		}
		return true;
	},

	async deleteConversation(conversationId: string): Promise<boolean> {
		const { error } = await fetchApi<{ success: boolean }>(`/conversations/${conversationId}`, {
			method: 'DELETE',
		});
		if (error) {
			console.error('Error deleting conversation:', error);
			return false;
		}
		return true;
	},

	async pinConversation(conversationId: string): Promise<boolean> {
		const { error } = await fetchApi<Conversation>(`/conversations/${conversationId}/pin`, {
			method: 'PATCH',
		});
		if (error) {
			console.error('Error pinning conversation:', error);
			return false;
		}
		return true;
	},

	async unpinConversation(conversationId: string): Promise<boolean> {
		const { error } = await fetchApi<Conversation>(`/conversations/${conversationId}/unpin`, {
			method: 'PATCH',
		});
		if (error) {
			console.error('Error unpinning conversation:', error);
			return false;
		}
		return true;
	},
};

// ============ Template API ============

export type Template = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	systemPrompt: string;
	initialQuestion: string | null;
	modelId: string | null;
	color: string;
	isDefault: boolean;
	documentMode: boolean;
	createdAt: string;
	updatedAt: string;
};

export const templateApi = {
	async getTemplates(): Promise<Template[]> {
		const { data, error } = await fetchApi<Template[]>('/templates');
		if (error) {
			console.error('Error loading templates:', error);
			return [];
		}
		return data || [];
	},

	async getTemplate(id: string): Promise<Template | null> {
		const { data, error } = await fetchApi<Template>(`/templates/${id}`);
		if (error) {
			console.error('Error loading template:', error);
			return null;
		}
		return data;
	},

	async getDefaultTemplate(): Promise<Template | null> {
		const { data, error } = await fetchApi<Template | null>('/templates/default');
		if (error) {
			console.error('Error loading default template:', error);
			return null;
		}
		return data;
	},

	async createTemplate(template: {
		name: string;
		description?: string;
		systemPrompt: string;
		initialQuestion?: string;
		modelId?: string;
		color?: string;
		documentMode?: boolean;
	}): Promise<Template | null> {
		const { data, error } = await fetchApi<Template>('/templates', {
			method: 'POST',
			body: template,
		});
		if (error) {
			console.error('Error creating template:', error);
			return null;
		}
		return data;
	},

	async updateTemplate(
		id: string,
		updates: Partial<{
			name: string;
			description: string;
			systemPrompt: string;
			initialQuestion: string;
			modelId: string;
			color: string;
			documentMode: boolean;
		}>
	): Promise<boolean> {
		const { error } = await fetchApi<Template>(`/templates/${id}`, {
			method: 'PATCH',
			body: updates,
		});
		if (error) {
			console.error('Error updating template:', error);
			return false;
		}
		return true;
	},

	async setDefaultTemplate(id: string): Promise<boolean> {
		const { error } = await fetchApi<Template>(`/templates/${id}/default`, {
			method: 'PATCH',
		});
		if (error) {
			console.error('Error setting default template:', error);
			return false;
		}
		return true;
	},

	async deleteTemplate(id: string): Promise<boolean> {
		const { error } = await fetchApi<{ success: boolean }>(`/templates/${id}`, {
			method: 'DELETE',
		});
		if (error) {
			console.error('Error deleting template:', error);
			return false;
		}
		return true;
	},
};

// ============ Space API ============

export type Space = {
	id: string;
	ownerId: string;
	name: string;
	description?: string;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
};

export type SpaceMember = {
	id: string;
	spaceId: string;
	userId: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	invitationStatus: 'pending' | 'accepted' | 'declined';
	invitedBy?: string;
	invitedAt: string;
	joinedAt?: string;
	createdAt: string;
	updatedAt: string;
};

export const spaceApi = {
	async getUserSpaces(): Promise<Space[]> {
		const { data, error } = await fetchApi<Space[]>('/spaces');
		if (error) {
			console.error('Error loading spaces:', error);
			return [];
		}
		return data || [];
	},

	async getOwnedSpaces(): Promise<Space[]> {
		const { data, error } = await fetchApi<Space[]>('/spaces/owned');
		if (error) {
			console.error('Error loading owned spaces:', error);
			return [];
		}
		return data || [];
	},

	async getSpace(id: string): Promise<Space | null> {
		const { data, error } = await fetchApi<Space>(`/spaces/${id}`);
		if (error) {
			console.error('Error loading space:', error);
			return null;
		}
		return data;
	},

	async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
		const { data, error } = await fetchApi<SpaceMember[]>(`/spaces/${spaceId}/members`);
		if (error) {
			console.error('Error loading space members:', error);
			return [];
		}
		return data || [];
	},

	async getUserRoleInSpace(
		spaceId: string
	): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
		const { data, error } = await fetchApi<{
			role: 'owner' | 'admin' | 'member' | 'viewer' | null;
		}>(`/spaces/${spaceId}/role`);
		if (error) {
			console.error('Error getting user role:', error);
			return null;
		}
		return data?.role || null;
	},

	async getPendingInvitations(): Promise<Array<{ invitation: SpaceMember; space: Space }>> {
		const { data, error } =
			await fetchApi<Array<{ invitation: SpaceMember; space: Space }>>('/spaces/invitations');
		if (error) {
			console.error('Error loading invitations:', error);
			return [];
		}
		return data || [];
	},

	async createSpace(name: string, description?: string): Promise<Space | null> {
		const { data, error } = await fetchApi<Space>('/spaces', {
			method: 'POST',
			body: { name, description },
		});
		if (error) {
			console.error('Error creating space:', error);
			return null;
		}
		return data;
	},

	async updateSpace(
		id: string,
		updates: { name?: string; description?: string; isArchived?: boolean }
	): Promise<boolean> {
		const { error } = await fetchApi<Space>(`/spaces/${id}`, {
			method: 'PATCH',
			body: updates,
		});
		if (error) {
			console.error('Error updating space:', error);
			return false;
		}
		return true;
	},

	async deleteSpace(id: string): Promise<boolean> {
		const { error } = await fetchApi<{ success: boolean }>(`/spaces/${id}`, {
			method: 'DELETE',
		});
		if (error) {
			console.error('Error deleting space:', error);
			return false;
		}
		return true;
	},

	async inviteUser(
		spaceId: string,
		userId: string,
		role?: 'admin' | 'member' | 'viewer'
	): Promise<boolean> {
		const { error } = await fetchApi<SpaceMember>(`/spaces/${spaceId}/invite`, {
			method: 'POST',
			body: { userId, role },
		});
		if (error) {
			console.error('Error inviting user:', error);
			return false;
		}
		return true;
	},

	async respondToInvitation(spaceId: string, status: 'accepted' | 'declined'): Promise<boolean> {
		const { error } = await fetchApi<SpaceMember>(`/spaces/${spaceId}/respond`, {
			method: 'POST',
			body: { status },
		});
		if (error) {
			console.error('Error responding to invitation:', error);
			return false;
		}
		return true;
	},

	async removeMember(spaceId: string, userId: string): Promise<boolean> {
		const { error } = await fetchApi<{ success: boolean }>(`/spaces/${spaceId}/members/${userId}`, {
			method: 'DELETE',
		});
		if (error) {
			console.error('Error removing member:', error);
			return false;
		}
		return true;
	},

	async changeMemberRole(
		spaceId: string,
		userId: string,
		role: 'admin' | 'member' | 'viewer'
	): Promise<boolean> {
		const { error } = await fetchApi<SpaceMember>(`/spaces/${spaceId}/members/${userId}/role`, {
			method: 'PATCH',
			body: { role },
		});
		if (error) {
			console.error('Error changing member role:', error);
			return false;
		}
		return true;
	},
};

// ============ Document API ============

export type Document = {
	id: string;
	conversationId: string;
	version: number;
	content: string;
	createdAt: string;
	updatedAt: string;
};

export const documentApi = {
	async getLatestDocument(conversationId: string): Promise<Document | null> {
		const { data, error } = await fetchApi<Document | null>(
			`/documents/conversation/${conversationId}`
		);
		if (error) {
			console.error('Error loading document:', error);
			return null;
		}
		return data;
	},

	async getAllDocumentVersions(conversationId: string): Promise<Document[]> {
		const { data, error } = await fetchApi<Document[]>(
			`/documents/conversation/${conversationId}/versions`
		);
		if (error) {
			console.error('Error loading document versions:', error);
			return [];
		}
		return data || [];
	},

	async hasDocument(conversationId: string): Promise<boolean> {
		const { data, error } = await fetchApi<{ exists: boolean }>(
			`/documents/conversation/${conversationId}/exists`
		);
		if (error) {
			console.error('Error checking document:', error);
			return false;
		}
		return data?.exists || false;
	},

	async createDocument(conversationId: string, content: string): Promise<Document | null> {
		const { data, error } = await fetchApi<Document>(`/documents/conversation/${conversationId}`, {
			method: 'POST',
			body: { content },
		});
		if (error) {
			console.error('Error creating document:', error);
			return null;
		}
		return data;
	},

	async createDocumentVersion(conversationId: string, content: string): Promise<Document | null> {
		const { data, error } = await fetchApi<Document>(
			`/documents/conversation/${conversationId}/version`,
			{
				method: 'POST',
				body: { content },
			}
		);
		if (error) {
			console.error('Error creating document version:', error);
			return null;
		}
		return data;
	},

	async deleteDocumentVersion(documentId: string): Promise<boolean> {
		const { error } = await fetchApi<{ success: boolean }>(`/documents/${documentId}`, {
			method: 'DELETE',
		});
		if (error) {
			console.error('Error deleting document:', error);
			return false;
		}
		return true;
	},
};

// ============ Model API ============

export type Model = {
	id: string;
	name: string;
	description?: string;
	provider: 'gemini' | 'azure' | 'openai';
	parameters?: {
		deployment?: string;
		temperature?: number;
		max_tokens?: number;
		top_p?: number;
	};
	isActive: boolean;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
};

export const modelApi = {
	async getModels(): Promise<Model[]> {
		const { data, error } = await fetchApi<Model[]>('/models');
		if (error) {
			console.error('Error loading models:', error);
			return [];
		}
		return data || [];
	},

	async getModel(id: string): Promise<Model | null> {
		const { data, error } = await fetchApi<Model>(`/models/${id}`);
		if (error) {
			console.error('Error loading model:', error);
			return null;
		}
		return data;
	},
};

// ============ Chat API ============

export type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type ChatCompletionResponse = {
	content: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
};

export const chatApi = {
	async createCompletion(options: {
		messages: ChatMessage[];
		modelId: string;
		temperature?: number;
		maxTokens?: number;
	}): Promise<ChatCompletionResponse | null> {
		const { data, error } = await fetchApi<ChatCompletionResponse>('/chat/completions', {
			method: 'POST',
			body: options,
		});
		if (error) {
			console.error('Error creating completion:', error);
			return null;
		}
		return data;
	},
};
