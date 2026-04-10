/**
 * Sync Billing Service for Mana Web App
 * Handles sync subscription status, activation, and deactivation
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

// Types
export type BillingInterval = 'monthly' | 'quarterly' | 'yearly';

export interface SyncStatus {
	active: boolean;
	interval: BillingInterval;
	nextChargeAt: string | null;
	pausedAt: string | null;
}

export interface SyncActivateResponse {
	success: boolean;
	active: boolean;
	interval: BillingInterval;
	nextChargeAt: string;
	amountCharged: number;
}

// Helper
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

// Sync Service
export const syncService = {
	async getSyncStatus(): Promise<SyncStatus> {
		return fetchWithAuth<SyncStatus>('/api/v1/sync/status');
	},

	async activateSync(interval: BillingInterval = 'monthly'): Promise<SyncActivateResponse> {
		return fetchWithAuth<SyncActivateResponse>('/api/v1/sync/activate', {
			method: 'POST',
			body: JSON.stringify({ interval }),
		});
	},

	async deactivateSync(): Promise<{ success: boolean }> {
		return fetchWithAuth<{ success: boolean }>('/api/v1/sync/deactivate', {
			method: 'POST',
			body: JSON.stringify({}),
		});
	},

	async changeInterval(
		interval: BillingInterval
	): Promise<{ success: boolean; interval: BillingInterval; amountCharged: number }> {
		return fetchWithAuth('/api/v1/sync/change-interval', {
			method: 'POST',
			body: JSON.stringify({ interval }),
		});
	},
};
