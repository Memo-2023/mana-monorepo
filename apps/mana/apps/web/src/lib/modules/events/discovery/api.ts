/**
 * Discovery HTTP client — JWT-authenticated calls to mana-events discovery endpoints.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaEventsUrl } from '$lib/api/config';
import type { DiscoveryRegion, DiscoveryInterest, DiscoverySource, DiscoveredEvent } from './types';

async function fetchWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token = await authStore.getValidToken();
	const res = await fetch(`${getManaEventsUrl()}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init.headers,
		},
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(err.message || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

// ─── Regions ────────────────────────────────────────────────────────

export async function getRegions(): Promise<DiscoveryRegion[]> {
	const { regions } = await fetchWithAuth<{ regions: DiscoveryRegion[] }>(
		'/api/v1/discovery/regions'
	);
	return regions;
}

export async function createRegion(input: {
	label: string;
	lat: number;
	lon: number;
	radiusKm?: number;
}): Promise<DiscoveryRegion> {
	const { region } = await fetchWithAuth<{ region: DiscoveryRegion }>('/api/v1/discovery/regions', {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return region;
}

export async function updateRegion(
	id: string,
	input: { label?: string; radiusKm?: number; isActive?: boolean }
): Promise<DiscoveryRegion> {
	const { region } = await fetchWithAuth<{ region: DiscoveryRegion }>(
		`/api/v1/discovery/regions/${id}`,
		{ method: 'PUT', body: JSON.stringify(input) }
	);
	return region;
}

export async function deleteRegion(id: string): Promise<void> {
	await fetchWithAuth(`/api/v1/discovery/regions/${id}`, { method: 'DELETE' });
}

// ─── Interests ──────────────────────────────────────────────────────

export async function getInterests(): Promise<DiscoveryInterest[]> {
	const { interests } = await fetchWithAuth<{ interests: DiscoveryInterest[] }>(
		'/api/v1/discovery/interests'
	);
	return interests;
}

export async function createInterest(input: {
	category: string;
	freetext?: string | null;
	weight?: number;
}): Promise<DiscoveryInterest> {
	const { interest } = await fetchWithAuth<{ interest: DiscoveryInterest }>(
		'/api/v1/discovery/interests',
		{ method: 'POST', body: JSON.stringify(input) }
	);
	return interest;
}

export async function deleteInterest(id: string): Promise<void> {
	await fetchWithAuth(`/api/v1/discovery/interests/${id}`, { method: 'DELETE' });
}

// ─── Sources ────────────────────────────────────────────────────────

export async function getSources(): Promise<DiscoverySource[]> {
	const { sources } = await fetchWithAuth<{ sources: DiscoverySource[] }>(
		'/api/v1/discovery/sources'
	);
	return sources;
}

export async function createSource(input: {
	type: 'ical' | 'website';
	url: string;
	name: string;
	regionId: string;
	crawlIntervalHours?: number;
}): Promise<DiscoverySource> {
	const { source } = await fetchWithAuth<{ source: DiscoverySource }>('/api/v1/discovery/sources', {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return source;
}

export async function deleteSource(id: string): Promise<void> {
	await fetchWithAuth(`/api/v1/discovery/sources/${id}`, { method: 'DELETE' });
}

export async function crawlSourceNow(id: string): Promise<{ upserted: number; error?: string }> {
	return fetchWithAuth(`/api/v1/discovery/sources/${id}/crawl`, { method: 'POST' });
}

export async function activateSource(id: string): Promise<DiscoverySource> {
	const { source } = await fetchWithAuth<{ source: DiscoverySource }>(
		`/api/v1/discovery/sources/${id}/activate`,
		{ method: 'PUT' }
	);
	return source;
}

export async function rejectSource(id: string): Promise<void> {
	await fetchWithAuth(`/api/v1/discovery/sources/${id}/reject`, { method: 'DELETE' });
}

export async function discoverSources(
	regionId: string
): Promise<{ suggestedCount: number; queries: number; searchResults: number }> {
	return fetchWithAuth(`/api/v1/discovery/regions/${regionId}/discover-sources`, {
		method: 'POST',
	});
}

// ─── Feed ───────────────────────────────────────────────────────────

export interface FeedParams {
	from?: string;
	to?: string;
	category?: string;
	limit?: number;
	offset?: number;
	hideDismissed?: boolean;
}

export async function getFeed(
	params: FeedParams = {}
): Promise<{ events: DiscoveredEvent[]; total: number; hasMore: boolean }> {
	const searchParams = new URLSearchParams();
	if (params.from) searchParams.set('from', params.from);
	if (params.to) searchParams.set('to', params.to);
	if (params.category) searchParams.set('category', params.category);
	if (params.limit) searchParams.set('limit', String(params.limit));
	if (params.offset) searchParams.set('offset', String(params.offset));
	if (params.hideDismissed) searchParams.set('hideDismissed', 'true');

	const qs = searchParams.toString();
	return fetchWithAuth(`/api/v1/discovery/feed${qs ? `?${qs}` : ''}`);
}

export async function setEventAction(eventId: string, action: 'save' | 'dismiss'): Promise<void> {
	await fetchWithAuth(`/api/v1/discovery/feed/${eventId}/action`, {
		method: 'POST',
		body: JSON.stringify({ action }),
	});
}
