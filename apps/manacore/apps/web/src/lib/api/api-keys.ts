/**
 * API Keys Service for ManaCore Web App
 * Handles API key creation, listing, and revocation
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from './base-client';

// Get auth URL dynamically at runtime
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}

// Lazy initialization to avoid SSR issues
let _client: ReturnType<typeof createApiClient> | null = null;
function getClient() {
	if (!_client) {
		_client = createApiClient(getAuthUrl());
	}
	return _client;
}

// Types
export interface ApiKey {
	id: string;
	name: string;
	keyPrefix: string;
	scopes: string[];
	rateLimitRequests: number;
	rateLimitWindow: number;
	createdAt: string;
	lastUsedAt: string | null;
	revokedAt: string | null;
}

export interface ApiKeyWithSecret extends ApiKey {
	key: string; // Full key - only returned on creation
}

export interface CreateApiKeyDto {
	name: string;
	scopes?: string[];
	rateLimitRequests?: number;
	rateLimitWindow?: number;
}

// API Keys Service
export const apiKeysService = {
	/**
	 * List all API keys for the current user
	 */
	async list(): Promise<ApiResult<ApiKey[]>> {
		return getClient().get<ApiKey[]>('/api/v1/api-keys');
	},

	/**
	 * Create a new API key
	 * Returns the full key only once - it cannot be retrieved later
	 */
	async create(dto: CreateApiKeyDto): Promise<ApiResult<ApiKeyWithSecret>> {
		return getClient().post<ApiKeyWithSecret>('/api/v1/api-keys', dto);
	},

	/**
	 * Revoke an API key
	 */
	async revoke(id: string): Promise<ApiResult<void>> {
		return getClient().delete<void>(`/api/v1/api-keys/${id}`);
	},
};
