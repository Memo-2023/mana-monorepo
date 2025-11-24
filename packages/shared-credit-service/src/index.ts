/**
 * @manacore/shared-credit-service
 *
 * Shared credit/mana service for the ManaCore monorepo.
 *
 * Provides:
 * - Credit balance fetching and caching
 * - Operation pricing with fallbacks
 * - Credit check before operations
 * - Credit consumption notifications
 *
 * @example Basic usage
 * ```ts
 * import { createCreditService } from '@manacore/shared-credit-service';
 *
 * const creditService = createCreditService({
 *   apiUrl: 'https://api.myapp.com',
 *   getAuthToken: async () => localStorage.getItem('token')
 * });
 *
 * // Initialize on app startup
 * await creditService.initialize();
 *
 * // Check balance before operation
 * const check = await creditService.checkOperationBalance('STORY_CREATION');
 * if (!check.hasEnoughCredits) {
 *   showInsufficientCreditsModal(check.deficit);
 *   return;
 * }
 *
 * // After successful operation, notify listeners
 * creditService.triggerCreditUpdate(10, 'STORY_CREATION');
 * ```
 *
 * @example With Svelte store integration
 * ```ts
 * // creditService.ts
 * import { createCreditService } from '@manacore/shared-credit-service';
 * import { auth } from '$lib/stores/auth';
 *
 * export const creditService = createCreditService({
 *   apiUrl: import.meta.env.VITE_API_URL,
 *   pricingEndpoint: '/credits/pricing',
 *   getAuthToken: () => auth.getToken()
 * });
 *
 * // creditStore.svelte.ts
 * import { creditService } from './creditService';
 *
 * let balance = $state<number>(0);
 *
 * // Listen for credit updates
 * creditService.onCreditUpdate((consumed) => {
 *   balance -= consumed;
 * });
 * ```
 */

// Factory function
export { createCreditService } from './createCreditService';
export type { CreditService } from './createCreditService';

// Types
export type {
	CreditServiceConfig,
	CreditBalance,
	CreditCheckResponse,
	CreditConsumptionResponse,
	PricingResponse,
	CreditUpdateCallback,
	StandardOperationType
} from './types';

// Constants
export { DEFAULT_OPERATION_PRICING } from './types';
