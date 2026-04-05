/**
 * Backend API Client for Context Mobile App
 * Handles all communication with the Context NestJS backend
 */
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL =
	process.env.EXPO_PUBLIC_BACKEND_URL ||
	process.env.EXPO_PUBLIC_CONTEXT_BACKEND_URL ||
	'http://localhost:3020';

// Token storage key (must match what @mana/shared-auth uses)
const APP_TOKEN_KEY = '@mana/app_token';

// ============================================================================
// Types (re-exported for consumers)
// ============================================================================

export type Space = {
	id: string;
	name: string;
	description: string | null;
	user_id: string;
	created_at: string;
	settings: any | null;
	pinned: boolean;
	prefix?: string;
	text_doc_counter?: number;
	context_doc_counter?: number;
	prompt_doc_counter?: number;
};

export type DocumentMetadata = {
	tags?: string[];
	word_count?: number;
	token_count?: number;
	[key: string]: any;
};

export type Document = {
	id: string;
	title: string;
	content: string | null;
	type: 'text' | 'context' | 'prompt';
	space_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	metadata: DocumentMetadata | null;
	short_id?: string;
	pinned?: boolean;
};

export type TokenTransaction = {
	id: string;
	user_id: string;
	amount: number;
	transaction_type: string;
	model_used?: string;
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
	cost_usd?: number;
	document_id?: string;
	created_at: string;
};

export type TokenUsageStats = {
	totalUsed: number;
	byModel: Record<string, number>;
	byDate: Record<string, number>;
};

export type ModelPrice = {
	id: string;
	model_name: string;
	input_price_per_1k_tokens: number;
	output_price_per_1k_tokens: number;
	tokens_per_dollar: number;
	created_at: string;
	updated_at: string;
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
			(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
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

		// Handle empty responses (e.g., DELETE 204)
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
// Spaces API
// ============================================================================

export const spacesApi = {
	async list(): Promise<Space[]> {
		const { data, error } = await apiRequest<Space[]>('/api/v1/spaces');
		if (error) {
			console.error('Failed to fetch spaces:', error);
			return [];
		}
		return data || [];
	},

	async get(id: string): Promise<Space | null> {
		const { data, error } = await apiRequest<Space>(`/api/v1/spaces/${id}`);
		if (error) {
			console.error('Failed to fetch space:', error);
			return null;
		}
		return data;
	},

	async create(params: {
		name: string;
		description?: string;
		settings?: any;
		pinned?: boolean;
	}): Promise<{ data: Space | null; error: string | null }> {
		return apiRequest<Space>('/api/v1/spaces', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	},

	async update(
		id: string,
		updates: Partial<Space>
	): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/spaces/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
		return { success: !error, error };
	},

	async delete(id: string): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/spaces/${id}`, {
			method: 'DELETE',
		});
		return { success: !error, error };
	},
};

// ============================================================================
// Documents API
// ============================================================================

export const documentsApi = {
	async list(params?: {
		spaceId?: string;
		preview?: boolean;
		limit?: number;
	}): Promise<Document[]> {
		const searchParams = new URLSearchParams();
		if (params?.spaceId) searchParams.set('spaceId', params.spaceId);
		if (params?.preview) searchParams.set('preview', 'true');
		if (params?.limit) searchParams.set('limit', String(params.limit));

		const query = searchParams.toString();
		const endpoint = `/api/v1/documents${query ? `?${query}` : ''}`;

		const { data, error } = await apiRequest<Document[]>(endpoint);
		if (error) {
			console.error('Failed to fetch documents:', error);
			return [];
		}
		return data || [];
	},

	async listRecent(limit: number = 5): Promise<Document[]> {
		const { data, error } = await apiRequest<Document[]>(`/api/v1/documents/recent?limit=${limit}`);
		if (error) {
			console.error('Failed to fetch recent documents:', error);
			return [];
		}
		return data || [];
	},

	async get(id: string): Promise<Document | null> {
		const { data, error } = await apiRequest<Document>(`/api/v1/documents/${id}`);
		if (error) {
			console.error('Failed to fetch document:', error);
			return null;
		}
		return data;
	},

	async create(params: {
		content: string;
		type: 'text' | 'context' | 'prompt';
		spaceId?: string;
		metadata?: any;
		title?: string;
	}): Promise<{ data: Document | null; error: string | null }> {
		return apiRequest<Document>('/api/v1/documents', {
			method: 'POST',
			body: JSON.stringify({
				content: params.content,
				type: params.type,
				space_id: params.spaceId,
				metadata: params.metadata,
				title: params.title,
			}),
		});
	},

	async update(
		id: string,
		updates: Partial<Document>
	): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/documents/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
		return { success: !error, error };
	},

	async delete(id: string): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/documents/${id}`, {
			method: 'DELETE',
		});
		return { success: !error, error };
	},

	async updateTags(
		id: string,
		tags: string[]
	): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/documents/${id}/tags`, {
			method: 'PUT',
			body: JSON.stringify({ tags }),
		});
		return { success: !error, error };
	},

	async togglePinned(
		id: string,
		pinned: boolean
	): Promise<{ success: boolean; error: string | null }> {
		const { error } = await apiRequest(`/api/v1/documents/${id}/pinned`, {
			method: 'PUT',
			body: JSON.stringify({ pinned }),
		});
		return { success: !error, error };
	},

	async getVersions(id: string): Promise<{ data: Document[]; error: string | null }> {
		const { data, error } = await apiRequest<Document[]>(`/api/v1/documents/${id}/versions`);
		return { data: data || [], error };
	},

	async createVersion(
		id: string,
		params: {
			generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas';
			content: string;
			aiModel: string;
			prompt: string;
		}
	): Promise<{ data: Document | null; error: string | null }> {
		return apiRequest<Document>(`/api/v1/documents/${id}/versions`, {
			method: 'POST',
			body: JSON.stringify(params),
		});
	},
};

// ============================================================================
// AI API
// ============================================================================

export const aiApi = {
	async generate(params: {
		prompt: string;
		model?: string;
		temperature?: number;
		maxTokens?: number;
		documentId?: string;
		referencedDocuments?: { title: string; content: string }[];
	}): Promise<{
		text: string;
		tokenInfo: {
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
			tokensUsed: number;
			remainingTokens: number;
		};
	}> {
		const { data, error } = await apiRequest<{
			text: string;
			tokenInfo: {
				promptTokens: number;
				completionTokens: number;
				totalTokens: number;
				tokensUsed: number;
				remainingTokens: number;
			};
		}>('/api/v1/ai/generate/mobile', {
			method: 'POST',
			body: JSON.stringify({
				prompt: params.prompt,
				model: params.model || 'ollama/gemma3:4b',
				temperature: params.temperature,
				maxTokens: params.maxTokens,
				documentId: params.documentId,
				referencedDocuments: params.referencedDocuments,
			}),
		});

		if (error || !data) {
			throw new Error(error || 'AI generation failed');
		}

		return data;
	},

	async estimate(params: {
		prompt: string;
		model: string;
		estimatedCompletionLength?: number;
		referencedDocuments?: { title: string; content: string }[];
	}): Promise<{ hasEnough: boolean; estimate: any; balance: number }> {
		const { data, error } = await apiRequest<{
			hasEnough: boolean;
			estimate: any;
			balance: number;
		}>('/api/v1/ai/estimate/mobile', {
			method: 'POST',
			body: JSON.stringify({
				prompt: params.prompt,
				model: params.model,
				estimatedCompletionLength: params.estimatedCompletionLength || 500,
				referencedDocuments: params.referencedDocuments,
			}),
		});

		if (error || !data) {
			console.error('Failed to estimate tokens:', error);
			return { hasEnough: false, estimate: null, balance: 0 };
		}

		return data;
	},
};

// ============================================================================
// Tokens API
// ============================================================================

export const tokensApi = {
	async getBalance(): Promise<number> {
		const { data, error } = await apiRequest<{ balance: number }>('/api/v1/tokens/balance');
		if (error || !data) {
			console.error('Failed to fetch token balance:', error);
			return 0;
		}
		return data.balance;
	},

	async getStats(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<TokenUsageStats> {
		const { data, error } = await apiRequest<TokenUsageStats>(
			`/api/v1/tokens/stats?timeframe=${timeframe}`
		);
		if (error || !data) {
			console.error('Failed to fetch token stats:', error);
			return { totalUsed: 0, byModel: {}, byDate: {} };
		}
		return data;
	},

	async getTransactions(limit: number = 10, offset: number = 0): Promise<TokenTransaction[]> {
		const { data, error } = await apiRequest<TokenTransaction[]>(
			`/api/v1/tokens/transactions?limit=${limit}&offset=${offset}`
		);
		if (error || !data) {
			console.error('Failed to fetch token transactions:', error);
			return [];
		}
		return data;
	},

	async getModels(): Promise<ModelPrice[]> {
		const { data, error } = await apiRequest<ModelPrice[]>('/api/v1/tokens/models');
		if (error || !data) {
			console.error('Failed to fetch model prices:', error);
			return [];
		}
		return data;
	},
};
