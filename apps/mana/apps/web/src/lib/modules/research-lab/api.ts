/**
 * Research Lab API client — talks directly to `mana-research` on port 3068.
 *
 * Auth header is the same EdDSA JWT that mana-auth issues; mana-research
 * verifies against the same JWKS, so no extra setup needed.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaResearchUrl } from '$lib/api/config';
import type {
	ExtractCompareResponse,
	ProvidersCatalog,
	ProvidersHealth,
	ResearchCompareResponse,
	RunSummary,
	SearchCompareResponse,
} from './types';

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(await authHeader()),
		...((init.headers as Record<string, string>) ?? {}),
	};

	const res = await fetch(`${getManaResearchUrl()}${path}`, { ...init, headers });
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		let message = text;
		try {
			const parsed = JSON.parse(text) as { message?: string; error?: string };
			message = parsed.message ?? parsed.error ?? text;
		} catch {
			/* raw text fallback */
		}
		throw new Error(message || `mana-research ${path} failed (${res.status})`);
	}
	return (await res.json()) as T;
}

// ─── Providers catalog + health ─────────────────────────────

export function getProviders(): Promise<ProvidersCatalog> {
	return request<ProvidersCatalog>('/api/v1/providers');
}

export function getProvidersHealth(): Promise<ProvidersHealth> {
	return request<ProvidersHealth>('/api/v1/providers/health');
}

// ─── Search compare ─────────────────────────────────────────

export function compareSearch(
	query: string,
	providers: string[],
	options: { limit?: number; language?: string; categories?: string[] } = {}
): Promise<SearchCompareResponse> {
	return request<SearchCompareResponse>('/api/v1/search/compare', {
		method: 'POST',
		body: JSON.stringify({ query, providers, options }),
	});
}

// ─── Extract compare ────────────────────────────────────────

export function compareExtract(
	url: string,
	providers: string[],
	options: { maxLength?: number } = {}
): Promise<ExtractCompareResponse> {
	return request<ExtractCompareResponse>('/api/v1/extract/compare', {
		method: 'POST',
		body: JSON.stringify({ url, providers, options }),
	});
}

// ─── Research (agent) compare ───────────────────────────────

export function compareResearch(
	query: string,
	providers: string[],
	options: { model?: string; maxTokens?: number } = {}
): Promise<ResearchCompareResponse> {
	return request<ResearchCompareResponse>('/api/v1/research/compare', {
		method: 'POST',
		body: JSON.stringify({ query, providers, options }),
	});
}

// ─── Runs history ───────────────────────────────────────────

export function listRuns(limit = 50, offset = 0): Promise<{ runs: RunSummary[] }> {
	return request<{ runs: RunSummary[] }>(`/api/v1/runs?limit=${limit}&offset=${offset}`);
}

export function getRun(id: string): Promise<{ run: RunSummary; results: unknown[] }> {
	return request<{ run: RunSummary; results: unknown[] }>(`/api/v1/runs/${id}`);
}

export function rateResult(
	runId: string,
	resultId: string,
	rating: number,
	notes?: string
): Promise<{ success: boolean }> {
	return request<{ success: boolean }>(`/api/v1/runs/${runId}/results/${resultId}/rate`, {
		method: 'POST',
		body: JSON.stringify({ rating, notes }),
	});
}
