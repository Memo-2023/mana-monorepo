/**
 * Referrals Service for ManaCore Web App
 * Handles referral codes, stats, and referral tracking
 */

import { authStore } from '$lib/stores/auth.svelte';

const MANA_AUTH_URL = 'http://localhost:3001'; // TODO: Use PUBLIC_MANA_CORE_AUTH_URL from env

// Types
export interface ReferralStats {
	totalReferrals: number;
	activeReferrals: number;
	pendingReferrals: number;
	qualifiedReferrals: number;
	totalCreditsEarned: number;
	currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
	tierProgress: {
		current: number;
		nextTierAt: number;
		percentToNext: number;
	};
}

export interface ReferralCode {
	code: string;
	createdAt: string;
	usageCount: number;
	maxUses?: number;
	expiresAt?: string;
	bonusCredits: number;
	referrerBonus: number;
}

export interface Referral {
	id: string;
	referredUserId: string;
	referredEmail?: string;
	stage: 'registered' | 'activated' | 'qualified' | 'retained';
	creditsEarned: number;
	registeredAt: string;
	activatedAt?: string;
	qualifiedAt?: string;
	retainedAt?: string;
}

export interface ReferralValidation {
	valid: boolean;
	referrerName?: string;
	bonusCredits?: number;
	error?: string;
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

// Referrals Service
export const referralsService = {
	/**
	 * Get referral stats for the current user
	 */
	async getStats(): Promise<ReferralStats> {
		return fetchWithAuth<ReferralStats>('/api/v1/referrals/stats');
	},

	/**
	 * Get the user's referral code (creates one if doesn't exist)
	 */
	async getCode(): Promise<ReferralCode> {
		return fetchWithAuth<ReferralCode>('/api/v1/referrals/code');
	},

	/**
	 * Generate a new referral code
	 */
	async generateCode(): Promise<ReferralCode> {
		return fetchWithAuth<ReferralCode>('/api/v1/referrals/code', {
			method: 'POST',
		});
	},

	/**
	 * Get list of referrals made by the current user
	 */
	async getReferrals(limit = 50, offset = 0): Promise<Referral[]> {
		return fetchWithAuth<Referral[]>(`/api/v1/referrals/list?limit=${limit}&offset=${offset}`);
	},

	/**
	 * Validate a referral code (public endpoint - for registration)
	 */
	async validateCode(code: string): Promise<ReferralValidation> {
		try {
			const response = await fetch(`${MANA_AUTH_URL}/api/v1/referrals/validate/${code}`);
			if (!response.ok) {
				return { valid: false, error: 'Invalid code' };
			}
			const data = await response.json();
			return {
				valid: data.valid,
				referrerName: data.referrerName,
				bonusCredits: data.bonusCredits || 25,
				error: data.error,
			};
		} catch {
			return { valid: false, error: 'Validation failed' };
		}
	},

	/**
	 * Get shareable referral link
	 */
	getShareLink(code: string): string {
		// Use current origin or fallback
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://manacore.app';
		return `${baseUrl}/register?ref=${code}`;
	},

	/**
	 * Copy referral link to clipboard
	 */
	async copyShareLink(code: string): Promise<boolean> {
		try {
			const link = this.getShareLink(code);
			await navigator.clipboard.writeText(link);
			return true;
		} catch {
			return false;
		}
	},
};
