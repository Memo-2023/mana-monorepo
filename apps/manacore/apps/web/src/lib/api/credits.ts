/**
 * Credits Service for ManaCore Web App
 * Handles credit balance, transactions, and packages
 */

import { authStore } from '$lib/stores/authStore.svelte';

const MANA_AUTH_URL = 'http://localhost:3001'; // TODO: Use PUBLIC_MANA_CORE_AUTH_URL from env

// Types
export interface CreditBalance {
	balance: number;
	freeCreditsRemaining: number;
	totalEarned: number;
	totalSpent: number;
	dailyFreeCredits: number;
}

export interface CreditTransaction {
	id: string;
	type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'expiry' | 'adjustment';
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

	const response = await fetch(`${MANA_AUTH_URL}${endpoint}`, {
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
		const response = await fetch(`${MANA_AUTH_URL}/api/v1/credits/packages`);
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
};
