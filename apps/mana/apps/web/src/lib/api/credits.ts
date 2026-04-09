/**
 * Credits Service for Mana Web App
 * Handles credit balance, transactions, and packages
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

// Types
export interface CreditBalance {
	balance: number;
	totalEarned: number;
	totalSpent: number;
	/**
	 * Daily-free-credit accounting. Optional because the backend only
	 * returns these fields when the user has a free-tier allowance
	 * configured (paying users get them too but with `dailyFreeCredits = 0`).
	 * Settings UIs render the "free today" tile only when both are present.
	 */
	freeCreditsRemaining?: number;
	dailyFreeCredits?: number;
}

export interface CreditTransaction {
	id: string;
	type: 'purchase' | 'usage' | 'refund' | 'gift';
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	appId?: string;
	description?: string;
	createdAt: string;
}

export interface CreditPackage {
	id: string;
	name: string;
	description?: string;
	credits: number;
	priceEuroCents: number;
	stripePriceId?: string;
	active: boolean;
	sortOrder: number;
	metadata?: Record<string, unknown>;
}

export interface CreditPurchase {
	id: string;
	packageId: string;
	credits: number;
	priceEuroCents: number;
	status: string;
	createdAt: string;
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getAccessToken();

	const response = await fetch(`${getManaAuthUrl()}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

// Credits Service
export const creditsService = {
	/**
	 * Get current credit balance
	 */
	async getBalance(): Promise<CreditBalance> {
		return fetchWithAuth<CreditBalance>('/api/v1/credits/balance');
	},

	/**
	 * Get transaction history
	 */
	async getTransactions(limit = 50, offset = 0): Promise<CreditTransaction[]> {
		return fetchWithAuth<CreditTransaction[]>(
			`/api/v1/credits/transactions?limit=${limit}&offset=${offset}`
		);
	},

	/**
	 * Get purchase history
	 */
	async getPurchases(): Promise<CreditPurchase[]> {
		return fetchWithAuth<CreditPurchase[]>('/api/v1/credits/purchases');
	},

	/**
	 * Get available credit packages (public endpoint)
	 */
	async getPackages(): Promise<CreditPackage[]> {
		const response = await fetch(`${getManaAuthUrl()}/api/v1/credits/packages`);
		if (!response.ok) {
			throw new Error('Failed to fetch packages');
		}
		return response.json();
	},

	/**
	 * Use credits (for apps that need to deduct credits)
	 */
	async useCredits(
		amount: number,
		appId: string,
		description: string
	): Promise<{ success: boolean; newBalance: CreditBalance }> {
		return fetchWithAuth('/api/v1/credits/use', {
			method: 'POST',
			body: JSON.stringify({ amount, appId, description }),
		});
	},

	/**
	 * Initiate a credit purchase via Stripe Checkout
	 */
	async initiatePurchase(packageId: string): Promise<{
		purchaseId: string;
		checkoutUrl: string;
		amount: number;
		credits: number;
	}> {
		const successUrl = `${window.location.origin}/credits?success=true`;
		const cancelUrl = `${window.location.origin}/credits?canceled=true`;

		return fetchWithAuth('/api/v1/credits/purchase', {
			method: 'POST',
			body: JSON.stringify({ packageId, successUrl, cancelUrl }),
		});
	},
};
