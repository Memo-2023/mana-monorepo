/**
 * Gifts Service for Mana Web App
 * Handles gift code operations
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

// Types
export interface GiftCodeInfo {
	code: string;
	type: 'simple' | 'personalized';
	status: 'active' | 'depleted' | 'expired' | 'cancelled' | 'refunded';
	totalCredits: number;
	redeemed: boolean;
	message?: string;
	isPersonalized: boolean;
	expiresAt?: string;
	creatorName?: string;
}

export interface GiftRedeemResponse {
	success: boolean;
	credits?: number;
	message?: string;
	error?: string;
	newBalance?: number;
}

export interface GiftListItem {
	id: string;
	code: string;
	url: string;
	type: string;
	status: string;
	totalCredits: number;
	redeemed: number;
	message?: string;
	expiresAt?: string;
	createdAt: string;
}

export interface ReceivedGiftItem {
	id: string;
	code: string;
	credits: number;
	message?: string;
	creatorName?: string;
	redeemedAt: string;
}

export interface CreateGiftResponse {
	id: string;
	code: string;
	url: string;
	totalCredits: number;
	type: string;
	expiresAt?: string;
}

export interface CreateGiftRequest {
	credits: number;
	type?: 'simple' | 'personalized';
	targetEmail?: string;
	message?: string;
	expiresAt?: string;
	sourceAppId?: string;
}

// Helper function for public requests (no auth required)
async function fetchPublic<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${getManaAuthUrl()}${endpoint}`, {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getValidToken();

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

// Gifts Service
export const giftsService = {
	/**
	 * Get gift code info (public - no auth required)
	 */
	async getGiftInfo(code: string): Promise<GiftCodeInfo> {
		return fetchPublic<GiftCodeInfo>(`/api/v1/gifts/${code.toUpperCase()}`);
	},

	/**
	 * Redeem a gift code
	 */
	async redeemGift(code: string): Promise<GiftRedeemResponse> {
		return fetchWithAuth<GiftRedeemResponse>(`/api/v1/gifts/${code.toUpperCase()}/redeem`, {
			method: 'POST',
			body: JSON.stringify({ sourceAppId: 'mana-web' }),
		});
	},

	/**
	 * List gift codes created by the authenticated user
	 */
	async getCreatedGifts(): Promise<GiftListItem[]> {
		return fetchWithAuth<GiftListItem[]>('/api/v1/gifts/me/created');
	},

	/**
	 * List gifts received by the authenticated user
	 */
	async getReceivedGifts(): Promise<ReceivedGiftItem[]> {
		return fetchWithAuth<ReceivedGiftItem[]>('/api/v1/gifts/me/received');
	},

	/**
	 * Create a new gift code
	 */
	async createGift(request: CreateGiftRequest): Promise<CreateGiftResponse> {
		return fetchWithAuth<CreateGiftResponse>('/api/v1/gifts', {
			method: 'POST',
			body: JSON.stringify({ ...request, sourceAppId: 'mana-web' }),
		});
	},

	/**
	 * Cancel a gift code and get refund
	 */
	async cancelGift(id: string): Promise<{ refundedCredits: number }> {
		return fetchWithAuth<{ refundedCredits: number }>(`/api/v1/gifts/${id}`, {
			method: 'DELETE',
		});
	},
};
