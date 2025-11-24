/**
 * Credit Service Factory
 *
 * Creates a credit service instance configured for a specific app.
 * Handles credit balance fetching, pricing, and consumption notifications.
 *
 * @example
 * ```ts
 * import { createCreditService } from '@manacore/shared-credit-service';
 * import { auth } from '$lib/stores/auth';
 *
 * export const creditService = createCreditService({
 *   apiUrl: 'https://api.example.com',
 *   pricingEndpoint: '/credits/pricing',
 *   balanceEndpoint: '/auth/credits',
 *   getAuthToken: () => auth.getToken(),
 *   fallbackPricing: {
 *     STORY_CREATION: 10,
 *     CHARACTER_CREATION: 20
 *   }
 * });
 * ```
 */

import type {
	CreditServiceConfig,
	CreditBalance,
	CreditCheckResponse,
	PricingResponse,
	CreditUpdateCallback,
	StandardOperationType
} from './types';
import { DEFAULT_OPERATION_PRICING } from './types';

/**
 * Create a credit service instance
 */
export function createCreditService(config: CreditServiceConfig) {
	const {
		apiUrl,
		balanceEndpoint = '/auth/credits',
		pricingEndpoint = '/credits/pricing',
		cacheDuration = 30 * 60 * 1000, // 30 minutes default
		fallbackPricing = {},
		getAuthToken
	} = config;

	// Normalize API URL (remove trailing slash)
	const baseUrl = apiUrl.replace(/\/$/, '');

	// Internal state
	let cachedPricing: PricingResponse | null = null;
	let pricingLastFetched = 0;
	const creditUpdateCallbacks: CreditUpdateCallback[] = [];

	// Merge fallback pricing with defaults
	const mergedFallbackPricing = {
		...DEFAULT_OPERATION_PRICING,
		...fallbackPricing
	};

	/**
	 * Initialize the credit service by preloading pricing
	 */
	async function initialize(): Promise<void> {
		try {
			await getPricing();
			console.log('[CreditService] Initialized with backend pricing');
		} catch (error) {
			console.warn('[CreditService] Initialization failed, using fallback pricing:', error);
		}
	}

	/**
	 * Register a callback for credit consumption notifications
	 * @returns Unsubscribe function
	 */
	function onCreditUpdate(callback: CreditUpdateCallback): () => void {
		creditUpdateCallbacks.push(callback);

		return () => {
			const index = creditUpdateCallbacks.indexOf(callback);
			if (index > -1) {
				creditUpdateCallbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Notify all callbacks about credit consumption
	 */
	function notifyCreditUpdate(creditsConsumed: number, operation?: string): void {
		creditUpdateCallbacks.forEach((callback) => {
			try {
				callback(creditsConsumed, operation);
			} catch (error) {
				console.error('[CreditService] Error in credit update callback:', error);
			}
		});
	}

	/**
	 * Manually trigger credit update notifications
	 */
	function triggerCreditUpdate(creditsConsumed: number, operation?: string): void {
		notifyCreditUpdate(creditsConsumed, operation);
	}

	/**
	 * Fetch pricing information from backend with caching
	 */
	async function getPricing(): Promise<PricingResponse> {
		const now = Date.now();

		// Return cached pricing if still valid
		if (cachedPricing && now - pricingLastFetched < cacheDuration) {
			return cachedPricing;
		}

		try {
			const response = await fetch(`${baseUrl}${pricingEndpoint}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const pricing = await response.json();
			cachedPricing = pricing;
			pricingLastFetched = now;

			return pricing;
		} catch (error) {
			console.error('[CreditService] Error fetching pricing:', error);

			// Return cached pricing if available
			if (cachedPricing) {
				return cachedPricing;
			}

			// Return fallback pricing
			return {
				operationCosts: mergedFallbackPricing,
				lastUpdated: new Date().toISOString()
			};
		}
	}

	/**
	 * Get user's credit balance
	 */
	async function getBalance(): Promise<CreditBalance | null> {
		try {
			const token = await getAuthToken();

			if (!token) {
				console.error('[CreditService] No authentication token available');
				return null;
			}

			const response = await fetch(`${baseUrl}${balanceEndpoint}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const data = await response.json();

			// Handle wrapped response structure
			if (data.data && typeof data.data.credits === 'number') {
				return {
					credits: data.data.credits,
					maxCreditLimit: data.data.maxCreditLimit ?? data.data.credits,
					userId: data.data.userId ?? '',
					lastUpdated: new Date().toISOString()
				};
			}

			// Handle direct structure
			if (typeof data.credits === 'number') {
				return {
					credits: data.credits,
					maxCreditLimit: data.maxCreditLimit ?? data.credits,
					userId: data.userId ?? '',
					lastUpdated: new Date().toISOString()
				};
			}

			return data;
		} catch (error) {
			console.error('[CreditService] Error fetching balance:', error);
			return null;
		}
	}

	/**
	 * Get cost for a specific operation (async with backend fetch)
	 */
	async function getOperationCost(operation: StandardOperationType): Promise<number> {
		try {
			const pricing = await getPricing();
			return pricing.operationCosts[operation] ?? mergedFallbackPricing[operation] ?? 0;
		} catch (error) {
			console.error('[CreditService] Error getting operation cost:', error);
			return mergedFallbackPricing[operation] ?? 0;
		}
	}

	/**
	 * Get cost for a specific operation (sync, uses cached values)
	 */
	function getOperationCostSync(operation: StandardOperationType): number {
		if (cachedPricing?.operationCosts[operation] !== undefined) {
			return cachedPricing.operationCosts[operation];
		}
		return mergedFallbackPricing[operation] ?? 0;
	}

	/**
	 * Calculate cost for multiple units of an operation
	 */
	async function calculateCost(operation: StandardOperationType, quantity: number = 1): Promise<number> {
		const unitCost = await getOperationCost(operation);
		return unitCost * quantity;
	}

	/**
	 * Calculate cost synchronously (uses cached values)
	 */
	function calculateCostSync(operation: StandardOperationType, quantity: number = 1): number {
		const unitCost = getOperationCostSync(operation);
		return unitCost * quantity;
	}

	/**
	 * Check if user has enough credits for an operation
	 */
	async function checkBalance(
		requiredCredits: number,
		operation?: string
	): Promise<CreditCheckResponse> {
		const balance = await getBalance();

		if (!balance) {
			return {
				hasEnoughCredits: false,
				currentCredits: 0,
				requiredCredits,
				deficit: requiredCredits
			};
		}

		const hasEnough = balance.credits >= requiredCredits;

		return {
			hasEnoughCredits: hasEnough,
			currentCredits: balance.credits,
			requiredCredits,
			deficit: hasEnough ? undefined : requiredCredits - balance.credits,
			context: operation ? { operation } : undefined
		};
	}

	/**
	 * Check if user has enough credits for a specific operation
	 */
	async function checkOperationBalance(operation: StandardOperationType): Promise<CreditCheckResponse> {
		const cost = await getOperationCost(operation);
		return checkBalance(cost, operation);
	}

	/**
	 * Format credit amount for display
	 */
	function formatCredits(amount: number, locale: string = 'en-US'): string {
		return new Intl.NumberFormat(locale).format(amount);
	}

	/**
	 * Clear pricing cache (useful for testing or forced refresh)
	 */
	function clearCache(): void {
		cachedPricing = null;
		pricingLastFetched = 0;
	}

	return {
		// Initialization
		initialize,

		// Balance operations
		getBalance,
		checkBalance,
		checkOperationBalance,

		// Pricing operations
		getPricing,
		getOperationCost,
		getOperationCostSync,
		calculateCost,
		calculateCostSync,

		// Notifications
		onCreditUpdate,
		triggerCreditUpdate,

		// Utilities
		formatCredits,
		clearCache
	};
}

/**
 * Type for the credit service instance
 */
export type CreditService = ReturnType<typeof createCreditService>;
