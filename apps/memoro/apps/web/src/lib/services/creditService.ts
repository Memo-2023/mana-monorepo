/**
 * Credit Service for Memoro Web
 * Handles credit operations and pricing via memoro-server (Hono/Bun).
 */

import { env } from '$lib/config/env';
import { authStore } from '$lib/stores/auth.svelte';

const SERVER_URL = () => env.server.memoroUrl.replace(/\/$/, '');

export interface CreditCheckResponse {
	hasEnoughCredits: boolean;
	currentCredits: number;
	requiredCredits: number;
	creditType: 'user' | 'space';
	durationMinutes?: number;
	estimatedCostPerHour?: number;
}

export interface PricingResponse {
	costs: {
		TRANSCRIPTION_PER_MINUTE: number;
		HEADLINE_GENERATION: number;
		MEMORY_CREATION: number;
		BLUEPRINT_PROCESSING: number;
		QUESTION_MEMO: number;
		NEW_MEMORY: number;
		MEMO_COMBINE: number;
		MEETING_RECORDING_PER_MINUTE: number;
	};
}

type OperationType =
	| 'HEADLINE_GENERATION'
	| 'MEMORY_CREATION'
	| 'BLUEPRINT_PROCESSING'
	| 'QUESTION_MEMO'
	| 'NEW_MEMORY'
	| 'MEMO_COMBINE';

const FALLBACK_COSTS: Record<OperationType, number> = {
	HEADLINE_GENERATION: 10,
	MEMORY_CREATION: 10,
	BLUEPRINT_PROCESSING: 5,
	QUESTION_MEMO: 5,
	NEW_MEMORY: 5,
	MEMO_COMBINE: 5,
};

class CreditService {
	private creditUpdateCallbacks: ((creditsConsumed: number) => void)[] = [];
	private cachedPricing: PricingResponse | null = null;
	private pricingLastFetched = 0;
	private readonly PRICING_CACHE_DURATION = 30 * 60 * 1000;

	async initialize(): Promise<void> {
		try {
			await this.getPricing();
		} catch (error) {
			console.warn('CreditService initialization failed, using fallback pricing:', error);
		}
	}

	onCreditUpdate(callback: (creditsConsumed: number) => void): () => void {
		this.creditUpdateCallbacks.push(callback);
		return () => {
			const i = this.creditUpdateCallbacks.indexOf(callback);
			if (i > -1) this.creditUpdateCallbacks.splice(i, 1);
		};
	}

	triggerCreditUpdate(creditsConsumed: number): void {
		this.creditUpdateCallbacks.forEach((cb) => {
			try { cb(creditsConsumed); } catch {}
		});
	}

	async getPricing(): Promise<PricingResponse> {
		const now = Date.now();
		if (this.cachedPricing && now - this.pricingLastFetched < this.PRICING_CACHE_DURATION) {
			return this.cachedPricing;
		}

		try {
			const response = await fetch(`${SERVER_URL()}/api/v1/credits/pricing`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const pricing = await response.json();
			this.cachedPricing = pricing;
			this.pricingLastFetched = now;
			return pricing;
		} catch (error) {
			console.error('Error fetching pricing:', error);
			if (this.cachedPricing) return this.cachedPricing;
			return {
				costs: {
					TRANSCRIPTION_PER_MINUTE: 2,
					HEADLINE_GENERATION: 10,
					MEMORY_CREATION: 10,
					BLUEPRINT_PROCESSING: 5,
					QUESTION_MEMO: 5,
					NEW_MEMORY: 5,
					MEMO_COMBINE: 5,
					MEETING_RECORDING_PER_MINUTE: 2,
				},
			};
		}
	}

	async getUserCredits(token: string): Promise<{ credits: number } | null> {
		try {
			if (!token) throw new Error('No authentication token available');
			const response = await fetch(`${SERVER_URL()}/api/v1/credits/balance`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			});
			if (!response.ok) return null;
			return await response.json();
		} catch (error) {
			console.error('[CreditService] Error fetching user credits:', error);
			return null;
		}
	}

	async getOperationCost(operation: OperationType): Promise<number> {
		try {
			const pricing = await this.getPricing();
			return pricing.costs[operation] ?? FALLBACK_COSTS[operation];
		} catch {
			return FALLBACK_COSTS[operation];
		}
	}

	getOperationCostSync(operation: OperationType): number {
		if (this.cachedPricing) return this.cachedPricing.costs[operation] ?? FALLBACK_COSTS[operation];
		return FALLBACK_COSTS[operation];
	}

	async calculateMemoCombineCost(memoCount: number): Promise<number> {
		return memoCount * (await this.getOperationCost('MEMO_COMBINE'));
	}

	calculateMemoCombineCostSync(memoCount: number): number {
		return memoCount * this.getOperationCostSync('MEMO_COMBINE');
	}

	async retryTranscription(memoId: string, token: string): Promise<{ success: boolean; message: string }> {
		if (!token) throw new Error('No authentication token available');
		const response = await fetch(`${SERVER_URL()}/api/v1/memos/${memoId}/retry-transcription`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			const d = await response.json().catch(() => ({}));
			throw new Error(d.error || `HTTP ${response.status}`);
		}
		return { success: true, message: 'Memo reprocessing started successfully' };
	}

	async retryHeadline(memoId: string, token: string): Promise<{ success: boolean; message: string }> {
		if (!token) throw new Error('No authentication token available');
		const response = await fetch(`${SERVER_URL()}/api/v1/memos/${memoId}/retry-headline`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		});
		if (!response.ok) {
			const d = await response.json().catch(() => ({}));
			throw new Error(d.error || `HTTP ${response.status}`);
		}
		return { success: true, message: 'Headline generation retry initiated successfully' };
	}
}

export const creditService = new CreditService();
