/**
 * API Client for Chat Mobile App
 * Handles all communication with the NestJS backend
 */
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Token storage key (must match what @mana/shared-auth uses)
const APP_TOKEN_KEY = '@mana/app_token';

// ============================================================================
// Types
// ============================================================================

export type Conversation = {
	id: string;
	userId: string;
	modelId: string;
	templateId?: string;
	spaceId?: string;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	title?: string;
	isArchived: boolean;
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

export type Template = {
	id: string;
	userId: string;
	name: string;
	description?: string;
	systemPrompt: string;
	initialQuestion?: string;
	modelId?: string;
	color: string;
	isDefault: boolean;
	documentMode: boolean;
	createdAt: string;
	updatedAt: string;
};

export type Space = {
	id: string;
	name: string;
	description?: string;
	ownerId: string;
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

export type Document = {
	id: string;
	conversationId: string;
	version: number;
	content: string;
	createdAt: string;
	updatedAt: string;
};

export type AIModel = {
	id: string;
	name: string;
	description?: string;
	parameters: {
		temperature?: number;
		max_tokens?: number;
		provider?: string;
		deployment?: string;
		endpoint?: string;
		api_version?: string;
	};
	costSettings?: {
		prompt_per_1k_tokens?: number;
		completion_per_1k_tokens?: number;
	};
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type TokenUsage = {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
};

export type ChatCompletionResponse = {
	content: string;
	usage: TokenUsage;
};

// ============================================================================
// Base API Functions
// ============================================================================

async function getAuthToken(): Promise<string | null> {
	try {
		return await SecureStore.getItemAsync(APP_TOKEN_KEY);
	} catch {
		return null;
	}
}

async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
	try {
		const token = await getAuthToken();

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${BACKEND_URL}${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`API Error [${response.status}]: ${errorText}`);
			return { data: null, error: `API Error: ${response.status}` };
		}

		// Handle empty responses
		const text = await response.text();
		if (!text) {
			return { data: null, error: null };
		}

		const data = JSON.parse(text);
		return { data, error: null };
	} catch (error) {
		console.error('API Request failed:', error);
		return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

// ============================================================================
// Conversation API
// ============================================================================

export const conversationApi = {
	async getConversations(spaceId?: string): Promise<Conversation[]> {
		const params = spaceId ? `?spaceId=${spaceId}` : '';
		const { data, error } = await apiRequest<Conversation[]>(`/api/conversations${params}`);
		if (error) {
			console.error('Failed to fetch conversations:', error);
			return [];
		}
		return data || [];
	},

	async getArchivedConversations(): Promise<Conversation[]> {
		const { data, error } = await apiRequest<Conversation[]>('/api/conversations/archived');
		if (error) {
			console.error('Failed to fetch archived conversations:', error);
			return [];
		}
		return data || [];
	},

	async getConversation(id: string): Promise<Conversation | null> {
		const { data, error } = await apiRequest<Conversation>(`/api/conversations/${id}`);
		if (error) {
			console.error('Failed to fetch conversation:', error);
			return null;
		}
		return data;
	},

	async getMessages(conversationId: string): Promise<Message[]> {
		const { data, error } = await apiRequest<Message[]>(
			`/api/conversations/${conversationId}/messages`
		);
		if (error) {
			console.error('Failed to fetch messages:', error);
			return [];
		}
		return data || [];
	},

	async createConversation(params: {
		modelId: string;
		conversationMode?: 'free' | 'guided' | 'template';
		templateId?: string;
		documentMode?: boolean;
		spaceId?: string;
	}): Promise<Conversation | null> {
		const { data, error } = await apiRequest<Conversation>('/api/conversations', {
			method: 'POST',
			body: JSON.stringify(params),
		});
		if (error) {
			console.error('Failed to create conversation:', error);
			return null;
		}
		return data;
	},

	async addMessage(
		conversationId: string,
		sender: 'user' | 'assistant' | 'system',
		messageText: string
	): Promise<Message | null> {
		const { data, error } = await apiRequest<Message>(
			`/api/conversations/${conversationId}/messages`,
			{
				method: 'POST',
				body: JSON.stringify({ sender, messageText }),
			}
		);
		if (error) {
			console.error('Failed to add message:', error);
			return null;
		}
		return data;
	},

	async updateTitle(conversationId: string, title: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/conversations/${conversationId}/title`, {
			method: 'PATCH',
			body: JSON.stringify({ title }),
		});
		return !error;
	},

	async archiveConversation(conversationId: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/conversations/${conversationId}/archive`, {
			method: 'POST',
		});
		return !error;
	},

	async unarchiveConversation(conversationId: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/conversations/${conversationId}/unarchive`, {
			method: 'POST',
		});
		return !error;
	},

	async deleteConversation(conversationId: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/conversations/${conversationId}`, {
			method: 'DELETE',
		});
		return !error;
	},
};

// ============================================================================
// Template API
// ============================================================================

export const templateApi = {
	async getTemplates(): Promise<Template[]> {
		const { data, error } = await apiRequest<Template[]>('/api/templates');
		if (error) {
			console.error('Failed to fetch templates:', error);
			return [];
		}
		return data || [];
	},

	async getTemplate(id: string): Promise<Template | null> {
		const { data, error } = await apiRequest<Template>(`/api/templates/${id}`);
		if (error) {
			console.error('Failed to fetch template:', error);
			return null;
		}
		return data;
	},

	async getDefaultTemplate(): Promise<Template | null> {
		const { data, error } = await apiRequest<Template>('/api/templates/default');
		if (error) {
			// Not finding a default template is not an error
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
		const { data, error } = await apiRequest<Template>('/api/templates', {
			method: 'POST',
			body: JSON.stringify(template),
		});
		if (error) {
			console.error('Failed to create template:', error);
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
		const { error } = await apiRequest(`/api/templates/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates),
		});
		return !error;
	},

	async setDefaultTemplate(id: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/templates/${id}/default`, {
			method: 'POST',
		});
		return !error;
	},

	async deleteTemplate(id: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/templates/${id}`, {
			method: 'DELETE',
		});
		return !error;
	},
};

// ============================================================================
// Space API
// ============================================================================

export const spaceApi = {
	async getUserSpaces(): Promise<Space[]> {
		const { data, error } = await apiRequest<Space[]>('/api/spaces');
		if (error) {
			console.error('Failed to fetch spaces:', error);
			return [];
		}
		return data || [];
	},

	async getOwnedSpaces(): Promise<Space[]> {
		const { data, error } = await apiRequest<Space[]>('/api/spaces/owned');
		if (error) {
			console.error('Failed to fetch owned spaces:', error);
			return [];
		}
		return data || [];
	},

	async getSpace(id: string): Promise<Space | null> {
		const { data, error } = await apiRequest<Space>(`/api/spaces/${id}`);
		if (error) {
			console.error('Failed to fetch space:', error);
			return null;
		}
		return data;
	},

	async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
		const { data, error } = await apiRequest<SpaceMember[]>(`/api/spaces/${spaceId}/members`);
		if (error) {
			console.error('Failed to fetch space members:', error);
			return [];
		}
		return data || [];
	},

	async getUserRoleInSpace(
		spaceId: string
	): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
		const { data, error } = await apiRequest<{ role: 'owner' | 'admin' | 'member' | 'viewer' }>(
			`/api/spaces/${spaceId}/role`
		);
		if (error) {
			return null;
		}
		return data?.role || null;
	},

	async getPendingInvitations(): Promise<Array<{ invitation: SpaceMember; space: Space }>> {
		const { data, error } = await apiRequest<Array<{ invitation: SpaceMember; space: Space }>>(
			'/api/spaces/invitations/pending'
		);
		if (error) {
			console.error('Failed to fetch pending invitations:', error);
			return [];
		}
		return data || [];
	},

	async createSpace(name: string, description?: string): Promise<Space | null> {
		const { data, error } = await apiRequest<Space>('/api/spaces', {
			method: 'POST',
			body: JSON.stringify({ name, description }),
		});
		if (error) {
			console.error('Failed to create space:', error);
			return null;
		}
		return data;
	},

	async updateSpace(
		id: string,
		updates: { name?: string; description?: string; isArchived?: boolean }
	): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates),
		});
		return !error;
	},

	async deleteSpace(id: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${id}`, {
			method: 'DELETE',
		});
		return !error;
	},

	async inviteUser(
		spaceId: string,
		userId: string,
		role: 'admin' | 'member' | 'viewer' = 'member'
	): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${spaceId}/members`, {
			method: 'POST',
			body: JSON.stringify({ userId, role }),
		});
		return !error;
	},

	async respondToInvitation(spaceId: string, status: 'accepted' | 'declined'): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${spaceId}/invitation`, {
			method: 'POST',
			body: JSON.stringify({ status }),
		});
		return !error;
	},

	async removeMember(spaceId: string, userId: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${spaceId}/members/${userId}`, {
			method: 'DELETE',
		});
		return !error;
	},

	async changeMemberRole(
		spaceId: string,
		userId: string,
		newRole: 'admin' | 'member' | 'viewer'
	): Promise<boolean> {
		const { error } = await apiRequest(`/api/spaces/${spaceId}/members/${userId}/role`, {
			method: 'PATCH',
			body: JSON.stringify({ role: newRole }),
		});
		return !error;
	},
};

// ============================================================================
// Document API
// ============================================================================

export const documentApi = {
	async getLatestDocument(conversationId: string): Promise<Document | null> {
		const { data, error } = await apiRequest<Document>(
			`/api/documents/conversation/${conversationId}/latest`
		);
		if (error) {
			return null;
		}
		return data;
	},

	async getAllDocumentVersions(conversationId: string): Promise<Document[]> {
		const { data, error } = await apiRequest<Document[]>(
			`/api/documents/conversation/${conversationId}`
		);
		if (error) {
			console.error('Failed to fetch document versions:', error);
			return [];
		}
		return data || [];
	},

	async hasDocument(conversationId: string): Promise<boolean> {
		const { data, error } = await apiRequest<{ exists: boolean }>(
			`/api/documents/conversation/${conversationId}/exists`
		);
		if (error) {
			return false;
		}
		return data?.exists || false;
	},

	async createDocument(conversationId: string, content: string): Promise<Document | null> {
		const { data, error } = await apiRequest<Document>('/api/documents', {
			method: 'POST',
			body: JSON.stringify({ conversationId, content }),
		});
		if (error) {
			console.error('Failed to create document:', error);
			return null;
		}
		return data;
	},

	async createDocumentVersion(conversationId: string, content: string): Promise<Document | null> {
		const { data, error } = await apiRequest<Document>(
			`/api/documents/conversation/${conversationId}/version`,
			{
				method: 'POST',
				body: JSON.stringify({ content }),
			}
		);
		if (error) {
			console.error('Failed to create document version:', error);
			return null;
		}
		return data;
	},

	async deleteDocumentVersion(documentId: string): Promise<boolean> {
		const { error } = await apiRequest(`/api/documents/${documentId}`, {
			method: 'DELETE',
		});
		return !error;
	},
};

// ============================================================================
// Model API
// ============================================================================

export const modelApi = {
	async getModels(): Promise<AIModel[]> {
		const { data, error } = await apiRequest<AIModel[]>('/api/chat/models');
		if (error) {
			console.error('Failed to fetch models:', error);
			return [];
		}
		return data || [];
	},

	async getModel(id: string): Promise<AIModel | null> {
		const { data, error } = await apiRequest<AIModel>(`/api/models/${id}`);
		if (error) {
			console.error('Failed to fetch model:', error);
			return null;
		}
		return data;
	},
};

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
	async createCompletion(params: {
		messages: ChatMessage[];
		modelId: string;
		temperature?: number;
		maxTokens?: number;
	}): Promise<ChatCompletionResponse | null> {
		const { data, error } = await apiRequest<ChatCompletionResponse>('/api/chat/completions', {
			method: 'POST',
			body: JSON.stringify({
				messages: params.messages,
				modelId: params.modelId,
				temperature: params.temperature ?? 0.7,
				maxTokens: params.maxTokens ?? 1000,
			}),
		});
		if (error) {
			console.error('Failed to create completion:', error);
			return null;
		}
		return data;
	},
};

// ============================================================================
// Usage Log API
// ============================================================================

export const usageApi = {
	async logTokenUsage(params: {
		conversationId: string;
		messageId: string;
		modelId: string;
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		estimatedCost: number;
	}): Promise<boolean> {
		const { error } = await apiRequest('/api/usage-logs', {
			method: 'POST',
			body: JSON.stringify(params),
		});
		return !error;
	},
};
