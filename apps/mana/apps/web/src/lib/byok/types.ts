/**
 * BYOK Key types — device-local encrypted storage of user LLM API keys.
 */

import type { ByokProviderId } from '@mana/shared-llm';

/** Raw record as stored in IndexedDB. The apiKey field is encrypted. */
export interface ByokKeyRecord {
	id: string;
	provider: ByokProviderId;
	label: string;
	/** Encrypted via AES-GCM wrapValue() — stored as base64 {iv, ct} blob */
	apiKeyEncrypted: unknown;
	/** Optional model override (provider default used if undefined) */
	model?: string;
	/** Whether this is the default key for this provider */
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
	lastUsedAt?: string;
	/** Incremented after each successful call */
	usageCount: number;
	/** Cumulative tokens used */
	totalTokens: number;
	/** Cumulative cost estimate in USD */
	totalCostUsd: number;
	deletedAt?: string;
}

/** Plaintext view used by the UI (never serialized). */
export interface ByokKeyPlain {
	id: string;
	provider: ByokProviderId;
	label: string;
	apiKey: string;
	model?: string;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
	lastUsedAt?: string;
	usageCount: number;
	totalTokens: number;
	totalCostUsd: number;
}
