/**
 * API Keys Service for ManaCore Web App
 * Handles API key creation, listing, and revocation
 */

import { createApiClient, type ApiResult } from './base-client';

const MANA_AUTH_URL = 'http://localhost:3001'; // TODO: Use PUBLIC_MANA_CORE_AUTH_URL from env
const client = createApiClient(MANA_AUTH_URL);

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
		return client.get<ApiKey[]>('/api/v1/api-keys');
	},

	/**
	 * Create a new API key
	 * Returns the full key only once - it cannot be retrieved later
	 */
	async create(dto: CreateApiKeyDto): Promise<ApiResult<ApiKeyWithSecret>> {
		return client.post<ApiKeyWithSecret>('/api/v1/api-keys', dto);
	},

	/**
	 * Revoke an API key
	 */
	async revoke(id: string): Promise<ApiResult<void>> {
		return client.delete<void>(`/api/v1/api-keys/${id}`);
	},
};
