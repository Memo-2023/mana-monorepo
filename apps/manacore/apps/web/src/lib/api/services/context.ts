/**
 * Context API Service
 *
 * Fetches documents and spaces from the Context backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Context API URL dynamically at runtime
function getContextApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_CONTEXT_API_URL__?: string })
			.__PUBLIC_CONTEXT_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	return 'http://localhost:3020/api/v1';
}

// Lazy-initialized client
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getContextApiUrl());
	}
	return _client;
}

/**
 * Space entity from Context backend
 */
export interface ContextSpace {
	id: string;
	userId: string;
	name: string;
	description?: string;
	pinned: boolean;
	prefix: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Document entity from Context backend
 */
export interface ContextDocument {
	id: string;
	userId: string;
	spaceId: string;
	title: string;
	content?: string;
	type: 'text' | 'context' | 'prompt';
	shortId: string;
	pinned: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Token balance from Context backend
 */
export interface TokenBalance {
	tokenBalance: number;
	monthlyFreeTokens: number;
}

/**
 * Context service for dashboard widgets
 */
export const contextService = {
	/**
	 * Get user's spaces
	 */
	async getSpaces(): Promise<ApiResult<ContextSpace[]>> {
		return getClient().get<ContextSpace[]>('/spaces');
	},

	/**
	 * Get recent documents
	 */
	async getRecentDocuments(limit = 5): Promise<ApiResult<ContextDocument[]>> {
		return getClient().get<ContextDocument[]>(`/documents/recent?limit=${limit}`);
	},

	/**
	 * Get token balance
	 */
	async getTokenBalance(): Promise<ApiResult<TokenBalance>> {
		return getClient().get<TokenBalance>('/tokens/balance');
	},

	/**
	 * Get document and space counts
	 */
	async getCounts(): Promise<ApiResult<{ spaces: number; documents: number }>> {
		const spacesResult = await this.getSpaces();

		if (spacesResult.error || !spacesResult.data) {
			return { data: null, error: spacesResult.error };
		}

		return {
			data: {
				spaces: spacesResult.data.length,
				documents: 0, // Would need a separate count endpoint
			},
			error: null,
		};
	},
};
