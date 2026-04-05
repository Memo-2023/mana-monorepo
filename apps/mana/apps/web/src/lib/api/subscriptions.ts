/**
 * Subscriptions Service for Mana Web App
 * Handles subscription plans, checkout, and billing portal
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

// Types
export interface SubscriptionPlan {
	id: string;
	name: string;
	description?: string;
	monthlyCredits: number;
	priceMonthlyEuroCents: number;
	priceYearlyEuroCents: number;
	features: string[];
	isDefault: boolean;
	active: boolean;
	sortOrder: number;
	stripePriceIdMonthly?: string;
	stripePriceIdYearly?: string;
}

export interface Subscription {
	id: string;
	userId: string;
	planId: string;
	status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
	billingInterval: 'month' | 'year';
	currentPeriodStart: string;
	currentPeriodEnd: string;
	cancelAtPeriodEnd: boolean;
	stripeSubscriptionId?: string;
}

export interface Invoice {
	id: string;
	number?: string;
	status: string;
	amountDueEuroCents: number;
	amountPaidEuroCents: number;
	currency: string;
	hostedInvoiceUrl?: string;
	invoicePdfUrl?: string;
	periodStart?: string;
	periodEnd?: string;
	paidAt?: string;
	createdAt: string;
}

export interface CurrentSubscription {
	plan: SubscriptionPlan | null;
	subscription: Subscription | null;
	isFreePlan: boolean;
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

// Subscriptions Service
export const subscriptionsService = {
	/**
	 * Get all available plans (public)
	 */
	async getPlans(): Promise<SubscriptionPlan[]> {
		const response = await fetch(`${getManaAuthUrl()}/api/v1/subscriptions/plans`);
		if (!response.ok) {
			throw new Error('Failed to fetch plans');
		}
		return response.json();
	},

	/**
	 * Get current subscription
	 */
	async getCurrentSubscription(): Promise<CurrentSubscription> {
		return fetchWithAuth<CurrentSubscription>('/api/v1/subscriptions/current');
	},

	/**
	 * Create checkout session for subscription
	 */
	async createCheckout(
		planId: string,
		billingInterval: 'month' | 'year'
	): Promise<{ sessionId: string; url: string }> {
		const successUrl = `${window.location.origin}/subscription?success=true`;
		const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

		return fetchWithAuth('/api/v1/subscriptions/checkout', {
			method: 'POST',
			body: JSON.stringify({
				planId,
				billingInterval,
				successUrl,
				cancelUrl,
			}),
		});
	},

	/**
	 * Open billing portal for self-service
	 */
	async openPortal(): Promise<{ url: string }> {
		const returnUrl = `${window.location.origin}/subscription`;

		return fetchWithAuth('/api/v1/subscriptions/portal', {
			method: 'POST',
			body: JSON.stringify({ returnUrl }),
		});
	},

	/**
	 * Cancel subscription (at period end)
	 */
	async cancelSubscription(): Promise<{ success: boolean; cancelAtPeriodEnd: boolean }> {
		return fetchWithAuth('/api/v1/subscriptions/cancel', {
			method: 'POST',
		});
	},

	/**
	 * Reactivate canceled subscription
	 */
	async reactivateSubscription(): Promise<{ success: boolean }> {
		return fetchWithAuth('/api/v1/subscriptions/reactivate', {
			method: 'POST',
		});
	},

	/**
	 * Get invoice history
	 */
	async getInvoices(limit = 20): Promise<Invoice[]> {
		return fetchWithAuth<Invoice[]>(`/api/v1/subscriptions/invoices?limit=${limit}`);
	},
};
