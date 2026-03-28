/**
 * Credit Service Types
 *
 * Types for credit/mana operations across all apps
 */

/**
 * Credit balance with additional metadata
 */
export interface CreditBalance {
	/** Current credit/mana amount */
	credits: number;
	/** Maximum credit limit */
	maxCreditLimit: number;
	/** User ID */
	userId: string;
	/** Currency identifier (default: 'mana') */
	currency?: string;
	/** Last updated timestamp */
	lastUpdated?: string;
}

/**
 * Result of checking if user has enough credits
 */
export interface CreditCheckResponse {
	/** Whether user has sufficient credits */
	hasEnoughCredits: boolean;
	/** Current credit balance */
	currentCredits: number;
	/** Credits required for operation */
	requiredCredits: number;
	/** Deficit amount (if insufficient) */
	deficit?: number;
	/** Credit source type */
	creditType?: 'user' | 'space';
	/** Additional context */
	context?: Record<string, unknown>;
}

/**
 * Result of credit consumption
 */
export interface CreditConsumptionResponse {
	/** Whether consumption succeeded */
	success: boolean;
	/** Human-readable message */
	message: string;
	/** Amount of credits consumed */
	creditsConsumed: number;
	/** Credit source type */
	creditType: 'user' | 'space';
	/** Remaining balance after consumption */
	remainingCredits?: number;
	/** Related operation identifier */
	operationId?: string;
}

/**
 * Pricing response from backend
 */
export interface PricingResponse {
	/** Map of operation types to their costs */
	operationCosts: Record<string, number>;
	/** Cost per hour for time-based operations (e.g., transcription) */
	transcriptionPerHour?: number;
	/** When pricing was last updated */
	lastUpdated: string;
}

/**
 * Configuration for creating a credit service instance
 */
export interface CreditServiceConfig {
	/** Base URL for credit/billing API */
	apiUrl: string;
	/** Endpoint for fetching balance (relative to apiUrl) */
	balanceEndpoint?: string;
	/** Endpoint for fetching pricing (relative to apiUrl) */
	pricingEndpoint?: string;
	/** How long to cache pricing (milliseconds, default: 30 minutes) */
	cacheDuration?: number;
	/** Fallback pricing if backend unavailable */
	fallbackPricing?: Record<string, number>;
	/** Function to get current auth token */
	getAuthToken: () => Promise<string | null>;
}

/**
 * Credit update callback type
 */
export type CreditUpdateCallback = (creditsConsumed: number, operation?: string) => void;

/**
 * Standard operation types across all apps
 */
export type StandardOperationType =
	// Memoro operations
	| 'TRANSCRIPTION_PER_HOUR'
	| 'HEADLINE_GENERATION'
	| 'MEMORY_CREATION'
	| 'BLUEPRINT_PROCESSING'
	| 'QUESTION_MEMO'
	| 'NEW_MEMORY'
	| 'MEMO_COMBINE'
	| 'MEMO_SHARING'
	| 'SPACE_OPERATION'
	// Maerchenzauber operations
	| 'CHARACTER_CREATION'
	| 'CHARACTER_GENERATION_FROM_IMAGE'
	| 'CHARACTER_IMPORT'
	| 'STORY_CREATION'
	| 'STORY_CONTINUATION'
	// ManaDeck operations
	| 'DECK_CREATION'
	| 'CARD_GENERATION'
	| 'AI_REVIEW'
	// Generic operations
	| 'AI_PROCESSING'
	| 'EXPORT'
	| 'IMPORT'
	| string; // Allow custom operation types

/**
 * Default pricing for operations (fallback values)
 */
export const DEFAULT_OPERATION_PRICING: Record<string, number> = {
	// Memoro
	TRANSCRIPTION_PER_HOUR: 120,
	HEADLINE_GENERATION: 10,
	MEMORY_CREATION: 10,
	BLUEPRINT_PROCESSING: 5,
	QUESTION_MEMO: 5,
	NEW_MEMORY: 5,
	MEMO_COMBINE: 5,
	MEMO_SHARING: 1,
	SPACE_OPERATION: 2,
	// Maerchenzauber
	CHARACTER_CREATION: 20,
	CHARACTER_GENERATION_FROM_IMAGE: 20,
	CHARACTER_IMPORT: 10,
	STORY_CREATION: 10,
	STORY_CONTINUATION: 5,
	// ManaDeck
	DECK_CREATION: 5,
	CARD_GENERATION: 2,
	AI_REVIEW: 10,
	// Generic
	AI_PROCESSING: 10,
	EXPORT: 1,
	IMPORT: 1,
};
